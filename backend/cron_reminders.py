from datetime import datetime, timedelta
from sqlalchemy import select
from app.database import SessionLocal
from app.domains.institutions.models import Institution
from app.domains.users.models import User, UserRole, RefreshToken, PasswordResetToken, LoginAttempt, TwoFactorCode, KnownDevice, EmailChangeRequest
from app.domains.documents.models import Document, DocumentTemplate
from app.domains.subscriptions.models import Plan, Subscription, Transaction, Invoice
from app.domains.students.models import Program, Student, Enrollment
from app.domains.calendar.models import CalendarEvent
from app.domains.notifications.models import Notification
from app.domains.notifications.services import create_notification
from app.core.email import send_event_reminder_email


def run():
    db = SessionLocal()
    now = datetime.utcnow()

    try:
        # Eventos con recordatorio configurado, no enviados aún, no completados
        events = db.execute(
            select(CalendarEvent).where(
                CalendarEvent.reminder_days_before.isnot(None),
                CalendarEvent.reminder_sent == False,
                CalendarEvent.is_done == False,
                CalendarEvent.institution_id.isnot(None),  # solo copias institucionales, no el maestro
            )
        ).scalars().all()

        sent_count = 0

        for event in events:
            reminder_date = event.event_date - timedelta(days=event.reminder_days_before)

            if now >= reminder_date and now < event.event_date:
                # Notificación in-app para la institución
                create_notification(
                    db,
                    title=f"Recordatorio: {event.title}",
                    message=f"Este evento vence el {event.event_date.strftime('%d de %B de %Y')}.",
                    institution_id=event.institution_id,
                    calendar_event_id=event.id,
                )

                # Email al representante de la institución
                representative = db.execute(
                    select(User).where(
                        User.institution_id == event.institution_id,
                        User.role == UserRole.representative,
                    )
                ).scalar_one_or_none()

                if representative:
                    institution = db.execute(
                        select(Institution).where(Institution.id == event.institution_id)
                    ).scalar_one_or_none()

                    try:
                        send_event_reminder_email(
                            to_email=representative.email,
                            full_name=representative.full_name,
                            institution_name=institution.name if institution else "",
                            event_title=event.title,
                            event_date=event.event_date,
                            description=event.description or "",
                        )
                    except Exception as e:
                        print(f"[CRON] Error enviando recordatorio a {representative.email}: {e}")

                event.reminder_sent = True
                db.commit()
                sent_count += 1

        print(f"Recordatorios procesados: {sent_count}")

    finally:
        db.close()


if __name__ == "__main__":
    run()