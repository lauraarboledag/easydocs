import httpx
from app.config import settings


async def verify_hcaptcha(token: str) -> bool:
    """Verifica el token de hCaptcha con la API de hCaptcha."""
    if not settings.HCAPTCHA_SECRET_KEY:
        return True  # Si no está configurado, no bloquear (dev/local)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.hcaptcha.com/siteverify",
            data={
                "secret": settings.HCAPTCHA_SECRET_KEY,
                "response": token,
            },
        )
        result = response.json()
        return result.get("success", False)
