"""Autonomous system management API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.rate_limit import limiter, RATE_LIMIT_PER_MINUTE
from backend.autonomous_engine import AutonomousEngine
from backend.self_healing import SelfHealingEngine
from backend.self_optimization import SelfOptimizationEngine
from backend.autonomous_orchestrator import AutonomousOrchestrator
from backend.ml_feedback_loop import MLFeedbackLoop
from backend.auth.utils import get_current_user
from database.models import User

router = APIRouter(prefix="/api/autonomous", tags=["autonomous"])


@router.get("/system-state")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_autonomous_system_state(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get autonomous system state analysis (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    state = AutonomousEngine.analyze_system_state(db)
    return state


@router.post("/auto-remediate")
@limiter.limit("5/hour")  # Very restrictive - admin operation
async def auto_remediate_issues(
    request: Request,
    dry_run: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Auto-remediate detected issues (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    results = AutonomousEngine.auto_remediate(db, dry_run)
    return results


@router.post("/self-optimize")
@limiter.limit("5/hour")  # Very restrictive - admin operation
async def self_optimize_system(
    request: Request,
    optimization_type: str = "all",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Self-optimize system (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    optimizations = AutonomousEngine.self_optimize(db, optimization_type)
    return optimizations


@router.post("/run-cycle")
@limiter.limit("5/hour")  # Very restrictive - admin operation
async def run_autonomous_cycle(
    request: Request,
    dry_run: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run complete autonomous cycle (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cycle_results = AutonomousOrchestrator.run_full_cycle(db, dry_run)
    return cycle_results


@router.get("/decisions")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_autonomous_decisions(
    request: Request,
    decision_type: str = "resource_allocation",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get autonomous decisions (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    decisions = AutonomousEngine.autonomous_decision_engine(db, decision_type)
    return decisions


@router.get("/learning")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_continuous_learning(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get continuous learning insights (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    learning = AutonomousEngine.continuous_learning(db)
    return learning


@router.post("/self-heal")
@limiter.limit("5/hour")  # Very restrictive - admin operation
async def trigger_self_healing(
    request: Request,
    dry_run: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Trigger self-healing (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    healing_results = SelfHealingEngine.auto_heal(db, dry_run)
    return healing_results


@router.get("/optimization-opportunities")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_optimization_opportunities(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get optimization opportunities (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    optimizations = SelfOptimizationEngine.comprehensive_optimization(db)
    return optimizations


@router.post("/monitor-and-respond")
@limiter.limit("5/hour")  # Very restrictive - admin operation
async def monitor_and_respond(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Continuous monitoring and autonomous response (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    response = AutonomousOrchestrator.monitor_and_respond(db)
    return response


@router.get("/ml/feedback")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_ml_feedback(
    request: Request,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ML feedback data (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    feedback = MLFeedbackLoop.collect_feedback(db, days)
    return feedback


@router.get("/ml/optimize-thresholds")
@limiter.limit("5/hour")  # Very restrictive - admin operation
async def optimize_ml_thresholds(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Optimize ML confidence thresholds (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    optimization = MLFeedbackLoop.optimize_ml_thresholds(db)
    return optimization


@router.get("/ml/suggestion-quality")
@limiter.limit("10/hour")  # Admin endpoint, restrictive
async def get_suggestion_quality(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ML suggestion quality metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    quality = MLFeedbackLoop.analyze_suggestion_quality(db)
    return quality
