"""Guardian API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from backend.database import get_db
from backend.main import get_current_user
from database.models import User, GuardianEvent, TrustLedgerRoot, GuardianSettings, TrustFabricModel
from backend.guardian.service import get_guardian_service
from backend.guardian.inspector import GuardianInspector
from backend.guardian.trust_fabric import TrustFabricAI
from backend.guardian.ledger import TrustLedger
from backend.guardian.events import DataScope, DataClass
from backend.security import TwoFactorAuthManager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/guardian", tags=["guardian"])


@router.get("/trust-summary")
async def get_trust_summary(
    days: int = 7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get trust summary for user."""
    guardian = get_guardian_service()
    summary = guardian.get_trust_summary(str(current_user.id), days=days)
    return summary


@router.get("/events")
async def get_guardian_events(
    limit: int = 50,
    offset: int = 0,
    risk_level: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get guardian events for user."""
    query = db.query(GuardianEvent).filter(
        GuardianEvent.user_id == str(current_user.id)
    )
    
    if risk_level:
        query = query.filter(GuardianEvent.risk_level == risk_level)
    
    total = query.count()
    events = query.order_by(GuardianEvent.timestamp.desc()).offset(offset).limit(limit).all()
    
    return {
        "events": [
            {
                "event_id": e.event_id,
                "timestamp": e.timestamp.isoformat(),
                "event_type": e.event_type,
                "scope": e.scope,
                "data_class": e.data_class,
                "description": e.description,
                "purpose": e.purpose,
                "risk_level": e.risk_level,
                "risk_score": e.risk_score,
                "guardian_action": e.guardian_action,
                "action_reason": e.action_reason,
                "source": e.source,
            }
            for e in events
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/event/{event_id}")
async def get_event_details(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get detailed event information."""
    event = db.query(GuardianEvent).filter(
        GuardianEvent.event_id == event_id,
        GuardianEvent.user_id == str(current_user.id),
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {
        "event_id": event.event_id,
        "timestamp": event.timestamp.isoformat(),
        "event_type": event.event_type,
        "scope": event.scope,
        "data_class": event.data_class,
        "description": event.description,
        "purpose": event.purpose,
        "data_touched": event.data_touched,
        "risk_level": event.risk_level,
        "risk_score": event.risk_score,
        "risk_factors": event.risk_factors or [],
        "guardian_action": event.guardian_action,
        "action_reason": event.action_reason,
        "source": event.source,
        "metadata": event.metadata or {},
    }


@router.post("/settings/private-mode")
async def toggle_private_mode(
    enabled: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Toggle private mode."""
    guardian = get_guardian_service()
    
    if enabled:
        guardian.enable_private_mode()
    else:
        guardian.disable_private_mode()
    
    # Update settings in database
    settings = db.query(GuardianSettings).filter(
        GuardianSettings.user_id == str(current_user.id)
    ).first()
    
    if not settings:
        settings = GuardianSettings(user_id=str(current_user.id))
        db.add(settings)
    
    settings.private_mode_enabled = enabled
    db.commit()
    
    return {"private_mode_enabled": enabled}


@router.post("/settings/lockdown")
async def toggle_lockdown(
    enabled: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Toggle emergency data lockdown."""
    guardian = get_guardian_service()
    
    if enabled:
        guardian.enable_lockdown()
    else:
        guardian.disable_lockdown()
    
    # Update settings in database
    settings = db.query(GuardianSettings).filter(
        GuardianSettings.user_id == str(current_user.id)
    ).first()
    
    if not settings:
        settings = GuardianSettings(user_id=str(current_user.id))
        db.add(settings)
    
    settings.lockdown_enabled = enabled
    db.commit()
    
    return {"lockdown_enabled": enabled}


@router.get("/settings")
async def get_guardian_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get Guardian settings."""
    settings = db.query(GuardianSettings).filter(
        GuardianSettings.user_id == str(current_user.id)
    ).first()
    
    if not settings:
        settings = GuardianSettings(user_id=str(current_user.id))
        db.add(settings)
        db.commit()
    
    return {
        "private_mode_enabled": settings.private_mode_enabled,
        "lockdown_enabled": settings.lockdown_enabled,
        "sensitive_context_detection": settings.sensitive_context_detection,
        "mfa_bubble_enabled": settings.mfa_bubble_enabled,
        "trust_level": settings.trust_level,
    }


@router.post("/settings/trust-level")
async def update_trust_level(
    trust_level: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Update trust level."""
    if trust_level not in ["strict", "balanced", "permissive"]:
        raise HTTPException(status_code=400, detail="Invalid trust level")
    
    settings = db.query(GuardianSettings).filter(
        GuardianSettings.user_id == str(current_user.id)
    ).first()
    
    if not settings:
        settings = GuardianSettings(user_id=str(current_user.id))
        db.add(settings)
    
    settings.trust_level = trust_level
    db.commit()
    
    return {"trust_level": trust_level}


@router.get("/verify")
async def verify_ledger(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Verify trust ledger integrity."""
    ledger = TrustLedger()
    verification = ledger.verify(str(current_user.id))
    
    return verification


@router.get("/recommendations")
async def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get Trust Fabric recommendations."""
    trust_fabric = TrustFabricAI(db, str(current_user.id))
    return trust_fabric.get_recommendations()


@router.get("/trust-report")
async def get_trust_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Get comprehensive trust report."""
    inspector = GuardianInspector()
    report = inspector.generate_trust_report(str(current_user.id))
    return report


@router.get("/trust-fabric/export")
async def export_trust_fabric(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Export Trust Fabric model."""
    trust_fabric = TrustFabricAI(db, str(current_user.id))
    return trust_fabric.export_model()


@router.post("/trust-fabric/import")
async def import_trust_fabric(
    model_data: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Import Trust Fabric model."""
    trust_fabric = TrustFabricAI(db, str(current_user.id))
    trust_fabric.import_model(model_data)
    return {"status": "imported"}


@router.post("/event/{event_id}/decision")
async def record_user_decision(
    event_id: str,
    decision: str,  # "allow" or "deny"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Record user decision on an event."""
    if decision not in ["allow", "deny"]:
        raise HTTPException(status_code=400, detail="Invalid decision")
    
    event = db.query(GuardianEvent).filter(
        GuardianEvent.event_id == event_id,
        GuardianEvent.user_id == str(current_user.id),
    ).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.user_decision = decision
    db.commit()
    
    # Learn from decision
    trust_fabric = TrustFabricAI(db, str(current_user.id))
    from backend.guardian.events import GuardianEvent as GE
    ge = GE.from_dict({
        "event_id": event.event_id,
        "timestamp": event.timestamp.isoformat(),
        "data_class": event.data_class,
        "risk_level": event.risk_level,
        "risk_score": event.risk_score,
    })
    trust_fabric.learn_from_event(ge, decision)
    
    return {"status": "recorded", "decision": decision}


@router.post("/explain")
async def explain_guardian(
    question: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Answer questions about Guardian using Guardian GPT."""
    from backend.guardian.explainer import GuardianGPT
    
    explainer = GuardianGPT()
    answer = explainer.answer_question(question, str(current_user.id))
    
    return {
        "question": question,
        "answer": answer,
    }


@router.get("/explain/event/{event_id}")
async def explain_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Explain a specific event."""
    from backend.guardian.explainer import GuardianGPT
    
    explainer = GuardianGPT()
    explanation = explainer.explain_event(event_id, str(current_user.id))
    
    return {
        "event_id": event_id,
        "explanation": explanation,
    }
