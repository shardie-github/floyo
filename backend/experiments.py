"""
Experiment framework for A/B testing and feature experiments.

Tracks experiment participation, variant assignment, and metrics.
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Integer, Float, Boolean, JSON, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import hashlib
import json

Base = declarative_base()


class Experiment(Base):
    """Experiment definition."""
    __tablename__ = "experiments"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=UUID)
    name = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    status = Column(String(20), default="draft")  # draft, active, paused, completed
    variants = Column(JSONB, nullable=False)  # List of variant configs
    start_date = Column(TIMESTAMP(timezone=True), nullable=True)
    end_date = Column(TIMESTAMP(timezone=True), nullable=True)
    traffic_percentage = Column(Integer, default=100)  # 0-100
    target_audience = Column(JSONB, nullable=True)  # Filters for who can participate
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())


class ExperimentParticipation(Base):
    """Track which users are in which experiments."""
    __tablename__ = "experiment_participations"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=UUID)
    experiment_id = Column(PGUUID(as_uuid=True), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant = Column(String(50), nullable=False)  # Which variant they got
    enrolled_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    
    experiment = relationship("Experiment")
    
    __table_args__ = (
        {"comment": "Tracks user participation in A/B tests"}
    )


class ExperimentEvent(Base):
    """Track events for experiment analytics."""
    __tablename__ = "experiment_events"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=UUID)
    experiment_id = Column(PGUUID(as_uuid=True), ForeignKey("experiments.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    variant = Column(String(50), nullable=False)
    event_type = Column(String(50), nullable=False)  # conversion, click, view, etc.
    event_data = Column(JSONB, nullable=True)
    timestamp = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    
    experiment = relationship("Experiment")


# Import UUID properly
from uuid import uuid4 as UUID


class ExperimentService:
    """Service for managing experiments and assignments."""
    
    @staticmethod
    def get_variant(
        db: Session,
        experiment_name: str,
        user_id: UUID,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Get the variant a user should be assigned to for an experiment.
        
        Returns None if user is not eligible or experiment is not active.
        """
        experiment = db.query(Experiment).filter(
            Experiment.name == experiment_name,
            Experiment.status == "active"
        ).first()
        
        if not experiment:
            return None
        
        # Check if experiment is running
        now = datetime.utcnow()
        if experiment.start_date and now < experiment.start_date:
            return None
        if experiment.end_date and now > experiment.end_date:
            return None
        
        # Check traffic percentage
        if experiment.traffic_percentage < 100:
            hash_input = f"{experiment_name}:{user_id}"
            hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            percentage = (hash_value % 100) + 1
            if percentage > experiment.traffic_percentage:
                return None  # User not in experiment
        
        # Check target audience filters
        if experiment.target_audience:
            # Would check user attributes against filters
            # For now, placeholder
            pass
        
        # Check if user already enrolled
        participation = db.query(ExperimentParticipation).filter(
            ExperimentParticipation.experiment_id == experiment.id,
            ExperimentParticipation.user_id == user_id
        ).first()
        
        if participation:
            return participation.variant
        
        # Assign variant based on hash
        variants = experiment.variants
        if not variants:
            return None
        
        hash_input = f"{experiment_name}:assign:{user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        variant_index = hash_value % len(variants)
        assigned_variant = variants[variant_index].get("name", "control")
        
        # Record participation
        participation = ExperimentParticipation(
            experiment_id=experiment.id,
            user_id=user_id,
            variant=assigned_variant
        )
        db.add(participation)
        db.commit()
        
        return assigned_variant
    
    @staticmethod
    def track_event(
        db: Session,
        experiment_name: str,
        user_id: UUID,
        event_type: str,
        event_data: Optional[Dict[str, Any]] = None
    ) -> None:
        """Track an event for experiment analytics."""
        experiment = db.query(Experiment).filter(Experiment.name == experiment_name).first()
        if not experiment:
            return
        
        participation = db.query(ExperimentParticipation).filter(
            ExperimentParticipation.experiment_id == experiment.id,
            ExperimentParticipation.user_id == user_id
        ).first()
        
        if not participation:
            return  # User not in experiment
        
        event = ExperimentEvent(
            experiment_id=experiment.id,
            user_id=user_id,
            variant=participation.variant,
            event_type=event_type,
            event_data=event_data
        )
        db.add(event)
        db.commit()
    
    @staticmethod
    def create_experiment(
        db: Session,
        name: str,
        variants: List[Dict[str, Any]],
        description: Optional[str] = None,
        traffic_percentage: int = 100,
        target_audience: Optional[Dict[str, Any]] = None
    ) -> Experiment:
        """Create a new experiment."""
        experiment = Experiment(
            name=name,
            description=description,
            variants=variants,
            traffic_percentage=traffic_percentage,
            target_audience=target_audience,
            status="draft"
        )
        db.add(experiment)
        db.commit()
        db.refresh(experiment)
        return experiment
    
    @staticmethod
    def start_experiment(
        db: Session,
        experiment_name: str,
        start_date: Optional[datetime] = None
    ) -> Experiment:
        """Start an experiment."""
        experiment = db.query(Experiment).filter(Experiment.name == experiment_name).first()
        if not experiment:
            raise ValueError(f"Experiment '{experiment_name}' not found")
        
        experiment.status = "active"
        experiment.start_date = start_date or datetime.utcnow()
        db.commit()
        db.refresh(experiment)
        return experiment
    
    @staticmethod
    def get_results(
        db: Session,
        experiment_name: str,
        variant: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get experiment results/analytics."""
        experiment = db.query(Experiment).filter(Experiment.name == experiment_name).first()
        if not experiment:
            return {}
        
        # Get participation counts by variant
        from sqlalchemy import func as sql_func
        
        participations = db.query(
            ExperimentParticipation.variant,
            sql_func.count(ExperimentParticipation.id).label("count")
        ).filter(
            ExperimentParticipation.experiment_id == experiment.id
        ).group_by(ExperimentParticipation.variant).all()
        
        # Get event counts
        events = db.query(
            ExperimentEvent.variant,
            ExperimentEvent.event_type,
            sql_func.count(ExperimentEvent.id).label("count")
        ).filter(
            ExperimentEvent.experiment_id == experiment.id
        )
        
        if variant:
            events = events.filter(ExperimentEvent.variant == variant)
        
        events = events.group_by(ExperimentEvent.variant, ExperimentEvent.event_type).all()
        
        # Calculate conversion rates
        variant_stats = {}
        for var, count in participations:
            variant_stats[var] = {
                "participants": count,
                "events": {}
            }
        
        for var, event_type, count in events:
            if var not in variant_stats:
                variant_stats[var] = {"participants": 0, "events": {}}
            variant_stats[var]["events"][event_type] = count
        
        return {
            "experiment": experiment.name,
            "status": experiment.status,
            "variants": variant_stats,
            "total_participants": sum(p.count for p in participations)
        }
