import hashlib
import hmac
import os

from app.config import settings

CURRENCY = "COP"


def wompi_setting(name: str) -> str:
    """Lee la llave de config.py si está declarada ahí, o de la variable de entorno."""
    return (getattr(settings, name, None) or os.getenv(name, "") or "").strip()


def is_test_mode() -> bool:
    return wompi_setting("WOMPI_PUBLIC_KEY").startswith("pub_test_")


def integrity_signature(
    reference: str, amount_in_cents: int, currency: str = CURRENCY
) -> str:
    """SHA256 de <referencia><monto en centavos><moneda><secreto de integridad>."""
    secret = wompi_setting("WOMPI_INTEGRITY_KEY")
    if not secret:
        raise RuntimeError("Falta WOMPI_INTEGRITY_KEY.")
    raw = f"{reference}{amount_in_cents}{currency}{secret}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _event_value(data: dict, path: str):
    """Valor de una propiedad del evento, p. ej. 'transaction.amount_in_cents'.

    Las rutas que manda Wompi en signature.properties empiezan en `data`
    (por eso incluyen 'transaction.'), no dentro de la transacción.
    """
    value = data
    for key in path.split("."):
        value = value.get(key, "") if isinstance(value, dict) else ""
    return value


def verify_wompi_signature(event_data: dict) -> bool:
    """Verifica la firma de un evento webhook de Wompi.

    checksum = SHA256(valores de signature.properties + timestamp + secreto de eventos)
    """
    secret = wompi_setting("WOMPI_EVENTS_KEY")
    if not secret:
        return False
    try:
        signature = event_data.get("signature") or {}
        properties = signature.get("properties") or []
        checksum = str(signature.get("checksum") or "")
        timestamp = event_data.get("timestamp", "")
        data = event_data.get("data") or {}
        if not properties or not checksum:
            return False

        concatenated = "".join(str(_event_value(data, p)) for p in properties)
        concatenated += str(timestamp) + secret
        computed = hashlib.sha256(concatenated.encode()).hexdigest()
        return hmac.compare_digest(computed.upper(), checksum.upper())
    except Exception:
        return False


def sign_test_event(event: dict, secret: str) -> dict:
    """Agrega la firma a un evento armado a mano (solo para pruebas)."""
    data = event.get("data") or {}
    properties = event["signature"]["properties"]
    concatenated = "".join(str(_event_value(data, p)) for p in properties)
    concatenated += str(event.get("timestamp", "")) + secret
    event["signature"]["checksum"] = hashlib.sha256(concatenated.encode()).hexdigest()
    return event
