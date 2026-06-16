"""add gender to patients

Revision ID: e5d4c3b2a1f0
Revises: d4c3b2a1e0f9
Create Date: 2026-06-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5d4c3b2a1f0"
down_revision: Union[str, Sequence[str], None] = "d4c3b2a1e0f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("patients", sa.Column("gender", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("patients", "gender")
