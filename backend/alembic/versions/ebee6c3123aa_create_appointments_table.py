"""create appointments table

Revision ID: ebee6c3123aa
Revises: 3aac7806b330
Create Date: 2026-06-11 13:58:14.280874

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = 'ebee6c3123aa'
down_revision: Union[str, Sequence[str], None] = '3aac7806b330'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('appointments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('patient_id', sa.UUID(), nullable=False),
    sa.Column('slot_id', sa.UUID(), nullable=False),
    sa.Column('service_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.Enum('confirmed', 'cancelled', 'completed', 'no_show', 'waiting', 'in_progress', name='appointment_status'), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id'], ),
    sa.ForeignKeyConstraint(['service_id'], ['services.id'], ),
    sa.ForeignKeyConstraint(['slot_id'], ['appointment_slots.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('slot_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('appointments')

