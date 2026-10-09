import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class EduBotUsage(Base):

    __tablename__ = "edubot_usage"
    __table_args__ = (
        UniqueConstraint(
            "institution_id", "period", name="uq_edubot_usage_institution_period"
        ),
    )

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    institution_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("institutions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period: Mapped[str] = mapped_column(String(7), nullable=False)  # "AAAA-MM"
    chat_messages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
