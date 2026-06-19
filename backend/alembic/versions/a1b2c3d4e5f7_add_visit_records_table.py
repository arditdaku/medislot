from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, Sequence[str], None] = 'e5f4d3c2b1a0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'visit_records',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('appointment_id', sa.UUID(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=False),
        sa.Column('ai_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id']),
        sa.ForeignKeyConstraint(['doctor_id'], ['providers.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id'),
    )


def downgrade() -> None:
    op.drop_table('visit_records')
