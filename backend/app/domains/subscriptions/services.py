from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.domains.subscriptions.models import Plan, Subscription, Transaction, SubscriptionStatus, TransactionStatus
from app.domains.subscriptions.schemas import PlanCreate, SubscriptionCreate, ConfirmTransaction

def create_plan(db: Session, data: PlanCreate) -> Plan:
    existing = db.execute(
        select(Plan).where(Plan.name == data.name, Plan.billing_cycle == data.billing_cycle)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un plan con ese nombre.")
    plan = Plan(**data.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

def list_plans(db: Session) -> list[Plan]:
    return db.execute(
        select(Plan).where(Plan.is_active == True)
    ).scalars().all()

def create_subscription(db: Session, data: SubscriptionCreate) -> Subscription:
    existing = db.execute(
        select(Subscription).where(
            Subscription.institution_id == data.institution_id,
            Subscription.is_active == True
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Esta institución ya tiene una suscripción activa."
        )

    plan = db.execute(
        select(Plan).where(Plan.id == data.plan_id)
    ).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado.")

    subscription = Subscription(
        institution_id=data.institution_id,
        plan_id=data.plan_id,
        status=SubscriptionStatus.pending
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    transaction = Transaction(
        subscription_id=subscription.id,
        amount=plan.price,
        status=TransactionStatus.pending
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return subscription

def confirm_transaction(
    db: Session,
    transaction_id: str,
    data: ConfirmTransaction,
    confirmed_by_id: str
) -> Transaction:
    transaction = db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    ).scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transacción no encontrada.")
    if transaction.status != TransactionStatus.pending:
        raise HTTPException(status_code=400, detail="Esta transacción ya fue procesada.")

    transaction.status = TransactionStatus.confirmed
    transaction.notes = data.notes
    transaction.confirmed_by = confirmed_by_id

    subscription = db.execute(
        select(Subscription).where(Subscription.id == transaction.subscription_id)
    ).scalar_one_or_none()

    # Duración según ciclo de facturación del plan
    from app.domains.subscriptions.models import BillingCycle
    days = 365 if subscription.plan.billing_cycle == BillingCycle.annual else 30

    subscription.status = SubscriptionStatus.active
    subscription.starts_at = datetime.utcnow()
    subscription.expires_at = datetime.utcnow() + timedelta(days=days)

    db.commit()
    db.refresh(transaction)
    return transaction

def get_institution_subscription(db: Session, institution_id: str) -> Subscription:
    subscription = db.execute(
        select(Subscription).where(
            Subscription.institution_id == institution_id,
            Subscription.is_active == True
        )
    ).scalar_one_or_none()
    if not subscription:
        raise HTTPException(status_code=404, detail="No hay suscripción activa para esta institución.")
    return subscription

def list_transactions(db: Session) -> list[Transaction]:
    return db.execute(select(Transaction)).scalars().all()