import hashlib

import pytest

from app.domains.subscriptions import wompi

KEYS = {
    "WOMPI_PUBLIC_KEY": "pub_test_abc",
    "WOMPI_INTEGRITY_KEY": "test_integrity_secreto",
    "WOMPI_EVENTS_KEY": "test_events_secreto",
}


@pytest.fixture(autouse=True)
def fake_keys(monkeypatch):
    monkeypatch.setattr(wompi, "wompi_setting", lambda name: KEYS.get(name, ""))


def _event(status="APPROVED", amount=18900000):
    event = {
        "event": "transaction.updated",
        "data": {
            "transaction": {
                "id": "1234-1610641025-49201",
                "status": status,
                "amount_in_cents": amount,
                "reference": "easydocs-abc",
                "currency": "COP",
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
        "timestamp": 1530291411,
    }
    return wompi.sign_test_event(event, KEYS["WOMPI_EVENTS_KEY"])


def test_integrity_signature_order():
    expected = hashlib.sha256(
        b"easydocs-abc18900000COPtest_integrity_secreto"
    ).hexdigest()
    assert wompi.integrity_signature("easydocs-abc", 18900000) == expected


def test_valid_event_passes():
    assert wompi.verify_wompi_signature(_event()) is True


def test_properties_are_read_from_data():
    # Wompi manda 'transaction.id', relativo a `data`, no a la transacción
    event = _event()
    expected = hashlib.sha256(
        b"1234-1610641025-49201APPROVED189000001530291411test_events_secreto"
    ).hexdigest()
    assert event["signature"]["checksum"] == expected


def test_tampered_amount_fails():
    event = _event()
    event["data"]["transaction"]["amount_in_cents"] = 100
    assert wompi.verify_wompi_signature(event) is False


def test_tampered_status_fails():
    event = _event(status="DECLINED")
    event["data"]["transaction"]["status"] = "APPROVED"
    assert wompi.verify_wompi_signature(event) is False


def test_missing_signature_fails():
    event = _event()
    event.pop("signature")
    assert wompi.verify_wompi_signature(event) is False


def test_no_events_key_fails(monkeypatch):
    monkeypatch.setattr(wompi, "wompi_setting", lambda name: "")
    assert wompi.verify_wompi_signature(_event()) is False


def test_test_mode():
    assert wompi.is_test_mode() is True
