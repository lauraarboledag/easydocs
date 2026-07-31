import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Enum, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum

class PlanName(str, enum.Enum):
    free = "free"
    basic = "basic"
    professional = "professional"
    enterprise = "enterprise"

class SubscriptionStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    pending = "pending"
    cancelled = "cancelled"

class TransactionStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    rejected = "rejected"
    
class BillingCycle(str, enum.Enum):
    monthly = "monthly"
    annual = "annual"

class Plan(Base):
    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[PlanName] = mapped_column(Enum(PlanName), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=True)
    price: Mapped[int] = mapped_column(Integer, nullable=False)  # en centavos COP
    billing_cycle: Mapped[BillingCycle] = mapped_column(
    Enum(BillingCycle), nullable=False, default=BillingCycle.monthly)
    features: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    subscriptions = relationship("Subscription", back_populates="plan")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    institution_id: Mapped[str] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=False
    )
    plan_id: Mapped[str] = mapped_column(
        String, ForeignKey("plans.id"), nullable=False
    )
    status: Mapped[SubscriptionStatus] = mapped_column(
        Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.pending
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    institution = relationship("Institution", back_populates="subscription")
    plan = relationship("Plan", back_populates="subscriptions")
    transactions = relationship("Transaction", back_populates="subscription")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    subscription_id: Mapped[str] = mapped_column(
        String, ForeignKey("subscriptions.id"), nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # en centavos COP
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus), nullable=False, default=TransactionStatus.pending
    )
    notes: Mapped[str] = mapped_column(String(500), nullable=True)
    confirmed_by: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
    

    subscription = relationship("Subscription", back_populates="transactions")
    
class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    invoice_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    institution_id: Mapped[str] = mapped_column(
        String, ForeignKey("institutions.id"), nullable=False
    )
    subscription_id: Mapped[str] = mapped_column(
        String, ForeignKey("subscriptions.id"), nullable=False
    )
    transaction_id: Mapped[str] = mapped_column(
        String, ForeignKey("transactions.id"), nullable=True
    )
    plan_name: Mapped[str] = mapped_column(String(50), nullable=False)
    billing_cycle: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # centavos COP
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # "wompi" | "transfer"
    issued_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    institution = relationship("Institution")
    subscription = relationship("Subscription")
    transaction = relationship("Transaction")