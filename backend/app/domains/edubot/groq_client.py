import os
import httpx
from app.config import settings

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Llama 3.1 8B y Llama 3.3 70B se retiraron el 16 de agosto de 2026;
# Groq recomienda gpt-oss-20b y gpt-oss-120b como reemplazos.
DEFAULT_CHAT_MODEL = "openai/gpt-oss-20b"
DEFAULT_DRAFT_MODEL = "openai/gpt-oss-120b"


def chat_model() -> str:
    return (
        getattr(settings, "GROQ_CHAT_MODEL", None)
        or os.getenv("GROQ_CHAT_MODEL")
        or DEFAULT_CHAT_MODEL
    )


def draft_model() -> str:
    return (
        getattr(settings, "GROQ_DRAFT_MODEL", None)
        or os.getenv("GROQ_DRAFT_MODEL")
        or DEFAULT_DRAFT_MODEL
    )


class GroqError(Exception):
    """Error al hablar con Groq. `timeout` distingue la demora de otros fallos."""

    def __init__(self, message: str, timeout: bool = False):
        super().__init__(message)
        self.timeout = timeout


def is_configured() -> bool:
    return bool(getattr(settings, "GROQ_API_KEY", None))


async def groq_chat(
    messages: list[dict],
    *,
    model: str,
    max_tokens: int = 1500,
    temperature: float = 0.3,
    json_mode: bool = False,
    timeout: float = 45,
) -> str:
    """Envía la conversación y devuelve el texto de la respuesta."""
    payload = {
        "model": model,
        "messages": messages,
        "max_completion_tokens": max_tokens,
        "temperature": temperature,
    }
    if model.startswith("openai/gpt-oss"):
        # Modelos que "razonan" antes de responder: poco razonamiento = más rápido
        payload["reasoning_effort"] = "low"
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.TimeoutException as e:
        raise GroqError("Tiempo de espera agotado", timeout=True) from e
    except httpx.HTTPError as e:
        raise GroqError(f"Error de conexión: {e}") from e

    if response.status_code != 200:
        # Se registra en los logs del backend para poder diagnosticar
        # (modelo retirado, llave inválida, límite de uso...).
        print(f"[EduBot] Groq respondió {response.status_code}: {response.text[:500]}")
        raise GroqError(f"Groq respondió {response.status_code}")

    try:
        return response.json()["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, ValueError) as e:
        raise GroqError("Respuesta inesperada de Groq") from e
