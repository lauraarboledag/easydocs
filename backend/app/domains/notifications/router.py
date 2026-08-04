from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User
from app.domains.notifications.schemas import NotificationResponse
from app.domains.notifications.services import (
    list_notifications,
    count_unread,
    mark_as_read,
    mark_all_as_read,
)

router = APIRouter(tags=["Notificaciones"])


@router.get("/notifications/", response_model=list[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_notifications(
        db,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
    )


@router.get("/notifications/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = count_unread(
        db,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
    )
    return {"count": count}


@router.patch("/notifications/{notification_id}/read")
def read_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    success = mark_as_read(
        db,
        notification_id,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Notificación no encontrada.")
    return {"message": "Marcada como leída."}


@router.patch("/notifications/read-all")
def read_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mark_all_as_read(
        db,
        institution_id=current_user.institution_id or None,
        user_id=current_user.id,
    )
    return {"message": "Todas marcadas como leídas."}
