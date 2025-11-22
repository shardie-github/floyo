"""Autonomous system management API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.autonomous_engine import AutonomousEngine
from backend.self_healing import SelfHealingEngine
from backend.self_optimization import SelfOptimizationEngine
from backend.autonomous_orchestrator import AutonomousOrchestrator
from backend.ml_feedback_loop import MLFeedbackLoop
from backend.auth.utils import get_current_user
from database.models import User

router = APIRouter(prefix="/api/autonomous", tags=["autonomous"])


@router.get("/system-state")
async def get_autonomous_system_state(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get autonomous system state analysis (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    state = AutonomousEngine.analyze_system_state(db)
    return state


@router.post("/auto-remediate")
async def auto_remediate_issues(
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
async def self_optimize_system(
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
async def run_autonomous_cycle(
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
async def get_autonomous_decisions(
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
async def get_continuous_learning(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get continuous learning insights (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    learning = AutonomousEngine.continuous_learning(db)
    return learning


@router.post("/self-heal")
async def trigger_self_healing(
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
async def get_optimization_opportunities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get optimization opportunities (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    optimizations = SelfOptimizationEngine.comprehensive_optimization(db)
    return optimizations


@router.post("/monitor-and-respond")
async def monitor_and_respond(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Continuous monitoring and autonomous response (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    response = AutonomousOrchestrator.monitor_and_respond(db)
    return response


@router.get("/ml/feedback")
async def get_ml_feedback(
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
async def optimize_ml_thresholds(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Optimize ML confidence thresholds (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    optimization = MLFeedbackLoop.optimize_ml_thresholds(db)
    return optimization


@router.get("/ml/suggestion-quality")
async def get_suggestion_quality(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get ML suggestion quality metrics (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    quality = MLFeedbackLoop.analyze_suggestion_quality(db)
    return quality
