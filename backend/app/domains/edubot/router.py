from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import httpx
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User
from app.config import settings
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(tags=["EduBot"])
limiter = Limiter(key_func=get_remote_address)

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

Responde siempre en español, de forma clara y precisa.
NO respondas preguntas que no estén relacionadas con normativa ETDH o gestión documental educativa."""


class MessageRequest(BaseModel):
    message: str
    history: Optional[list] = []


@router.post("/edubot/chat")
@limiter.limit("20/minute")
async def chat(
    request: Request,
    data: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Servicio de IA no disponible.")

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in data.history or []:
        if msg.get("role") in ["user", "assistant"]:
            messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": data.message})

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.3,
                },
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=500, detail="Error al contactar el servicio de IA."
            )

        result = response.json()
        reply = result["choices"][0]["message"]["content"]
        return {"reply": reply}

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504, detail="EduBot tardó demasiado. Intenta de nuevo."
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno en EduBot.")
