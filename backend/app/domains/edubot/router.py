from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User

router = APIRouter(tags=["EduBot"])

RESPUESTAS = {
    "lr001": "El **LR001 — Proyecto Educativo Institucional (PEI)** es el documento que establece los principios, fines, plan de estudios y organización administrativa de la institución ETDH. Debe contener: misión, visión, principios institucionales, estrategia pedagógica, organización administrativa y reglamento de estudiantes. Es obligatorio según el artículo 2.6.4.8 del Decreto 1075 de 2015.",
    "lr002": "El **LR002 — Libro de Matrículas** registra el vínculo legal entre el estudiante y la institución. Debe incluir datos personales del estudiante, programa al que se matricula, fecha, y firma del estudiante y del personal administrativo. Para menores de edad debe incluir datos del representante legal.",
    "lr003": "El **LR003 — Actas de Participación Comunitaria** registra las reuniones del estamento definido para asegurar la participación de la comunidad educativa y el sector productivo. Debe incluir lista de asistentes, orden del día, desarrollo y acuerdos. Conforme al artículo 2.6.3.7 del Decreto 1075 de 2015.",
    "lr004": "El **LR004 — Actas Pedagógicas y Disciplinarias** registra las reuniones del estamento para el manejo de asuntos pedagógicos, académicos y disciplinarios. Incluye asistentes, propósito, desarrollo y compromisos adquiridos.",
    "lr005": "El **LR005 — Registro de Certificados de Aptitud Ocupacional** es el libro oficial donde se registran todos los certificados expedidos. Es la fuente principal para expedición de duplicados. Debe incluir nombre del estudiante, documento, programa, fecha y firma de quien recibe.",
    "lr006": "El **LR006 — Autoevaluación Institucional** registra los resultados de la autoevaluación periódica, fortalezas, debilidades y el plan de mejoramiento. Conforme al numeral 7 del artículo 2.6.4.8 del Decreto 1075 de 2015.",
    "lr007": "El **LR007 — Reconocimiento de Saberes Previos** documenta la valoración de conocimientos y experiencias previas de los estudiantes. El mecanismo de valoración debe estar definido en el PEI conforme al numeral 2.6.4.15 del Decreto 1075 de 2015.",
    "lr008": "El **LR008 — Registro de Calificaciones Definitivas** conserva los resultados finales de cada estudiante por módulo, incluyendo actividades de recuperación y habilitación. Es el soporte académico oficial de la institución.",
    "lr009": "El **LR009 — Registros Especiales** documenta los duplicados y modificaciones de certificados expedidos, indicando el motivo y referenciando el registro original en el LR005.",
    "certificado": "Los **Certificados de Aptitud Ocupacional** se expiden al completar un programa técnico laboral. Para programas del área de la salud, el titular debe inscribirse adicionalmente en el **RETHUS** (Registro Único Nacional de Talento Humano en Salud) conforme a la Ley 1164 de 2007.",
    "constancia": "Las **Constancias de Asistencia** se expiden para cursos de educación informal con duración inferior a 160 horas, conforme al Artículo 2.6.6.8 del Decreto 1075 de 2015. No otorgan certificado de aptitud ocupacional.",
    "decreto": "El **Decreto 1075 de 2015** es el Decreto Único Reglamentario del Sector Educación. Para instituciones ETDH, los artículos más relevantes son el 2.6.4.8 (requisitos PEI), 2.6.4.15 (reconocimiento saberes previos) y 2.6.6.8 (educación informal).",
    "conservacion": "Los libros reglamentarios deben conservarse según la **Ley 594 de 2000 (Ley General de Archivo)**. Los documentos académicos como matrículas y calificaciones deben conservarse mínimo **10 años** después de que el estudiante egresa.",
    "duplicado": "Para expedir un **duplicado de certificado**, debe verificarse el registro original en el LR005, registrar el duplicado en el LR009 indicando el motivo (pérdida, deterioro), y el nuevo documento debe indicar claramente que es un duplicado con la fecha de expedición original.",
    "firmas": "Las firmas requeridas varían por documento: el **LR002** requiere firma del estudiante, personal administrativo y rector. Los **certificados** requieren firma del Rector/Director y Secretaria Académica. Las **actas** requieren firma del Rector y el Secretario del estamento.",
}


def buscar_respuesta(mensaje: str) -> str:
    mensaje_lower = mensaje.lower()

    if any(w in mensaje_lower for w in ["lr001", "pei", "proyecto educativo"]):
        return RESPUESTAS["lr001"]
    if any(
        w in mensaje_lower
        for w in ["lr002", "matrícula", "matricula", "libro de matrículas"]
    ):
        return RESPUESTAS["lr002"]
    if any(
        w in mensaje_lower for w in ["lr003", "participación comunitaria", "comunidad"]
    ):
        return RESPUESTAS["lr003"]
    if any(w in mensaje_lower for w in ["lr004", "pedagógic", "disciplinari"]):
        return RESPUESTAS["lr004"]
    if any(w in mensaje_lower for w in ["lr005", "registro de certificados"]):
        return RESPUESTAS["lr005"]
    if any(w in mensaje_lower for w in ["lr006", "autoevaluación", "autoevaluacion"]):
        return RESPUESTAS["lr006"]
    if any(w in mensaje_lower for w in ["lr007", "saberes previos"]):
        return RESPUESTAS["lr007"]
    if any(w in mensaje_lower for w in ["lr008", "calificaciones"]):
        return RESPUESTAS["lr008"]
    if any(w in mensaje_lower for w in ["lr009", "registros especiales"]):
        return RESPUESTAS["lr009"]
    if any(
        w in mensaje_lower
        for w in ["certificado", "aptitud ocupacional", "rethus", "salud"]
    ):
        return RESPUESTAS["certificado"]
    if any(w in mensaje_lower for w in ["constancia", "asistencia", "informal"]):
        return RESPUESTAS["constancia"]
    if any(w in mensaje_lower for w in ["decreto", "1075", "normativa", "norma"]):
        return RESPUESTAS["decreto"]
    if any(w in mensaje_lower for w in ["conserv", "tiempo", "años", "archivo"]):
        return RESPUESTAS["conservacion"]
    if any(w in mensaje_lower for w in ["duplicado", "copia", "pérdida", "deterioro"]):
        return RESPUESTAS["duplicado"]
    if any(
        w in mensaje_lower for w in ["firma", "firmas", "quién firma", "quien firma"]
    ):
        return RESPUESTAS["firmas"]

    return (
        "Soy **EduBot** en modo de orientación básica. Puedo ayudarte con información sobre:\n\n"
        "📋 **Libros reglamentarios:** LR001 al LR009\n"
        "📄 **Certificados y constancias** de aptitud ocupacional\n"
        "⚖️ **Decreto 1075 de 2015** y normativa ETDH\n"
        "🖊️ **Firmas requeridas** en cada documento\n"
        "🗂️ **Tiempos de conservación** de archivos\n"
        "📋 **Duplicados** de certificados\n\n"
        "Intenta preguntar por un libro específico (ej: '¿Qué es el LR002?') o un tema concreto."
    )


class MessageRequest(BaseModel):
    message: str
    history: Optional[list] = []


@router.post("/edubot/chat")
async def chat(
    data: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reply = buscar_respuesta(data.message)
    return {"reply": reply}
