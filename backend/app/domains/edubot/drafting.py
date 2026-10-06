"""Borrador con IA: EduBot redacta los campos de texto largo de algunas plantillas.

Reglas:
- Solo se envían a la IA las notas que escribe el usuario, los datos generales
  de la institución y algunos campos no personales de la plantilla. Nunca
  nombres, documentos ni teléfonos de estudiantes.
- Las notas pasan por `redact_personal_data` antes de salir del servidor.
- El texto vuelve al formulario como sugerencia; el documento queda como
  "Borrador IA" hasta que una persona lo revise y lo genere.
"""

import json
import re

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.features import get_active_subscription

# Misma llave de Plan.features que ya usan los planes ("EduBot IA" en
# Profesional y Empresarial). Se activa o desactiva por plan en AdminPlans.
FEATURE_KEY = "edubot"

MAX_NOTES_CHARS = 4000
MAX_FIELD_CHARS = 2500

# Campos que EduBot puede redactar, por tipo de plantilla.
# label = cómo se muestra; guide = qué debe contener (va en el prompt).
AI_DRAFT_FIELDS: dict[str, dict[str, dict[str, str]]] = {
    "LR001": {
        "mision": {
            "label": "Misión",
            "guide": "Misión institucional: qué hace la institución, para quién y con qué propósito. Un párrafo.",
        },
        "vision": {
            "label": "Visión",
            "guide": "Visión institucional a mediano plazo (indica el año si las notas lo dan). Un párrafo.",
        },
        "principios_fines": {
            "label": "Principios y fines",
            "guide": "Principios y fines institucionales coherentes con la educación para el trabajo y el desarrollo humano.",
        },
        "estrategia_pedagogica": {
            "label": "Estrategia pedagógica",
            "guide": "Modelo y estrategia pedagógica: formación por competencias, metodología, evaluación.",
        },
        "organizacion_administrativa": {
            "label": "Organización administrativa",
            "guide": "Estructura administrativa y órganos de gobierno descritos en las notas.",
        },
        "reglamento": {
            "label": "Reglamento",
            "guide": "Resumen del reglamento de estudiantes y formadores: derechos, deberes, régimen disciplinario.",
        },
        "autoevaluacion": {
            "label": "Autoevaluación",
            "guide": "Cómo y cada cuánto se realiza la autoevaluación institucional y quién participa.",
        },
    },
    "LR003": {
        "proposito": {
            "label": "Propósito de la reunión",
            "guide": "Propósito de la reunión en una o dos frases.",
        },
        "desarrollo": {
            "label": "Desarrollo de la reunión",
            "guide": "Desarrollo de la reunión en tercera persona y tiempo pasado, siguiendo el orden del día.",
        },
        "acuerdos": {
            "label": "Propuestas, sugerencias y acuerdos",
            "guide": "Propuestas, sugerencias y acuerdos numerados dentro del párrafo: (1) ..., (2) ...",
        },
    },
    "LR004": {
        "proposito": {
            "label": "Propósito de la reunión",
            "guide": "Propósito de la reunión en una o dos frases.",
        },
        "desarrollo": {
            "label": "Desarrollo de la reunión",
            "guide": "Desarrollo de la reunión en tercera persona y tiempo pasado, siguiendo el orden del día.",
        },
        "compromisos": {
            "label": "Propuestas, recomendaciones y compromisos",
            "guide": "Propuestas, recomendaciones y compromisos numerados dentro del párrafo: (1) ..., (2) ..., con responsable por cargo si las notas lo dicen.",
        },
    },
    "LR006": {
        "resultados_autoevaluacion": {
            "label": "Resultados",
            "guide": "Resultados generales de la autoevaluación del período.",
        },
        "fortalezas": {
            "label": "Fortalezas",
            "guide": "Fortalezas identificadas, enumeradas dentro del párrafo.",
        },
        "debilidades": {
            "label": "Debilidades",
            "guide": "Debilidades o aspectos por mejorar, enumerados dentro del párrafo.",
        },
        "seguimiento_plan": {
            "label": "Seguimiento al plan anterior",
            "guide": "Seguimiento al plan de mejoramiento anterior: qué se cumplió y qué quedó pendiente.",
        },
    },
}

# Campos de la plantilla que sí se pueden enviar como contexto (no son personales)
CONTEXT_FIELDS: dict[str, list[str]] = {
    "LR001": ["programas_registrados"],
    "LR003": ["nombre_estamento", "punto_3", "punto_4", "punto_5"],
    "LR004": ["punto_3", "punto_4", "punto_5"],
    "LR006": ["periodo", "anio"],
}

