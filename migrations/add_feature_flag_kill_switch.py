"""
Migration: Add kill_switch field to feature_flags table.

Revision ID: add_kill_switch_to_feature_flags
Create Date: 2024-12-19 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'add_kill_switch_to_feature_flags'
down_revision = 'add_feature_flags_experiments_fraud'  # Update with actual previous revision
branch_labels = None
depends_on = None


def upgrade():
    # Add kill_switch column to feature_flags table
    op.add_column(
        'feature_flags',
        sa.Column('kill_switch', sa.Boolean(), nullable=False, server_default='false')
    )


def downgrade():
    # Remove kill_switch column
    op.drop_column('feature_flags', 'kill_switch')
