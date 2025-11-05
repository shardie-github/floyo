"""Guardian GPT - Local explainer for privacy events."""

import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime
from .ledger import TrustLedger
from .inspector import GuardianInspector
import logging

logger = logging.getLogger(__name__)


class GuardianGPT:
    """Local LLM wrapper for explaining Guardian events."""
    
    def __init__(self, ledger: TrustLedger = None):
        """Initialize Guardian GPT."""
        self.ledger = ledger or TrustLedger()
        self.inspector = GuardianInspector(ledger)
    
    def explain_event(self, event_id: str, user_id: str) -> str:
        """Explain a specific event in plain language."""
        entries = self.ledger.get_user_ledger(user_id)
        
        # Find the event
        event = None
        for entry in entries:
            if entry.get("event_id") == event_id:
                event = entry
                break
        
        if not event:
            return "Event not found."
        
        # Generate explanation
        explanation = self._generate_explanation(event)
        return explanation
    
    def explain_what_data_was_used(self, user_id: str, days: int = 7) -> str:
        """Explain what data was used recently."""
        entries = self.ledger.get_user_ledger(user_id)
        
        # Filter by date
        cutoff = datetime.utcnow().timestamp() - (days * 24 * 60 * 60)
        recent = [
            e for e in entries
            if datetime.fromisoformat(e["timestamp"]).timestamp() > cutoff
        ]
        
        if not recent:
            return f"No data access events in the last {days} days."
        
        # Group by data class
        data_classes = {}
        for entry in recent:
            dc = entry.get("data_class", "unknown")
            if dc not in data_classes:
                data_classes[dc] = []
            data_classes[dc].append(entry)
        
        # Generate summary
        summary_parts = [f"In the last {days} days, your data was accessed {len(recent)} times:\n"]
        
        for data_class, events in data_classes.items():
            summary_parts.append(f"\n• {data_class.replace('_', ' ').title()}: {len(events)} times")
            
            # Get purposes
            purposes = set()
            for e in events:
                if e.get("purpose"):
                    purposes.add(e["purpose"])
            
            if purposes:
                summary_parts.append(f"  Used for: {', '.join(list(purposes)[:3])}")
        
        return "\n".join(summary_parts)
    
    def explain_rules_applied(self, user_id: str) -> str:
        """Explain what rules Guardian applied."""
        entries = self.ledger.get_user_ledger(user_id)
        
        if not entries:
            return "No rules have been applied yet."
        
        # Count actions
        actions = {}
        for entry in entries:
            action = entry.get("guardian_action", "allow")
            actions[action] = actions.get(action, 0) + 1
        
        # Generate explanation
        explanation = ["Guardian applied these rules:\n"]
        
        for action, count in actions.items():
            percentage = (count / len(entries)) * 100
            
            action_desc = {
                "allow": "Allowed access",
                "mask": "Masked sensitive data",
                "redact": "Redacted data before transmission",
                "block": "Blocked access",
                "alert": "Alerted you",
            }.get(action, action)
            
            explanation.append(f"• {action_desc}: {count} times ({percentage:.1f}%)")
        
        return "\n".join(explanation)
    
    def explain_if_disabled(self, user_id: str) -> str:
        """Explain what would happen if monitoring is disabled."""
        entries = self.ledger.get_user_ledger(user_id)
        
        if not entries:
            return "No monitoring data available."
        
        # Count blocked events
        blocked = sum(1 for e in entries if e.get("guardian_action") == "block")
        masked = sum(1 for e in entries if e.get("guardian_action") == "mask")
        redacted = sum(1 for e in entries if e.get("guardian_action") == "redact")
        
        protection_count = blocked + masked + redacted
        
        explanation = [
            "If you disable Guardian monitoring:\n",
            f"• {blocked} blocked access attempts would have been allowed",
            f"• {masked} data masking operations would not have occurred",
            f"• {redacted} data redactions would not have happened",
            f"\nTotal: {protection_count} privacy protections would not have been applied.",
            "\nYour data would be accessed without these safeguards.",
        ]
        
        return "\n".join(explanation)
    
    def answer_question(self, question: str, user_id: str) -> str:
        """Answer a natural language question about Guardian."""
        question_lower = question.lower()
        
        if "what data" in question_lower or "which data" in question_lower:
            return self.explain_what_data_was_used(user_id)
        
        if "rules" in question_lower or "policies" in question_lower:
            return self.explain_rules_applied(user_id)
        
        if "disable" in question_lower or "turn off" in question_lower:
            return self.explain_if_disabled(user_id)
        
        if "why" in question_lower:
            # Try to explain recent high-risk events
            entries = self.ledger.get_user_ledger(user_id)
            high_risk = [
                e for e in entries[:50]
                if e.get("risk_level") in ["high", "critical"]
            ]
            
            if high_risk:
                return f"Recent high-risk events:\n" + "\n".join([
                    f"• {e.get('description', 'Unknown')}: {e.get('action_reason', 'No reason')}"
                    for e in high_risk[:5]
                ])
            else:
                return "No recent high-risk events detected."
        
        # Default response
        return (
            "I can answer questions about:\n"
            "• What data was used\n"
            "• What rules were applied\n"
            "• What happens if monitoring is disabled\n"
            "• Why certain actions were taken\n"
            "\nTry asking: 'What data was used this week?' or 'What rules were applied?'"
        )
    
    def _generate_explanation(self, event: Dict[str, Any]) -> str:
        """Generate human-readable explanation for an event."""
        parts = []
        
        # What happened
        description = event.get("description", "Unknown event")
        parts.append(f"What happened: {description}")
        
        # Why
        purpose = event.get("purpose")
        if purpose:
            parts.append(f"Why: {purpose}")
        
        # Data class
        data_class = event.get("data_class", "unknown")
        parts.append(f"Data type: {data_class.replace('_', ' ').title()}")
        
        # Risk
        risk_level = event.get("risk_level", "unknown")
        risk_score = event.get("risk_score", 0.0)
        parts.append(f"Risk level: {risk_level} ({risk_score:.0%})")
        
        # Action
        action = event.get("guardian_action", "allow")
        action_reason = event.get("action_reason", "")
        
        action_desc = {
            "allow": "Allowed",
            "mask": "Masked sensitive data",
            "redact": "Redacted data",
            "block": "Blocked",
            "alert": "Alerted",
        }.get(action, action)
        
        parts.append(f"Guardian action: {action_desc}")
        if action_reason:
            parts.append(f"Reason: {action_reason}")
        
        # Data scope
        scope = event.get("scope", "unknown")
        scope_desc = {
            "user": "your own data",
            "app": "app internal operations",
            "api": "external API calls",
            "external": "third-party services",
        }.get(scope, scope)
        
        parts.append(f"Scope: {scope_desc}")
        
        # Friendly summary
        summary = self._generate_friendly_summary(event)
        if summary:
            parts.append(f"\nSummary: {summary}")
        
        return "\n".join(parts)
    
    def _generate_friendly_summary(self, event: Dict[str, Any]) -> str:
        """Generate friendly summary."""
        action = event.get("guardian_action", "allow")
        data_class = event.get("data_class", "telemetry")
        purpose = event.get("purpose", "")
        
        if action == "allow":
            return f"Your {data_class.replace('_', ' ')} was used for {purpose or 'normal operation'}. No data left your device."
        elif action == "mask":
            return f"Sensitive {data_class.replace('_', ' ')} was masked before being used. Original data was not exposed."
        elif action == "block":
            return f"Access to {data_class.replace('_', ' ')} was blocked to protect your privacy."
        elif action == "redact":
            return f"Sensitive fields were removed from {data_class.replace('_', ' ')} before transmission."
        else:
            return f"Guardian monitored {data_class.replace('_', ' ')} access."
