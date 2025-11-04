"""Inspector agent - background analysis of Guardian logs."""

import os
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime, timedelta
from .ledger import TrustLedger
from .service import get_guardian_service
import logging

logger = logging.getLogger(__name__)


class GuardianInspector:
    """Background agent that analyzes Guardian logs and generates reports."""
    
    def __init__(self, ledger: TrustLedger = None):
        """Initialize inspector."""
        self.ledger = ledger or TrustLedger()
        self.guardian = get_guardian_service()
        self.reports_dir = Path(os.getenv("GUARDIAN_REPORTS_DIR", "/tmp/guardian/reports"))
        self.reports_dir.mkdir(parents=True, exist_ok=True)
    
    def analyze_hourly(self, user_id: str) -> Dict[str, Any]:
        """Analyze logs for the past hour."""
        entries = self.ledger.get_user_ledger(user_id)
        
        # Filter to last hour
        cutoff = datetime.utcnow() - timedelta(hours=1)
        recent_entries = [
            e for e in entries
            if datetime.fromisoformat(e["timestamp"]) > cutoff
        ]
        
        return self._analyze_entries(recent_entries, user_id)
    
    def analyze_daily(self, user_id: str) -> Dict[str, Any]:
        """Analyze logs for the past day."""
        entries = self.ledger.get_user_ledger(user_id)
        
        # Filter to last 24 hours
        cutoff = datetime.utcnow() - timedelta(days=1)
        recent_entries = [
            e for e in entries
            if datetime.fromisoformat(e["timestamp"]) > cutoff
        ]
        
        return self._analyze_entries(recent_entries, user_id)
    
    def analyze_weekly(self, user_id: str) -> Dict[str, Any]:
        """Analyze logs for the past week."""
        entries = self.ledger.get_user_ledger(user_id)
        
        # Filter to last 7 days
        cutoff = datetime.utcnow() - timedelta(days=7)
        recent_entries = [
            e for e in entries
            if datetime.fromisoformat(e["timestamp"]) > cutoff
        ]
        
        return self._analyze_entries(recent_entries, user_id)
    
    def _analyze_entries(self, entries: List[Dict[str, Any]], user_id: str) -> Dict[str, Any]:
        """Analyze entries and generate insights."""
        if not entries:
            return {
                "period": "unknown",
                "total_events": 0,
                "summary": "No events found",
                "classifications": {},
                "anomalies": [],
                "policy_changes": [],
                "confidence_score": 100.0,
            }
        
        # Classify events
        classifications = self._classify_events(entries)
        
        # Detect anomalies
        anomalies = self._detect_anomalies(entries)
        
        # Detect policy changes
        policy_changes = self._detect_policy_changes(entries)
        
        # Calculate confidence score
        confidence_score = self._calculate_confidence_score(entries)
        
        # Generate summary
        summary = self._generate_summary(entries, classifications, confidence_score)
        
        return {
            "period": "custom",
            "total_events": len(entries),
            "summary": summary,
            "classifications": classifications,
            "anomalies": anomalies,
            "policy_changes": policy_changes,
            "confidence_score": confidence_score,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    def _classify_events(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Classify events by type, risk, and action."""
        classifications = {
            "by_type": {},
            "by_risk": {},
            "by_action": {},
            "by_scope": {},
            "by_data_class": {},
        }
        
        for entry in entries:
            # By type
            event_type = entry.get("event_type", "unknown")
            classifications["by_type"][event_type] = classifications["by_type"].get(event_type, 0) + 1
            
            # By risk
            risk_level = entry.get("risk_level", "low")
            classifications["by_risk"][risk_level] = classifications["by_risk"].get(risk_level, 0) + 1
            
            # By action
            action = entry.get("guardian_action", "allow")
            classifications["by_action"][action] = classifications["by_action"].get(action, 0) + 1
            
            # By scope
            scope = entry.get("scope", "app")
            classifications["by_scope"][scope] = classifications["by_scope"].get(scope, 0) + 1
            
            # By data class
            data_class = entry.get("data_class", "telemetry")
            classifications["by_data_class"][data_class] = classifications["by_data_class"].get(data_class, 0) + 1
        
        return classifications
    
    def _detect_anomalies(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect anomalous patterns."""
        anomalies = []
        
        # High risk spike
        high_risk_count = sum(1 for e in entries if e.get("risk_level") in ["high", "critical"])
        if high_risk_count > len(entries) * 0.2:  # More than 20% high risk
            anomalies.append({
                "type": "high_risk_spike",
                "severity": "medium",
                "description": f"Unusually high number of high-risk events: {high_risk_count}/{len(entries)}",
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        # Blocked actions spike
        blocked_count = sum(1 for e in entries if e.get("guardian_action") == "block")
        if blocked_count > 5:
            anomalies.append({
                "type": "blocked_actions_spike",
                "severity": "high",
                "description": f"Multiple blocked actions detected: {blocked_count}",
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        # External API spike
        external_count = sum(1 for e in entries if e.get("scope") == "external")
        if external_count > len(entries) * 0.3:  # More than 30% external
            anomalies.append({
                "type": "external_api_spike",
                "severity": "medium",
                "description": f"Unusually high external API usage: {external_count}/{len(entries)}",
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        # Sensitive data access
        sensitive_classes = ["credentials", "payment", "biometrics", "health"]
        sensitive_count = sum(
            1 for e in entries
            if e.get("data_class") in sensitive_classes
        )
        if sensitive_count > 0:
            anomalies.append({
                "type": "sensitive_data_access",
                "severity": "high",
                "description": f"Sensitive data accessed {sensitive_count} time(s)",
                "timestamp": datetime.utcnow().isoformat(),
            })
        
        return anomalies
    
    def _detect_policy_changes(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect policy-related changes."""
        changes = []
        
        # Look for events that indicate policy changes
        policy_change_types = [
            "policy_updated",
            "consent_given",
            "consent_revoked",
            "privacy_mode_toggled",
            "lockdown_enabled",
            "lockdown_disabled",
        ]
        
        for entry in entries:
            if entry.get("event_type") in policy_change_types:
                changes.append({
                    "type": entry.get("event_type"),
                    "timestamp": entry.get("timestamp"),
                    "details": entry.get("metadata", {}),
                })
        
        return changes
    
    def _calculate_confidence_score(self, entries: List[Dict[str, Any]]) -> float:
        """Calculate Guardian confidence score."""
        if not entries:
            return 100.0
        
        safe_operations = sum(
            1 for e in entries
            if e.get("risk_level") in ["low", "medium"]
            and e.get("guardian_action") != "block"
        )
        
        return (safe_operations / len(entries)) * 100
    
    def _generate_summary(self, entries: List[Dict[str, Any]], classifications: Dict[str, Any], confidence: float) -> str:
        """Generate human-readable summary."""
        total = len(entries)
        low_risk = classifications["by_risk"].get("low", 0)
        medium_risk = classifications["by_risk"].get("medium", 0)
        high_risk = classifications["by_risk"].get("high", 0) + classifications["by_risk"].get("critical", 0)
        
        return (
            f"This period, your data was accessed {total} times. "
            f"{low_risk} were low-risk, {medium_risk} were medium-risk, "
            f"and {high_risk} were high-risk. "
            f"Guardian confidence score: {confidence:.1f}%."
        )
    
    def generate_trust_report(self, user_id: str) -> Dict[str, Any]:
        """Generate comprehensive trust report."""
        daily_analysis = self.analyze_daily(user_id)
        weekly_analysis = self.analyze_weekly(user_id)
        
        # Verify ledger integrity
        verification = self.ledger.verify(user_id)
        
        # Get daily hash root
        daily_hash = self.ledger.get_daily_hash_root(user_id)
        
        report = {
            "user_id": user_id,
            "generated_at": datetime.utcnow().isoformat(),
            "daily": daily_analysis,
            "weekly": weekly_analysis,
            "ledger_integrity": verification,
            "daily_hash_root": daily_hash,
        }
        
        # Save report
        report_file = self.reports_dir / f"trust_report_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        logger.info(f"Generated trust report for user {user_id}")
        
        return report
