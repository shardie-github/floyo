"""Guardian service - core privacy monitoring and enforcement."""

import os
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from .events import GuardianEvent, DataScope, DataClass, RiskLevel, ResponseAction
from .policies import PolicyEngine
from .ledger import TrustLedger
from database.models import User
import logging

logger = logging.getLogger(__name__)


class GuardianService:
    """Core Guardian service for privacy monitoring."""
    
    def __init__(self, policy_engine: Optional[PolicyEngine] = None, ledger: Optional[TrustLedger] = None):
        """Initialize Guardian service."""
        self.policy_engine = policy_engine or PolicyEngine()
        self.ledger = ledger or TrustLedger()
        self._private_mode_active = False
        self._lockdown_active = False
    
    def emit_event(
        self,
        event_type: str,
        scope: DataScope,
        data_class: DataClass,
        description: str,
        data_touched: Dict[str, Any],
        purpose: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        source: str = "unknown",
        metadata: Optional[Dict[str, Any]] = None,
        db: Optional[Session] = None,
    ) -> GuardianEvent:
        """Emit and process a guardian event."""
        # Check if guardian is active
        if self._lockdown_active:
            logger.warning("Guardian lockdown active - blocking event")
            event = GuardianEvent(
                event_type=event_type,
                scope=scope,
                data_class=data_class,
                description=description,
                data_touched={},
                purpose=purpose,
                user_id=user_id,
                session_id=session_id,
                source=source,
                metadata=metadata or {},
            )
            event.risk_level = RiskLevel.CRITICAL
            event.guardian_action = ResponseAction.BLOCK
            event.action_reason = "Guardian lockdown active"
            return event
        
        if self._private_mode_active:
            logger.info("Private mode active - masking telemetry")
            # In private mode, mask telemetry but allow other operations
            if data_class == DataClass.TELEMETRY:
                event = GuardianEvent(
                    event_type=event_type,
                    scope=scope,
                    data_class=data_class,
                    description=description,
                    data_touched={},
                    purpose=purpose,
                    user_id=user_id,
                    session_id=session_id,
                    source=source,
                    metadata=metadata or {},
                )
                event.guardian_action = ResponseAction.MASK
                event.action_reason = "Private mode active - telemetry masked"
                self._append_to_ledger(event)
                return event
        
        # Create event
        event = GuardianEvent(
            event_type=event_type,
            scope=scope,
            data_class=data_class,
            description=description,
            data_touched=data_touched,
            purpose=purpose,
            user_id=user_id,
            session_id=session_id,
            source=source,
            metadata=metadata or {},
        )
        
        # Check MFA requirement
        if db and user_id:
            event.mfa_required = self._check_mfa_requirement(db, user_id, event)
        
        # Assess risk
        event = self.policy_engine.assess_risk(event)
        
        # Apply action
        event = self._apply_action(event)
        
        # Append to ledger
        self._append_to_ledger(event)
        
        # Store in database if needed
        if db and user_id:
            self._store_event_in_db(db, user_id, event)
        
        return event
    
    def _check_mfa_requirement(self, db: Session, user_id: str, event: GuardianEvent) -> bool:
        """Check if MFA is required for this event."""
        # High risk events require MFA
        if event.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            return True
        
        # External API calls require MFA
        if event.scope == DataScope.EXTERNAL:
            return True
        
        # Sensitive data classes require MFA
        sensitive_classes = [
            DataClass.CREDENTIALS,
            DataClass.PAYMENT,
            DataClass.BIOMETRICS,
            DataClass.HEALTH,
        ]
        if event.data_class in sensitive_classes:
            return True
        
        return False
    
    def _apply_action(self, event: GuardianEvent) -> GuardianEvent:
        """Apply guardian action to event."""
        if event.guardian_action == ResponseAction.BLOCK:
            # Block by clearing sensitive data
            event.data_touched = {}
            event.action_reason = "Access blocked by Guardian policy"
        elif event.guardian_action == ResponseAction.MASK:
            # Mask sensitive fields
            event.data_touched = self._mask_sensitive_data(event.data_touched)
            event.action_reason = "Sensitive data masked"
        elif event.guardian_action == ResponseAction.REDACT:
            # Redact specific fields
            event.data_touched = self._redact_fields(event.data_touched)
            event.action_reason = "Data redacted before transmission"
        
        return event
    
    def _mask_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mask sensitive data."""
        masked = {}
        for key, value in data.items():
            if isinstance(value, str) and len(value) > 4:
                masked[key] = value[:2] + "***" + value[-2:]
            elif isinstance(value, (int, float)):
                masked[key] = "***"
            elif isinstance(value, dict):
                masked[key] = self._mask_sensitive_data(value)
            else:
                masked[key] = "***"
        return masked
    
    def _redact_fields(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Redact specific sensitive fields."""
        sensitive_fields = [
            "password", "token", "secret", "key", "credit_card",
            "ssn", "email", "phone", "address",
        ]
        
        redacted = {}
        for key, value in data.items():
            if any(field in key.lower() for field in sensitive_fields):
                redacted[key] = "[REDACTED]"
            elif isinstance(value, dict):
                redacted[key] = self._redact_fields(value)
            else:
                redacted[key] = value
        
        return redacted
    
    def _append_to_ledger(self, event: GuardianEvent):
        """Append event to trust ledger."""
        try:
            hash_value = self.ledger.append(event)
            logger.debug(f"Event {event.event_id} added to ledger: {hash_value[:16]}...")
        except Exception as e:
            logger.error(f"Failed to append event to ledger: {e}")
    
    def _store_event_in_db(self, db: Session, user_id: str, event: GuardianEvent):
        """Store event summary in database."""
        try:
            from database.models import GuardianEvent as DBGuardianEvent
            
            db_event = DBGuardianEvent(
                event_id=event.event_id,
                user_id=user_id,
                event_type=event.event_type,
                scope=event.scope.value,
                data_class=event.data_class.value,
                description=event.description,
                data_touched=event.data_touched,
                purpose=event.purpose,
                risk_level=event.risk_level.value,
                risk_score=event.risk_score,
                risk_factors=event.risk_factors,
                guardian_action=event.guardian_action.value,
                action_reason=event.action_reason,
                user_decision=event.user_decision,
                session_id=event.session_id,
                mfa_required=event.mfa_required,
                source=event.source,
                metadata=event.metadata,
                timestamp=event.timestamp,
            )
            db.add(db_event)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to store event in database: {e}")
            db.rollback()
    
    def enable_private_mode(self):
        """Enable private mode - freeze telemetry."""
        self._private_mode_active = True
        logger.info("Private mode enabled")
    
    def disable_private_mode(self):
        """Disable private mode."""
        self._private_mode_active = False
        logger.info("Private mode disabled")
    
    def enable_lockdown(self):
        """Enable emergency data lockdown."""
        self._lockdown_active = True
        logger.warning("Emergency lockdown enabled")
    
    def disable_lockdown(self):
        """Disable emergency lockdown."""
        self._lockdown_active = False
        logger.info("Emergency lockdown disabled")
    
    def get_trust_summary(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """Get trust summary for user."""
        entries = self.ledger.get_user_ledger(user_id)
        
        # Filter by date range
        cutoff = datetime.utcnow().timestamp() - (days * 24 * 60 * 60)
        recent_entries = [
            e for e in entries
            if datetime.fromisoformat(e["timestamp"]).timestamp() > cutoff
        ]
        
        # Calculate statistics
        total_events = len(recent_entries)
        risk_distribution = {}
        action_distribution = {}
        
        for entry in recent_entries:
            risk_level = entry.get("risk_level", "low")
            risk_distribution[risk_level] = risk_distribution.get(risk_level, 0) + 1
            
            action = entry.get("guardian_action", "allow")
            action_distribution[action] = action_distribution.get(action, 0) + 1
        
        # Calculate guardian confidence score
        safe_operations = sum(
            1 for e in recent_entries
            if e.get("risk_level") in ["low", "medium"]
        )
        confidence_score = (safe_operations / total_events * 100) if total_events > 0 else 100
        
        return {
            "total_events": total_events,
            "risk_distribution": risk_distribution,
            "action_distribution": action_distribution,
            "confidence_score": confidence_score,
            "entries": recent_entries[:50],  # Limit to recent 50
        }


# Global instance
_guardian_service: Optional[GuardianService] = None


def get_guardian_service() -> GuardianService:
    """Get global Guardian service instance."""
    global _guardian_service
    if _guardian_service is None:
        _guardian_service = GuardianService()
    return _guardian_service
