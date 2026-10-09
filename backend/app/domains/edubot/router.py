from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User
from app.domains.documents.models import DocumentTemplate
from app.domains.documents.services import build_institution_context
from app.domains.institutions.services import get_institution
from app.domains.edubot.groq_client import (
    GroqError,
    chat_model,
    draft_model,
    groq_chat,
    is_configured,
)
from app.domains.edubot.drafting import (
    AI_DRAFT_FIELDS,
    MAX_NOTES_CHARS,
    ai_draft_enabled,
    build_messages,
    draftable_fields,
    parse_response,
)
from app.domains.edubot.usage import (
    check_chat_quota,
    get_chat_usage,
    record_chat_message,
)
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(tags=["EduBot"])
limiter = Limiter(key_func=get_remote_address)

MAX_MESSAGE_CHARS = 2000
MAX_HISTORY_MESSAGES = 10

SYSTEM_PROMPT = """Eres EduBot, el asistente normativo de EasyDocs para instituciones de Educación para el Trabajo y el Desarrollo Humano (ETDH) en Colombia.

Tu rol es orientar a directivos, docentes y personal administrativo de instituciones ETDH sobre:
- Los libros y registros reglamentarios (LR001 al LR009) definidos por la Secretaría de Educación de Medellín
- Los certificados y constancias del Capítulo II
- El Decreto 1075 de 2015 y su aplicación en instituciones ETDH
- La Guía Básica para el Manejo de Libros y Registros Reglamentarios ETDH de la Secretaría de Educación de Medellín (2020)
- La Ley 594 de 2000 (Ley General de Archivo)
- Procedimientos para diligenciar correctamente cada documento
- Firmas requeridas en cada documento
- Tiempos de conservación de los libros reglamentarios

Responde siempre en español, de forma clara, precisa y breve.
Formato: texto corto; puedes usar **negritas** y listas con guiones. No uses tablas ni títulos con #.
Si no estás seguro de un dato normativo (un número de artículo, un plazo), dilo y recomienda verificarlo con la Secretaría de Educación.
NO respondas preguntas que no estén relacionadas con normativa ETDH o gestión documental educativa."""


class MessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=MAX_MESSAGE_CHARS)
    history: Optional[list] = []


def _clean_history(history: Optional[list]) -> list[dict]:
    """Solo mensajes válidos, recortados y los más recientes."""
    cleaned = []
    for msg in history or []:
        if not isinstance(msg, dict):
            raise HTTPException(
                status_code=400, detail="Formato de historial inválido."
            )
        role, content = msg.get("role"), msg.get("content")
        if (
            role in ("user", "assistant")
            and isinstance(content, str)
            and content.strip()
        ):
            cleaned.append({"role": role, "content": content[:MAX_MESSAGE_CHARS]})
    return cleaned[-MAX_HISTORY_MESSAGES:]


def _ai_unavailable() -> HTTPException:
    return HTTPException(status_code=503, detail="Servicio de IA no disponible.")


@router.post("/edubot/chat")
@limiter.limit("20/minute")
async def chat(
    request: Request,
    data: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not is_configured():
        raise _ai_unavailable()
    check_chat_quota(db, current_user)  # 403 si ya gastó las consultas del mes

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += _clean_history(data.history)
    messages.append({"role": "user", "content": data.message})

    try:
        reply = await groq_chat(
            messages, model=chat_model(), max_tokens=1500, temperature=0.3
        )
    except GroqError as e:
        if e.timeout:
            raise HTTPException(
                status_code=504, detail="EduBot tardó demasiado. Intenta de nuevo."
            )
        raise HTTPException(
            status_code=502, detail="Error al contactar el servicio de IA."
        )

    if not reply.strip():
        raise HTTPException(
            status_code=502, detail="EduBot no pudo responder. Intenta de nuevo."
        )

    # Solo se cuenta la consulta cuando EduBot sí respondió
    usage = record_chat_message(db, current_user)
    return {"reply": reply, "usage": usage}


@router.get("/edubot/chat/usage")
def chat_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Consultas usadas este mes y tope del plan (limit null = ilimitado)."""
    return get_chat_usage(db, current_user)


# --- Borrador con IA ---------------------------------------------------------
class DraftRequest(BaseModel):
    template_id: str
    fields: list[str] = Field(..., min_length=1)
    notes: str = Field("", max_length=MAX_NOTES_CHARS)
    # Valores actuales del formulario. Solo se usan los campos a redactar y
    # algunos de contexto no personales (ver drafting.CONTEXT_FIELDS).
    current_values: dict = {}


@router.get("/edubot/draft/config")
def draft_config(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Qué plantillas admiten borrador con IA y si el plan lo incluye."""
    return {
        "enabled": is_configured() and ai_draft_enabled(db, current_user),
        "configured": is_configured(),
        "fields": {
            doc_type: [
                {"name": name, "label": info["label"]} for name, info in fields.items()
            ]
            for doc_type, fields in AI_DRAFT_FIELDS.items()
        },
    }


@router.post("/edubot/draft")
@limiter.limit("10/hour")
async def draft_fields(
    request: Request,
    data: DraftRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not is_configured():
        raise _ai_unavailable()
    if not ai_draft_enabled(db, current_user):
        raise HTTPException(
            status_code=403,
            detail={
                "message": "El borrador con IA no está incluido en tu plan.",
                "feature_locked": True,
            },
        )

    template = db.execute(
        select(DocumentTemplate).where(DocumentTemplate.id == data.template_id)
    ).scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Plantilla no encontrada.")

    allowed = draftable_fields(template)
    fields = [f for f in dict.fromkeys(data.fields) if f in allowed]
    if not fields:
        raise HTTPException(
            status_code=400,
            detail="Esta plantilla no tiene campos que EduBot pueda redactar.",
        )
    if not data.notes.strip() and not any(
        isinstance(data.current_values.get(f), str) and data.current_values[f].strip()
        for f in fields
    ):
        raise HTTPException(
            status_code=400,
            detail="Escribe unas notas para que EduBot sepa qué redactar.",
        )

    institution = build_institution_context(
        get_institution(db, current_user.institution_id)
    )
    messages = build_messages(
        template, fields, data.notes, data.current_values or {}, institution
    )

    try:
        content = await groq_chat(
            messages,
            model=draft_model(),
            max_tokens=4096,
            temperature=0.2,
            json_mode=True,
            timeout=60,
        )
    except GroqError as e:
        if e.timeout:
            raise HTTPException(
                status_code=504, detail="EduBot tardó demasiado. Intenta de nuevo."
            )
        raise HTTPException(
            status_code=502, detail="Error al contactar el servicio de IA."
        )

    result = parse_response(content, fields)
    if not result:
        raise HTTPException(
            status_code=502,
            detail="EduBot no pudo redactar el texto. Intenta de nuevo.",
        )
    return {"fields": result}
