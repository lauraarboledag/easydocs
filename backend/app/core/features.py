from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User
from app.domains.subscriptions.models import Subscription, SubscriptionStatus

def get_active_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Subscription:
    """Verifica que la institución del usuario tenga una suscripción activa."""
    if current_user.role == "superadmin":
        return None

    subscription = db.execute(
        select(Subscription).where(
            Subscription.institution_id == current_user.institution_id,
            Subscription.status == SubscriptionStatus.active,
            Subscription.is_active == True
        )
    ).scalar_one_or_none()

    if not subscription:
        raise HTTPException(
            status_code=403,
            detail="Tu institución no tiene una suscripción activa."
        )

    return subscription

def require_feature(feature: str):
    """Verifica que el plan activo incluya una funcionalidad específica."""
    def checker(
        subscription: Subscription = Depends(get_active_subscription)
    ):
        if subscription is None:
            return True

        features = subscription.plan.features
        value = features.get(feature)

        if value is False or value is None:
            raise HTTPException(
                status_code=403,
                detail=f"Tu plan no incluye acceso a esta funcionalidad: {feature}"
            )
        return subscription

    return checker

def require_superadmin(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=403,
            detail="Solo el superadministrador puede realizar esta acción."
        )
    return current_user