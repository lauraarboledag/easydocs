import hashlib
from app.config import settings


def verify_wompi_signature(event_data: dict) -> bool:
    """
    Verifica la firma de un evento webhook de Wompi.
    Wompi firma concatenando los valores de 'checksum.properties' del evento,
    seguido del timestamp y la llave de eventos (secret), luego SHA256.
    """
    if not settings.WOMPI_EVENTS_KEY:
        return False

    try:
        signature_data = event_data.get("signature", {})
        properties = signature_data.get("properties", [])
        checksum = signature_data.get("checksum", "")
        timestamp = event_data.get("timestamp", "")

        transaction = event_data.get("data", {}).get("transaction", {})

        concatenated = ""
        for prop_path in properties:
            keys = prop_path.split(".")
            value = transaction
            for key in keys:
                value = value.get(key, "") if isinstance(value, dict) else ""
            concatenated += str(value)

        concatenated += str(timestamp) + settings.WOMPI_EVENTS_KEY

        computed_checksum = hashlib.sha256(concatenated.encode()).hexdigest()

        return computed_checksum.upper() == checksum.upper()
    except Exception:
        return False


def map_plan_from_reference(reference: str) -> tuple[str, str] | None:
    """
    Extrae institution_id y plan_id de la referencia de pago.
    Formato esperado: 'easydocs_{institution_id}_{plan_id}_{timestamp}'
    """
    parts = reference.split("_")
    if len(parts) < 4 or parts[0] != "easydocs":
        return None
    institution_id = parts[1]
    plan_id = parts[2]
    return institution_id, plan_id