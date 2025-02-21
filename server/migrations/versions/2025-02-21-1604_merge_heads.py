"""merge heads

Revision ID: c5c84f56ca7f
Revises: 21585ed16305, 2025_02_21_1440
Create Date: 2025-02-21 16:04:35.591912

"""
from alembic import op
import sqlalchemy as sa


# Polar Custom Imports

# revision identifiers, used by Alembic.
revision = 'c5c84f56ca7f'
down_revision = ('21585ed16305', '2025_02_21_1440')
branch_labels: tuple[str] | None = None
depends_on: tuple[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
