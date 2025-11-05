"""Trust Fabric AI - Adaptive learning system for privacy preferences."""

from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from database.models import TrustFabricModel, GuardianEvent
from backend.guardian.events import DataClass, RiskLevel
import logging

logger = logging.getLogger(__name__)


class TrustFabricAI:
    """Adaptive AI that learns user privacy preferences."""
    
    def __init__(self, db: Session, user_id: str):
        """Initialize Trust Fabric for a user."""
        self.db = db
        self.user_id = user_id
        self.model = self._get_or_create_model()
    
    def _get_or_create_model(self) -> TrustFabricModel:
        """Get or create Trust Fabric model for user."""
        model = self.db.query(TrustFabricModel).filter(
            TrustFabricModel.user_id == self.user_id
        ).first()
        
        if not model:
            model = TrustFabricModel(
                user_id=self.user_id,
                trust_responses=[],
                risk_weights={},
                comfort_zones={},
            )
            self.db.add(model)
            self.db.commit()
            self.db.refresh(model)
        
        return model
    
    def learn_from_event(self, event: GuardianEvent, user_decision: Optional[str] = None):
        """Learn from a guardian event and user decision."""
        # Update trust responses
        if user_decision:
            responses = self.model.trust_responses or []
            responses.append({
                "timestamp": datetime.utcnow().isoformat(),
                "data_class": event.data_class.value,
                "risk_level": event.risk_level.value,
                "user_decision": user_decision,
            })
            # Keep only last 1000 responses
            self.model.trust_responses = responses[-1000:]
        
        # Update statistics
        self.model.total_events_assessed += 1
        
        # Update average risk score
        total = self.model.total_events_assessed
        current_avg = self.model.avg_risk_score or 0.0
        self.model.avg_risk_score = (
            (current_avg * (total - 1) + event.risk_score) / total
        )
        
        # Learn comfort zones
        self._update_comfort_zones(event, user_decision)
        
        # Update risk weights
        self._adapt_risk_weights(event, user_decision)
        
        self.db.commit()
    
    def _update_comfort_zones(self, event: GuardianEvent, user_decision: Optional[str]):
        """Update user's comfort zones for data classes."""
        comfort_zones = self.model.comfort_zones or {}
        data_class = event.data_class.value
        
        if data_class not in comfort_zones:
            comfort_zones[data_class] = {
                "allowed": 0,
                "denied": 0,
                "total": 0,
                "avg_risk_score": 0.0,
            }
        
        zone = comfort_zones[data_class]
        zone["total"] += 1
        
        if user_decision == "allow":
            zone["allowed"] += 1
        elif user_decision == "deny":
            zone["denied"] += 1
        
        # Calculate average risk score
        total = zone["total"]
        current_avg = zone.get("avg_risk_score", 0.0)
        zone["avg_risk_score"] = (
            (current_avg * (total - 1) + event.risk_score) / total
        )
        
        self.model.comfort_zones = comfort_zones
    
    def _adapt_risk_weights(self, event: GuardianEvent, user_decision: Optional[str]):
        """Adapt risk weights based on user behavior."""
        risk_weights = self.model.risk_weights or {}
        
        # If user frequently denies high-risk events, increase weights
        # If user frequently allows low-risk events, decrease weights
        if user_decision == "deny" and event.risk_score > 0.5:
            # User is privacy-conscious, increase weights slightly
            data_class = event.data_class.value
            if data_class not in risk_weights:
                risk_weights[data_class] = 0.5  # Default weight
            
            # Increase weight by 0.01 (max 1.0)
            risk_weights[data_class] = min(risk_weights[data_class] + 0.01, 1.0)
        
        elif user_decision == "allow" and event.risk_score < 0.3:
            # User is comfortable with low-risk, decrease weights slightly
            data_class = event.data_class.value
            if data_class not in risk_weights:
                risk_weights[data_class] = 0.5
            
            # Decrease weight by 0.01 (min 0.0)
            risk_weights[data_class] = max(risk_weights[data_class] - 0.01, 0.0)
        
        self.model.risk_weights = risk_weights
    
    def get_recommendations(self) -> Dict[str, Any]:
        """Get privacy recommendations for user."""
        recommendations = []
        
        # Analyze privacy mode toggles
        if self.model.privacy_mode_toggles > 10:
            recommendations.append({
                "type": "trust_level",
                "severity": "info",
                "message": "You frequently toggle privacy modes. Consider setting a default trust level.",
                "action": "Review trust level settings",
            })
        
        # Analyze disabled signals
        disabled = self.model.disabled_signals or []
        if len(disabled) > 5:
            recommendations.append({
                "type": "signal_preferences",
                "severity": "info",
                "message": f"You've disabled {len(disabled)} signals. Guardian can suggest tighter defaults.",
                "action": "Review signal preferences",
            })
        
        # Analyze comfort zones
        comfort_zones = self.model.comfort_zones or {}
        for data_class, zone in comfort_zones.items():
            if zone["total"] > 10:
                deny_rate = zone["denied"] / zone["total"]
                if deny_rate > 0.7:
                    recommendations.append({
                        "type": "data_class_preference",
                        "severity": "suggestion",
                        "message": f"You frequently deny {data_class} access. Guardian can auto-block similar requests.",
                        "action": f"Enable auto-block for {data_class}",
                        "data_class": data_class,
                    })
        
        # Get trust level suggestion
        trust_level = self._suggest_trust_level()
        if trust_level:
            recommendations.append({
                "type": "trust_level",
                "severity": "suggestion",
                "message": f"Based on your behavior, '{trust_level}' trust level is recommended.",
                "action": f"Set trust level to {trust_level}",
                "trust_level": trust_level,
            })
        
        return {
            "recommendations": recommendations,
            "model_stats": {
                "total_events": self.model.total_events_assessed,
                "avg_risk_score": self.model.avg_risk_score,
                "comfort_zones": comfort_zones,
            },
        }
    
    def _suggest_trust_level(self) -> Optional[str]:
        """Suggest optimal trust level based on behavior."""
        avg_risk = self.model.avg_risk_score or 0.0
        
        # Analyze user decisions
        responses = self.model.trust_responses or []
        if len(responses) < 20:
            return None  # Not enough data
        
        deny_count = sum(1 for r in responses if r.get("user_decision") == "deny")
        deny_rate = deny_count / len(responses)
        
        if deny_rate > 0.6 or avg_risk > 0.6:
            return "strict"
        elif deny_rate < 0.2 or avg_risk < 0.3:
            return "permissive"
        else:
            return "balanced"
    
    def update_risk_weights(self, weights: Dict[str, float]):
        """Manually update risk weights (from user preferences)."""
        self.model.risk_weights = weights
        self.db.commit()
    
    def export_model(self) -> Dict[str, Any]:
        """Export Trust Fabric model for portability."""
        return {
            "user_id": self.user_id,
            "privacy_mode_toggles": self.model.privacy_mode_toggles,
            "disabled_signals": self.model.disabled_signals or [],
            "trust_responses": self.model.trust_responses or [],
            "risk_weights": self.model.risk_weights or {},
            "comfort_zones": self.model.comfort_zones or {},
            "total_events_assessed": self.model.total_events_assessed,
            "avg_risk_score": self.model.avg_risk_score,
            "last_updated": self.model.last_updated.isoformat() if self.model.last_updated else None,
            "created_at": self.model.created_at.isoformat() if self.model.created_at else None,
        }
    
    def import_model(self, model_data: Dict[str, Any]):
        """Import Trust Fabric model."""
        self.model.privacy_mode_toggles = model_data.get("privacy_mode_toggles", 0)
        self.model.disabled_signals = model_data.get("disabled_signals", [])
        self.model.trust_responses = model_data.get("trust_responses", [])
        self.model.risk_weights = model_data.get("risk_weights", {})
        self.model.comfort_zones = model_data.get("comfort_zones", {})
        self.db.commit()
