from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.core.auth import get_current_user
from app.core.features import get_active_subscription, require_feature
from app.domains.users.models import User
from app.domains.subscriptions.models import Subscription
from app.domains.subscriptions.schemas import (
    PlanCreate,
    PlanResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    TransactionResponse,
    ConfirmTransaction,
    SubscriptionStatus
)
from app.domains.subscriptions.services import (
    create_plan,
    list_plans,
    create_subscription,
    confirm_transaction,
    get_institution_subscription,
    list_transactions,
)

router = APIRouter(tags=["Suscripciones"])


@router.post("/plans/", response_model=PlanResponse, status_code=201)
def add_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_plan(db, data)


@router.get("/plans/", response_model=list[PlanResponse])
def get_plans(db: Session = Depends(get_db)):
    return list_plans(db)


@router.post("/subscriptions/", response_model=SubscriptionResponse, status_code=201)
def subscribe(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_subscription(db, data)


@router.get("/subscriptions/my", response_model=SubscriptionResponse)
def my_subscription(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return get_institution_subscription(db, current_user.institution_id)


@router.get("/transactions/", response_model=list[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return list_transactions(db)


@router.patch(
    "/transactions/{transaction_id}/confirm", response_model=TransactionResponse
)
def confirm(
    transaction_id: str,
    data: ConfirmTransaction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return confirm_transaction(db, transaction_id, data, current_user.id)


@router.post("/subscriptions/change-plan")
def change_plan(
    data: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Desactivar suscripción actual
    current_sub = db.execute(
        select(Subscription).where(
            Subscription.institution_id == current_user.institution_id,
            Subscription.is_active == True,
        )
    ).scalar_one_or_none()

    if current_sub:
        current_sub.is_active = False
        current_sub.status = SubscriptionStatus.cancelled
        db.commit()

    # Crear nueva suscripción
    return create_subscription(
        db,
        SubscriptionCreate(
            plan_id=data.plan_id, institution_id=current_user.institution_id
        ),
    )
