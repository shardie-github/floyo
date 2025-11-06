"""Add ML models and predictions tables.

Revision ID: ml_models_v1
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'ml_models_v1'
down_revision = None  # Update with latest migration
branch_labels = None
depends_on = None


def upgrade():
    """Create ML models and predictions tables."""
    # ML Models table
    op.create_table(
        'ml_models',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('model_type', sa.String(50), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('training_data_hash', sa.String(64), nullable=True),
        sa.Column('accuracy_metrics', postgresql.JSONB, nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('model_path', sa.String(500), nullable=True),
        sa.Column('training_config', postgresql.JSONB, nullable=True),
    )
    
    op.create_index('idx_ml_models_type_active', 'ml_models', ['model_type', 'is_active'])
    op.create_index('idx_ml_models_type', 'ml_models', ['model_type'])
    
    # Predictions table
    op.create_table(
        'predictions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('model_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('prediction_type', sa.String(50), nullable=False),
        sa.Column('input_features', postgresql.JSONB, nullable=True),
        sa.Column('prediction_result', postgresql.JSONB, nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('actual_outcome', postgresql.JSONB, nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['model_id'], ['ml_models.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    
    op.create_index('idx_predictions_user_created', 'predictions', ['user_id', 'created_at'])
    op.create_index('idx_predictions_model_type', 'predictions', ['model_id', 'prediction_type'])
    op.create_index('idx_predictions_created', 'predictions', ['created_at'])


def downgrade():
    """Drop ML models and predictions tables."""
    op.drop_index('idx_predictions_created', table_name='predictions')
    op.drop_index('idx_predictions_model_type', table_name='predictions')
    op.drop_index('idx_predictions_user_created', table_name='predictions')
    op.drop_table('predictions')
    
    op.drop_index('idx_ml_models_type', table_name='ml_models')
    op.drop_index('idx_ml_models_type_active', table_name='ml_models')
    op.drop_table('ml_models')
