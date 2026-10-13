from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from app.domains.subscriptions.models import (
    PlanName,
    SubscriptionStatus,
    TransactionStatus,
    BillingCycle,
)


class PlanCreate(BaseModel):
    name: PlanName
    description: Optional[str] = None
    price: int
    billing_cycle: BillingCycle
    features: dict


class PlanResponse(BaseModel):
    id: str
    name: PlanName
    description: Optional[str]
    price: int
    billing_cycle: BillingCycle
    features: dict
    is_active: bool

    model_config = {"from_attributes": True}


class SubscriptionCreate(BaseModel):
    institution_id: str
    plan_id: str


class SubscriptionResponse(BaseModel):
    id: str
    institution_id: str
    plan_id: str
    status: SubscriptionStatus
    starts_at: Optional[datetime]
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime
    plan: Optional[PlanResponse] = None
    # Solo en /subscriptions/pending: si ya se adjuntó el comprobante
    receipt_uploaded: bool = False
    # Solo en /subscriptions/pending: "transfer" o "wompi"
    payment_method: Optional[str] = None

    model_config = {"from_attributes": True}


class TransactionResponse(BaseModel):
    id: str
    subscription_id: str
    amount: int
    status: TransactionStatus
    notes: Optional[str]
    confirmed_by: Optional[str]
    created_at: datetime
    # Datos para que la administración sepa de quién es el pago
    institution_name: Optional[str] = None
    plan_name: Optional[str] = None
    billing_cycle: Optional[str] = None
    has_receipt: bool = False
    payment_method: Optional[str] = None  # "transfer" | "wompi"
    provider_payment_type: Optional[str] = None  # CARD, PSE, NEQUI...

    model_config = {"from_attributes": True}


class ConfirmTransaction(BaseModel):
    notes: Optional[str] = None


class ReceiptInfo(BaseModel):
    transaction_id: str
    filename: Optional[str]
    content_type: str
    size: int
    created_at: Optional[datetime] = None
