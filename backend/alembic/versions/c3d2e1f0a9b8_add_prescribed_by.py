"""add prescribed_by to prescriptions

Revision ID: c3d2e1f0a9b8
Revises: b2f1a7c9d4e3
Create Date: 2026-06-15 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d2e1f0a9b8"
down_revision: Union[str, Sequence[str], None] = "b2f1a7c9d4e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("prescriptions", sa.Column("prescribed_by", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("prescriptions", "prescribed_by")
