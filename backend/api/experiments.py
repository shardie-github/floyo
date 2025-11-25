"""Experiments API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import timedelta

from backend.database import get_db
from backend.auth.utils import get_current_user
from backend.logging_config import get_logger
from backend.lib.experiments import ExperimentFramework, get_active_experiments
from database.models import User

logger = get_logger(__name__)
router = APIRouter(prefix="/api/experiments", tags=["experiments"])


@router.get("/active")
async def get_active_experiments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of active experiments (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    experiments = get_active_experiments()
    return {"experiments": experiments}


@router.get("/assign/{experiment_name}")
async def assign_variant(
    experiment_name: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's assigned variant for an experiment."""
    from backend.lib.experiments import EXPERIMENTS
    
    if experiment_name not in EXPERIMENTS:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    experiment = EXPERIMENTS[experiment_name]
    variant = ExperimentFramework.assign_variant(
        str(current_user.id),
        experiment_name,
        experiment["variants"]
    )
    
    return {
        "experiment_name": experiment_name,
        "variant": variant,
        "experiment_config": experiment
    }


@router.post("/track")
async def track_experiment_event(
    experiment_name: str,
    variant: str,
    event_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Track an experiment event."""
    ExperimentFramework.track_experiment_event(
        db,
        str(current_user.id),
        experiment_name,
        variant,
        event_type
    )
    
    return {"status": "tracked"}


@router.get("/results/{experiment_name}")
async def get_experiment_results(
    experiment_name: str,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get experiment results (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    from backend.lib.experiments import EXPERIMENTS
    
    if experiment_name not in EXPERIMENTS:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    experiment = EXPERIMENTS[experiment_name]
    results = ExperimentFramework.get_experiment_results(
        db,
        experiment_name,
        experiment["variants"],
        days
    )
    
    return results
