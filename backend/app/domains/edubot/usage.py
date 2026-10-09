from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.domains.edubot.models import EduBotUsage
from app.domains.subscriptions.models import (
    Plan,
    PlanName,
    Subscription,
    SubscriptionStatus,
)
from app.domains.users.models import UserRole

CHAT_FEATURE_KEY = "mensajes_edubot_por_mes"

# Debe coincidir con DEFAULT_FEATURES de frontend/src/utils/planFeatures.js
DEFAULT_CHAT_LIMITS = {
    "free": 30,
    "basic": 200,
    "professional": None,
    "enterprise": None,
}


def current_period() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def _plan_key(plan: Plan) -> str:
    return getattr(plan.name, "value", plan.name)


def _limit_from_plan(plan: Plan | None):
    if plan is None:
        return DEFAULT_CHAT_LIMITS["free"]
    features = plan.features or {}
    if CHAT_FEATURE_KEY in features:
        return features[CHAT_FEATURE_KEY]
    return DEFAULT_CHAT_LIMITS.get(_plan_key(plan))


def get_chat_limit(db: Session, institution_id: str):
    subscription = (
        db.execute(
            select(Subscription).where(
                Subscription.institution_id == institution_id,
                Subscription.status == SubscriptionStatus.active,
                Subscription.is_active == True,
            )
        )
        .scalars()
        .first()
    )
    if subscription:
        plan = db.execute(
            select(Plan).where(Plan.id == subscription.plan_id)
        ).scalar_one_or_none()
        return _limit_from_plan(plan)

    # Sin suscripción activa: se trata como Free
    free_plan = (
        db.execute(select(Plan).where(Plan.name == PlanName.free)).scalars().first()
    )
    return _limit_from_plan(free_plan)


def get_chat_used(db: Session, institution_id: str) -> int:
    row = db.execute(
        select(EduBotUsage).where(
            EduBotUsage.institution_id == institution_id,
            EduBotUsage.period == current_period(),
        )
    ).scalar_one_or_none()
    return row.chat_messages if row else 0


def get_chat_usage(db: Session, user) -> dict:
    """{used, limit, remaining}. limit/remaining = None si es ilimitado."""
    if user.role == UserRole.superadmin or not user.institution_id:
        return {"used": 0, "limit": None, "remaining": None}
    used = get_chat_used(db, user.institution_id)
    limit = get_chat_limit(db, user.institution_id)
    remaining = None if limit is None else max(limit - used, 0)
    return {"used": used, "limit": limit, "remaining": remaining}


def check_chat_quota(db: Session, user) -> dict:
    """Lanza 403 si la institución ya gastó sus consultas del mes."""
    usage = get_chat_usage(db, user)
    if usage["limit"] is not None and usage["remaining"] <= 0:
        raise HTTPException(
            status_code=403,
            detail={
                "message": (
                    f"Tu institución ya usó las {usage['limit']} consultas a EduBot "
                    "de este mes. Se renuevan el día 1 del próximo mes."
                ),
                "limit_reached": True,
                "limit": usage["limit"],
                "used": usage["used"],
            },
        )
    return usage


def record_chat_message(db: Session, user) -> dict:
    """Suma una consulta al mes actual y devuelve el uso actualizado."""
    if user.role == UserRole.superadmin or not user.institution_id:
        return get_chat_usage(db, user)

    period = current_period()
    row = db.execute(
        select(EduBotUsage).where(
            EduBotUsage.institution_id == user.institution_id,
            EduBotUsage.period == period,
        )
    ).scalar_one_or_none()
    if row:
        # Suma en la base de datos (no en Python) por si llegan dos a la vez
        row.chat_messages = EduBotUsage.chat_messages + 1
    else:
        db.add(
            EduBotUsage(
                institution_id=user.institution_id, period=period, chat_messages=1
            )
        )
    db.commit()
    return get_chat_usage(db, user)
