"""
Migration: Add feature flags, experiments, and fraud scoring tables.

Revision ID: add_feature_flags_experiments_fraud
Create Date: 2024-01-01 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'add_feature_flags_experiments_fraud'
down_revision = None  # Update with previous revision
branch_labels = None
depends_on = None


def upgrade():
    # Feature flags table
    op.create_table(
        'feature_flags',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('enabled', sa.Boolean(), default=False),
        sa.Column('rollout_percentage', sa.Integer(), default=0),
        sa.Column('variant_config', postgresql.JSONB(), nullable=True),
        sa.Column('target_users', postgresql.JSONB(), nullable=True),
        sa.Column('target_organizations', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_feature_flags_name', 'feature_flags', ['name'])
    
    # Feature flag overrides table
    op.create_table(
        'feature_flag_overrides',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('feature_flag_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('feature_flags.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('variant', sa.String(50), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_feature_flag_overrides_flag', 'feature_flag_overrides', ['feature_flag_id'])
    op.create_index('idx_feature_flag_overrides_user', 'feature_flag_overrides', ['user_id'])
    op.create_index('idx_feature_flag_overrides_org', 'feature_flag_overrides', ['organization_id'])
    
    # Experiments table
    op.create_table(
        'experiments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), default='draft'),
        sa.Column('variants', postgresql.JSONB(), nullable=False),
        sa.Column('start_date', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('end_date', sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column('traffic_percentage', sa.Integer(), default=100),
        sa.Column('target_audience', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('idx_experiments_name', 'experiments', ['name'])
    op.create_index('idx_experiments_status', 'experiments', ['status'])
    
    # Experiment participations table
    op.create_table(
        'experiment_participations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('experiment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('experiments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('variant', sa.String(50), nullable=False),
        sa.Column('enrolled_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_experiment_participations_experiment', 'experiment_participations', ['experiment_id'])
    op.create_index('idx_experiment_participations_user', 'experiment_participations', ['user_id'])
    
    # Experiment events table
    op.create_table(
        'experiment_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('experiment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('experiments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('variant', sa.String(50), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('event_data', postgresql.JSONB(), nullable=True),
        sa.Column('timestamp', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('idx_experiment_events_experiment', 'experiment_events', ['experiment_id'])
    op.create_index('idx_experiment_events_user', 'experiment_events', ['user_id'])
    op.create_index('idx_experiment_events_timestamp', 'experiment_events', ['timestamp'])
    
    # Fraud scores table
    op.create_table(
        'fraud_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=True),
        sa.Column('event_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('events.id', ondelete='CASCADE'), nullable=True),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(20), nullable=False),
        sa.Column('reasons', postgresql.JSONB(), nullable=True),
        sa.Column('flagged', sa.Boolean(), default=False),
        sa.Column('reviewed', sa.Boolean(), default=False),
        sa.Column('reviewer_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('reviewed_at', sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_index('idx_fraud_scores_user', 'fraud_scores', ['user_id'])
    op.create_index('idx_fraud_scores_org', 'fraud_scores', ['organization_id'])
    op.create_index('idx_fraud_scores_event', 'fraud_scores', ['event_id'])
    op.create_index('idx_fraud_scores_created', 'fraud_scores', ['created_at'])
    op.create_index('idx_fraud_scores_flagged', 'fraud_scores', ['flagged'])


def downgrade():
    op.drop_table('fraud_scores')
    op.drop_table('experiment_events')
    op.drop_table('experiment_participations')
    op.drop_table('experiments')
    op.drop_table('feature_flag_overrides')
    op.drop_table('feature_flags')