SYSTEM_PROMPT = """Eres EduBot, redactor de documentos reglamentarios de instituciones de Educación para el Trabajo y el Desarrollo Humano (ETDH) en Colombia (Decreto 1075 de 2015).

Redactas en español formal e institucional, en tercera persona, claro y sin adornos.

Reglas estrictas:
1. Usa SOLO la información de las notas y del contexto. No inventes hechos, cifras, fechas, nombres de personas, votaciones ni decisiones.
2. Si falta información para algo importante, escribe [COMPLETAR: qué falta] en ese punto del texto.
3. No incluyas nombres de personas ni números de documento; refiérete a cargos (el rector, la secretaria académica, los formadores).
4. Cada campo es un solo párrafo de texto plano: sin saltos de línea, sin viñetas, sin markdown, sin títulos.
5. Responde únicamente con un objeto JSON cuyas claves son exactamente los nombres de campo pedidos y cuyos valores son el texto de cada campo."""


# --- Datos personales en las notas ---------------------------------------
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
_NUMBER = re.compile(r"(?<![\w/])\+?\d[\d .\-]{4,}\d(?![\w/])")
_DATE_LIKE = re.compile(r"^\d{1,2}[ .\-]\d{1,2}[ .\-]\d{2,4}$")


def redact_personal_data(text: str) -> str:
    """Quita correos y números largos (cédulas, teléfonos) antes de enviar a la IA."""
    text = _EMAIL.sub("[correo omitido]", text)

    def _number(match: re.Match) -> str:
        value = match.group(0)
        digits = sum(c.isdigit() for c in value)
        if digits < 7 or _DATE_LIKE.match(value.strip()):
            return value  # años, horas, fechas, cantidades pequeñas
        return "[número omitido]"

    return _NUMBER.sub(_number, text)


# --- Plan ------------------------------------------------------------------
def ai_draft_enabled(db: Session, user) -> bool:
    """True si el plan activo incluye EduBot IA.

    Usa la misma regla que require_feature (app/core/features.py), pero
    devuelve True/False en vez de lanzar el 403, para poder mostrar en la
    pantalla si la función está disponible.
    """
    try:
        subscription = get_active_subscription(current_user=user, db=db)
    except HTTPException:
        return False  # sin suscripción activa
    if subscription is None:
        return True  # superadmin
    features = (subscription.plan.features if subscription.plan else None) or {}
    return bool(features.get(FEATURE_KEY))


def document_type_key(template) -> str:
    value = template.document_type
    return getattr(value, "value", value)


def draftable_fields(template) -> dict[str, dict[str, str]]:
    """Campos que EduBot puede redactar en esta plantilla (si existen en ella)."""
    config = AI_DRAFT_FIELDS.get(document_type_key(template), {})
    required = set(template.required_fields or [])
    return {name: info for name, info in config.items() if name in required}


# --- Prompt y respuesta ------------------------------------------------------
def build_messages(
    template,
    fields: list[str],
    notes: str,
    current_values: dict,
    institution: dict,
) -> list[dict]:
    config = draftable_fields(template)
    doc_type = document_type_key(template)

    context_lines = [
        f"Documento: {template.name} ({doc_type})",
        f"Institución: {institution.get('nombre') or '[sin nombre]'}",
    ]
    for key, label in (
        ("nivel_educativo", "Nivel educativo"),
        ("municipio", "Municipio"),
        ("departamento", "Departamento"),
    ):
        if institution.get(key):
            context_lines.append(f"{label}: {institution[key]}")
    for key in CONTEXT_FIELDS.get(doc_type, []):
        value = current_values.get(key)
        if isinstance(value, str) and value.strip():
            context_lines.append(f"{key}: {redact_personal_data(value.strip())[:500]}")

    field_lines = []
    for name in fields:
        line = f'- "{name}": {config[name]["guide"]}'
        existing = current_values.get(name)
        if isinstance(existing, str) and existing.strip():
            line += f" Texto actual que debes mejorar sin perder información: «{redact_personal_data(existing.strip())[:1500]}»"
        field_lines.append(line)

    user_prompt = (
        "CONTEXTO\n"
        + "\n".join(context_lines)
        + "\n\nNOTAS DEL USUARIO\n"
        + (redact_personal_data(notes.strip()) or "(sin notas)")
        + "\n\nCAMPOS A REDACTAR\n"
        + "\n".join(field_lines)
        + '\n\nResponde solo con JSON, por ejemplo: {"'
        + fields[0]
        + '": "..."}'
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_prompt},
    ]


def parse_response(content: str, fields: list[str]) -> dict[str, str]:
    """Extrae el JSON de la respuesta y deja solo los campos pedidos, como texto plano."""
    content = (content or "").strip()
    try:
        data = json.loads(content, strict=False)
    except ValueError:
        start, end = content.find("{"), content.rfind("}")
        if start == -1 or end <= start:
            return {}
        try:
            data = json.loads(content[start : end + 1], strict=False)
        except ValueError:
            return {}
    if not isinstance(data, dict):
        return {}

    result = {}
    for name in fields:
        value = data.get(name)
        if not isinstance(value, str):
            continue
        value = value.replace("**", "").replace("__", "")
        value = re.sub(r"\s*\n+\s*", " ", value).strip()
        if value:
            result[name] = value[:MAX_FIELD_CHARS]
    return result
