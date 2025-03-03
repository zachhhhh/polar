from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy import TIMESTAMP, ForeignKey, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, declared_attr, mapped_column, relationship

from polar.config import settings
from polar.kit.db.models import RecordModel
from polar.kit.utils import utc_now
from polar.models.user import User


def get_expires_at() -> datetime:
    return utc_now() + timedelta(seconds=settings.MAGIC_LINK_TTL_SECONDS)


class MagicLink(RecordModel):
    __tablename__ = "magic_links"

    token_hash: Mapped[str] = mapped_column(String, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), nullable=False, default=get_expires_at
    )

    user_email: Mapped[str] = mapped_column(String, nullable=False)
    user_id: Mapped[UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="cascade"),
        nullable=True,
    )

    source: Mapped[str] = mapped_column(String, nullable=True)

    signup_attribution: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    @declared_attr
    def user(cls) -> Mapped[User | None]:
        return relationship(User)
