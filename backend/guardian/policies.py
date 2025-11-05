"""Policy engine for Guardian risk assessment."""

import os
import yaml
from typing import Dict, List, Any, Optional
from pathlib import Path
from .events import GuardianEvent, DataScope, DataClass, RiskLevel, ResponseAction
import logging

logger = logging.getLogger(__name__)

# Default policy directory (relative to project root)
POLICY_DIR = Path(__file__).parent.parent.parent.parent / "guardian" / "policies"


class PolicyEngine:
    """Policy engine for risk assessment and response actions."""
    
    def __init__(self, policy_dir: Optional[Path] = None):
        """Initialize policy engine."""
        self.policy_dir = policy_dir or POLICY_DIR
        self.policies: Dict[str, Any] = {}
        self.load_policies()
    
    def load_policies(self):
        """Load policies from YAML files."""
        if not self.policy_dir.exists():
            logger.warning(f"Policy directory {self.policy_dir} does not exist, using defaults")
            self.policies = self._get_default_policies()
            return
        
        for policy_file in self.policy_dir.glob("*.yaml"):
            try:
                with open(policy_file, 'r') as f:
                    policy_data = yaml.safe_load(f)
                    policy_name = policy_file.stem
                    self.policies[policy_name] = policy_data
                    logger.info(f"Loaded policy: {policy_name}")
            except Exception as e:
                logger.error(f"Failed to load policy {policy_file}: {e}")
        
        if not self.policies:
            logger.warning("No policies loaded, using defaults")
            self.policies = self._get_default_policies()
    
    def assess_risk(self, event: GuardianEvent) -> GuardianEvent:
        """Assess risk for an event and determine guardian action."""
        # Calculate risk score
        risk_score = self._calculate_risk_score(event)
        
        # Determine risk level
        if risk_score >= 0.8:
            risk_level = RiskLevel.CRITICAL
        elif risk_score >= 0.6:
            risk_level = RiskLevel.HIGH
        elif risk_score >= 0.4:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW
        
        event.risk_score = risk_score
        event.risk_level = risk_level
        
        # Determine response action based on policy
        action = self._determine_action(event)
        event.guardian_action = action
        event.action_reason = self._get_action_reason(event, action)
        
        return event
    
    def _calculate_risk_score(self, event: GuardianEvent) -> float:
        """Calculate risk score based on policies."""
        score = 0.0
        risk_factors = []
        
        # Get risk weights from policy
        risk_weights = self._get_risk_weights()
        
        # Scope factor
        scope_weights = {
            DataScope.USER: 0.1,
            DataScope.APP: 0.2,
            DataScope.API: 0.5,
            DataScope.EXTERNAL: 0.8,
        }
        scope_score = scope_weights.get(event.scope, 0.5)
        score += scope_score * risk_weights.get("scope", 0.3)
        if scope_score > 0.5:
            risk_factors.append(f"Data scope: {event.scope.value}")
        
        # Data class factor
        data_class_weights = {
            DataClass.CREDENTIALS: 1.0,
            DataClass.PAYMENT: 0.9,
            DataClass.BIOMETRICS: 0.9,
            DataClass.HEALTH: 0.8,
            DataClass.CONTACTS: 0.7,
            DataClass.MESSAGES: 0.7,
            DataClass.LOCATION: 0.6,
            DataClass.AUDIO: 0.7,
            DataClass.VIDEO: 0.7,
            DataClass.FILES: 0.5,
            DataClass.BROWSING: 0.4,
            DataClass.CALENDAR: 0.3,
            DataClass.TELEMETRY: 0.2,
            DataClass.OTHER: 0.3,
        }
        class_score = data_class_weights.get(event.data_class, 0.5)
        score += class_score * risk_weights.get("data_class", 0.4)
        if class_score > 0.5:
            risk_factors.append(f"Sensitive data class: {event.data_class.value}")
        
        # External API factor
        if event.scope == DataScope.EXTERNAL:
            score += 0.3
            risk_factors.append("External API access")
        
        # MFA requirement factor
        if event.mfa_required:
            score -= 0.1  # MFA reduces risk
        
        # User decision factor
        if event.user_decision == "deny":
            score += 0.2
            risk_factors.append("User previously denied similar access")
        
        event.risk_factors = risk_factors
        
        return min(max(score, 0.0), 1.0)
    
    def _determine_action(self, event: GuardianEvent) -> ResponseAction:
        """Determine guardian action based on risk level and policies."""
        # Get action thresholds from policy
        thresholds = self._get_action_thresholds()
        
        if event.risk_level == RiskLevel.CRITICAL:
            return ResponseAction.BLOCK
        elif event.risk_level == RiskLevel.HIGH:
            return ResponseAction.ALERT if event.user_decision else ResponseAction.MASK
        elif event.risk_level == RiskLevel.MEDIUM:
            return ResponseAction.REDACT if event.scope == DataScope.EXTERNAL else ResponseAction.ALLOW
        else:
            return ResponseAction.ALLOW
    
    def _get_action_reason(self, event: GuardianEvent, action: ResponseAction) -> str:
        """Generate human-readable reason for action."""
        reasons = {
            ResponseAction.BLOCK: f"Blocked {event.data_class.value} access: {event.risk_level.value} risk",
            ResponseAction.ALERT: f"Alert: {event.data_class.value} access requires review",
            ResponseAction.MASK: f"Masked sensitive data due to {event.risk_level.value} risk",
            ResponseAction.REDACT: f"Redacted {event.data_class.value} before external transmission",
            ResponseAction.ALLOW: f"Allowed {event.data_class.value} access: {event.risk_level.value} risk",
        }
        return reasons.get(action, "Action taken based on policy")
    
    def _get_risk_weights(self) -> Dict[str, float]:
        """Get risk weights from policy."""
        default_weights = {
            "scope": 0.3,
            "data_class": 0.4,
            "external": 0.3,
        }
        
        if "risk_weights" in self.policies:
            return {**default_weights, **self.policies.get("risk_weights", {})}
        return default_weights
    
    def _get_action_thresholds(self) -> Dict[str, float]:
        """Get action thresholds from policy."""
        return {
            "block": 0.8,
            "alert": 0.6,
            "mask": 0.5,
            "redact": 0.4,
        }
    
    def _get_default_policies(self) -> Dict[str, Any]:
        """Get default policies if files don't exist."""
        return {
            "default": {
                "allowed_scopes": ["user", "app", "api", "external"],
                "data_classes": {
                    "telemetry": {"risk": 0.2},
                    "location": {"risk": 0.6},
                    "audio": {"risk": 0.7},
                    "biometrics": {"risk": 0.9},
                },
                "risk_weights": {
                    "scope": 0.3,
                    "data_class": 0.4,
                    "external": 0.3,
                },
                "response_actions": {
                    "allow": {"threshold": 0.4},
                    "redact": {"threshold": 0.5},
                    "mask": {"threshold": 0.6},
                    "alert": {"threshold": 0.7},
                    "block": {"threshold": 0.8},
                },
            }
        }


def load_policies(policy_dir: Optional[Path] = None) -> PolicyEngine:
    """Load policies from directory."""
    return PolicyEngine(policy_dir)
