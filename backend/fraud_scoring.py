"""
Fraud detection and scoring system for Floyo.

Detects suspicious patterns and assigns risk scores to user actions.
"""

from typing import Dict, Any, Optional, List
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Integer, Float, JSON, ForeignKey, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID as PGUUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import and_, or_
import re

Base = declarative_base()


class FraudScore(Base):
    """Fraud risk score for a user or event."""
    __tablename__ = "fraud_scores"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=UUID)
    user_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    organization_id = Column(PGUUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True, index=True)
    event_id = Column(PGUUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=True, index=True)
    risk_score = Column(Float, nullable=False)  # 0.0 to 100.0
    risk_level = Column(String(20), nullable=False)  # low, medium, high, critical
    reasons = Column(JSONB, nullable=True)  # List of risk indicators
    flagged = Column(Boolean, default=False)
    reviewed = Column(Boolean, default=False)
    reviewer_id = Column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)
    reviewed_at = Column(TIMESTAMP(timezone=True), nullable=True)


# Import UUID properly
from uuid import uuid4 as UUID


class FraudDetectionService:
    """Service for fraud detection and scoring."""
    
    # Risk thresholds
    LOW_RISK_THRESHOLD = 30.0
    MEDIUM_RISK_THRESHOLD = 60.0
    HIGH_RISK_THRESHOLD = 80.0
    
    @staticmethod
    def calculate_risk_score(
        db: Session,
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        event_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate fraud risk score based on multiple factors.
        
        Returns:
            {
                "risk_score": float,
                "risk_level": str,
                "reasons": List[str],
                "flagged": bool
            }
        """
        risk_score = 0.0
        reasons = []
        
        # Factor 1: Unusual activity patterns
        if user_id:
            activity_score = FraudDetectionService._check_activity_patterns(db, user_id)
            risk_score += activity_score["score"]
            reasons.extend(activity_score["reasons"])
        
        # Factor 2: IP address analysis
        if ip_address:
            ip_score = FraudDetectionService._check_ip_address(ip_address)
            risk_score += ip_score["score"]
            reasons.extend(ip_score["reasons"])
        
        # Factor 3: Device fingerprint
        if user_agent:
            device_score = FraudDetectionService._check_device(user_agent)
            risk_score += device_score["score"]
            reasons.extend(device_score["reasons"])
        
        # Factor 4: Rate limiting violations
        rate_score = FraudDetectionService._check_rate_limits(db, user_id, ip_address)
        risk_score += rate_score["score"]
        reasons.extend(rate_score["reasons"])
        
        # Factor 5: Geographic anomalies
        geo_score = FraudDetectionService._check_geography(db, user_id, ip_address)
        risk_score += geo_score["score"]
        reasons.extend(geo_score["reasons"])
        
        # Factor 6: Account age and verification
        if user_id:
            account_score = FraudDetectionService._check_account_status(db, user_id)
            risk_score += account_score["score"]
            reasons.extend(account_score["reasons"])
        
        # Cap score at 100
        risk_score = min(risk_score, 100.0)
        
        # Determine risk level
        if risk_score >= FraudDetectionService.HIGH_RISK_THRESHOLD:
            risk_level = "critical" if risk_score >= 95 else "high"
        elif risk_score >= FraudDetectionService.MEDIUM_RISK_THRESHOLD:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        flagged = risk_score >= FraudDetectionService.MEDIUM_RISK_THRESHOLD
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reasons": reasons,
            "flagged": flagged
        }
    
    @staticmethod
    def _check_activity_patterns(db: Session, user_id: UUID) -> Dict[str, Any]:
        """Check for unusual activity patterns."""
        from database.models import Event
        
        score = 0.0
        reasons = []
        
        # Check event frequency
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_events = db.query(Event).filter(
            Event.user_id == user_id,
            Event.timestamp >= one_hour_ago
        ).count()
        
        if recent_events > 1000:
            score += 30.0
            reasons.append(f"Excessive activity: {recent_events} events in last hour")
        elif recent_events > 500:
            score += 15.0
            reasons.append(f"High activity: {recent_events} events in last hour")
        
        # Check for unusual file patterns
        suspicious_patterns = [".exe", ".bat", ".sh", ".scr"]
        recent_files = db.query(Event.file_path).filter(
            Event.user_id == user_id,
            Event.timestamp >= one_hour_ago,
            Event.file_path.isnot(None)
        ).all()
        
        suspicious_count = sum(1 for f in recent_files if f and any(p in f[0].lower() for p in suspicious_patterns))
        if suspicious_count > 10:
            score += 20.0
            reasons.append(f"Suspicious file patterns detected: {suspicious_count}")
        
        return {"score": score, "reasons": reasons}
    
    @staticmethod
    def _check_ip_address(ip_address: str) -> Dict[str, Any]:
        """Check IP address for suspicious indicators."""
        score = 0.0
        reasons = []
        
        # Check for VPN/proxy indicators (simplified)
        # In production, use a proper IP reputation service
        suspicious_ips = ["127.0.0.1"]  # Placeholder
        if ip_address in suspicious_ips:
            score += 25.0
            reasons.append("Suspicious IP address")
        
        # Check for TOR exit nodes (would need external service)
        # Check for known malicious IPs (would need threat intelligence)
        
        return {"score": score, "reasons": reasons}
    
    @staticmethod
    def _check_device(user_agent: Optional[str]) -> Dict[str, Any]:
        """Check device/user agent for suspicious indicators."""
        score = 0.0
        reasons = []
        
        if not user_agent:
            score += 10.0
            reasons.append("Missing user agent")
            return {"score": score, "reasons": reasons}
        
        # Check for automation tools
        automation_patterns = ["bot", "crawler", "scraper", "headless", "selenium"]
        if any(pattern in user_agent.lower() for pattern in automation_patterns):
            score += 30.0
            reasons.append("Automation tool detected in user agent")
        
        # Check for suspicious browser strings
        if len(user_agent) < 20:
            score += 15.0
            reasons.append("Unusually short user agent")
        
        return {"score": score, "reasons": reasons}
    
    @staticmethod
    def _check_rate_limits(db: Session, user_id: Optional[UUID], ip_address: Optional[str]) -> Dict[str, Any]:
        """Check for rate limiting violations."""
        score = 0.0
        reasons = []
        
        # Would check actual rate limit violations
        # For now, placeholder
        
        return {"score": score, "reasons": reasons}
    
    @staticmethod
    def _check_geography(db: Session, user_id: Optional[UUID], ip_address: Optional[str]) -> Dict[str, Any]:
        """Check for geographic anomalies."""
        score = 0.0
        reasons = []
        
        # Would check IP geolocation against user's normal locations
        # Would detect impossible travel (e.g., login from US and Europe in same hour)
        # Placeholder for now
        
        return {"score": score, "reasons": reasons}
    
    @staticmethod
    def _check_account_status(db: Session, user_id: UUID) -> Dict[str, Any]:
        """Check account age and verification status."""
        from database.models import User
        
        score = 0.0
        reasons = []
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"score": 0.0, "reasons": []}
        
        # New accounts are higher risk
        account_age = datetime.utcnow() - user.created_at
        if account_age < timedelta(hours=1):
            score += 25.0
            reasons.append("Very new account (< 1 hour old)")
        elif account_age < timedelta(days=1):
            score += 10.0
            reasons.append("New account (< 1 day old)")
        
        # Unverified email is higher risk
        if not user.email_verified:
            score += 15.0
            reasons.append("Email not verified")
        
        return {"score": score, "reasons": reasons}
    
    @staticmethod
    def record_score(
        db: Session,
        risk_data: Dict[str, Any],
        user_id: Optional[UUID] = None,
        organization_id: Optional[UUID] = None,
        event_id: Optional[UUID] = None
    ) -> FraudScore:
        """Record a fraud score."""
        score = FraudScore(
            user_id=user_id,
            organization_id=organization_id,
            event_id=event_id,
            risk_score=risk_data["risk_score"],
            risk_level=risk_data["risk_level"],
            reasons=risk_data["reasons"],
            flagged=risk_data["flagged"]
        )
        db.add(score)
        db.commit()
        db.refresh(score)
        return score
    
    @staticmethod
    def get_user_risk_profile(db: Session, user_id: UUID) -> Dict[str, Any]:
        """Get overall risk profile for a user."""
        # Get recent scores
        recent_scores = db.query(FraudScore).filter(
            FraudScore.user_id == user_id,
            FraudScore.created_at >= datetime.utcnow() - timedelta(days=30)
        ).order_by(FraudScore.created_at.desc()).limit(100).all()
        
        if not recent_scores:
            return {
                "overall_risk": "low",
                "average_score": 0.0,
                "flagged_count": 0,
                "total_scores": 0
            }
        
        avg_score = sum(s.risk_score for s in recent_scores) / len(recent_scores)
        flagged_count = sum(1 for s in recent_scores if s.flagged)
        
        # Determine overall risk
        if avg_score >= FraudDetectionService.HIGH_RISK_THRESHOLD:
            overall_risk = "critical" if avg_score >= 95 else "high"
        elif avg_score >= FraudDetectionService.MEDIUM_RISK_THRESHOLD:
            overall_risk = "medium"
        else:
            overall_risk = "low"
        
        return {
            "overall_risk": overall_risk,
            "average_score": avg_score,
            "flagged_count": flagged_count,
            "total_scores": len(recent_scores),
            "recent_scores": [
                {
                    "score": s.risk_score,
                    "level": s.risk_level,
                    "flagged": s.flagged,
                    "created_at": s.created_at.isoformat()
                }
                for s in recent_scores[:10]
            ]
        }
