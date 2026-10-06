from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.auth import get_current_user
from app.domains.users.models import User
from app.domains.notifications.schemas import NotificationIds, NotificationResponse
from app.domains.notifications.services import (
    list_notifications,
    count_unread,
    mark_as_read,
    mark_all_as_read,
    dismiss_notifications,
    dismiss_read,
)

router = APIRouter(tags=["Notificaciones"])

# Las rutas fijas van antes que /notifications/{notification_id}.


@router.get("/notifications/", response_model=list[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_notifications(
        db, current_user, unread_only=unread_only, limit=limit, offset=offset
    )


@router.get("/notifications/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {"count": count_unread(db, current_user)}


@router.patch("/notifications/read-all")
def read_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updated = mark_all_as_read(db, current_user)
    return {"message": "Todas marcadas como leídas.", "updated": updated}


@router.post("/notifications/delete")
def delete_many_notifications(
    data: NotificationIds,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = dismiss_notifications(db, data.ids, current_user)
    return {"deleted": deleted}


@router.post("/notifications/clear-read")
def clear_read_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = dismiss_read(db, current_user)
    return {"deleted": deleted}


@router.patch("/notifications/{notification_id}/read")
def read_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not mark_as_read(db, notification_id, current_user):
        raise HTTPException(status_code=404, detail="Notificación no encontrada.")
    return {"message": "Marcada como leída."}


@router.delete("/notifications/{notification_id}", status_code=204)
def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not dismiss_notifications(db, [notification_id], current_user):
        raise HTTPException(status_code=404, detail="Notificación no encontrada.")
