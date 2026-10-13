"""Simula el aviso (webhook) de Wompi para probar en local.

En local Wompi no puede llamar a tu computador, así que después de pagar en
el widget de pruebas, este script manda el aviso firmado como lo haría Wompi.

Uso (desde la raíz, con Docker):
    docker compose exec backend python -m app.domains.subscriptions.simulate_wompi
        -> aprueba el último pago en línea pendiente
    docker compose exec backend python -m app.domains.subscriptions.simulate_wompi DECLINED
        -> lo rechaza (también: VOIDED, ERROR)

Solo funciona con llaves de pruebas (test_events_...): con llaves reales se niega.
"""

import sys
import time
import uuid

import httpx
from sqlalchemy import select

import app.main  # noqa: F401  (carga todos los modelos)
from app.database import SessionLocal
from app.domains.subscriptions.models import Transaction, TransactionStatus
from app.domains.subscriptions.wompi import sign_test_event, wompi_setting

WEBHOOK_URL = "http://localhost:8000/webhooks/wompi"
STATUSES = {"APPROVED", "DECLINED", "VOIDED", "ERROR"}


def main() -> None:
    status = (sys.argv[1] if len(sys.argv) > 1 else "APPROVED").upper()
    if status not in STATUSES:
        print(__doc__)
        sys.exit(1)

    secret = wompi_setting("WOMPI_EVENTS_KEY")
    if not secret.startswith("test_"):
        print(
            "Este simulador solo funciona con la llave de eventos de pruebas (test_events_...)."
        )
        sys.exit(1)

    db = SessionLocal()
    try:
        tx = (
            db.execute(
                select(Transaction)
                .where(
                    Transaction.payment_method == "wompi",
                    Transaction.status == TransactionStatus.pending,
                    Transaction.reference.is_not(None),
                )
                .order_by(Transaction.created_at.desc())
            )
            .scalars()
            .first()
        )
        if not tx:
            print(
                "No hay pagos en línea pendientes. Primero dale 'Pagar con Wompi' en Checkout."
            )
            sys.exit(1)
        reference, amount = tx.reference, tx.amount
    finally:
        db.close()

    event = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": f"sim-{uuid.uuid4().hex[:12]}",
                "status": status,
                "amount_in_cents": amount,
                "reference": reference,
                "currency": "COP",
                "payment_method_type": "CARD",
            }
        },
        "signature": {
            "properties": [
                "transaction.id",
                "transaction.status",
                "transaction.amount_in_cents",
            ],
            "checksum": "",
        },
        "timestamp": int(time.time()),
        "sent_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }
    sign_test_event(event, secret)

    print(f"Enviando {status} para {reference} ({amount / 100:,.0f} COP)...")
    response = httpx.post(WEBHOOK_URL, json=event, timeout=30)
    print(response.status_code, response.text)


if __name__ == "__main__":
    main()
