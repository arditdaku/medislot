"""add doctor fields to providers

Revision ID: e5f4d3c2b1a0
Revises: e5d4c3b2a1f0
Create Date: 2026-06-16 14:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f4d3c2b1a0"
down_revision: Union[str, Sequence[str], None] = "e5d4c3b2a1f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("providers", sa.Column("experience", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("fees", sa.Integer(), nullable=True))
    op.add_column("providers", sa.Column("address", sa.String(), nullable=True))
    op.add_column("providers", sa.Column("about", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("providers", "about")
    op.drop_column("providers", "address")
    op.drop_column("providers", "fees")
    op.drop_column("providers", "experience")
