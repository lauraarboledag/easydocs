from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from app.domains.subscriptions.models import PlanName, SubscriptionStatus, TransactionStatus, BillingCycle

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

    model_config = {"from_attributes": True}

class TransactionResponse(BaseModel):
    id: str
    subscription_id: str
    amount: int
    status: TransactionStatus
    notes: Optional[str]
    confirmed_by: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class ConfirmTransaction(BaseModel):
    notes: Optional[str] = None