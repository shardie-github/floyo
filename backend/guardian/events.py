"""Guardian event types and data models."""

from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID, uuid4
from dataclasses import dataclass, field
import json


class DataScope(str, Enum):
    """Data access scopes."""
    USER = "user"  # User's own data
    APP = "app"  # App internal operations
    API = "api"  # External API calls
    EXTERNAL = "external"  # Third-party services


class DataClass(str, Enum):
    """Data classification categories."""
    TELEMETRY = "telemetry"
    LOCATION = "location"
    AUDIO = "audio"
    VIDEO = "video"
    BIOMETRICS = "biometrics"
    CONTACTS = "contacts"
    CALENDAR = "calendar"
    MESSAGES = "messages"
    FILES = "files"
    BROWSING = "browsing"
    CREDENTIALS = "credentials"
    PAYMENT = "payment"
    HEALTH = "health"
    OTHER = "other"


class RiskLevel(str, Enum):
    """Risk assessment levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ResponseAction(str, Enum):
    """Guardian response actions."""
    ALLOW = "allow"
    MASK = "mask"
    REDACT = "redact"
    BLOCK = "block"
    ALERT = "alert"


@dataclass
class GuardianEvent:
    """Privacy guardian event."""
    
    event_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    
    # Event details
    event_type: str = ""  # e.g., "api_call", "telemetry_send", "data_access"
    scope: DataScope = DataScope.APP
    data_class: DataClass = DataClass.TELEMETRY
    
    # Data description
    description: str = ""
    data_touched: Dict[str, Any] = field(default_factory=dict)
    purpose: str = ""  # Why this data was accessed
    
    # Risk assessment
    risk_level: RiskLevel = RiskLevel.LOW
    risk_score: float = 0.0
    risk_factors: list = field(default_factory=list)
    
    # Guardian action
    guardian_action: ResponseAction = ResponseAction.ALLOW
    action_reason: str = ""
    
    # User context
    user_decision: Optional[str] = None  # "allow", "deny", "pending"
    session_id: Optional[str] = None
    mfa_required: bool = False
    
    # Metadata
    source: str = ""  # Which component/service triggered this
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "user_id": self.user_id,
            "event_type": self.event_type,
            "scope": self.scope.value,
            "data_class": self.data_class.value,
            "description": self.description,
            "data_touched": self.data_touched,
            "purpose": self.purpose,
            "risk_level": self.risk_level.value,
            "risk_score": self.risk_score,
            "risk_factors": self.risk_factors,
            "guardian_action": self.guardian_action.value,
            "action_reason": self.action_reason,
            "user_decision": self.user_decision,
            "session_id": self.session_id,
            "mfa_required": self.mfa_required,
            "source": self.source,
            "metadata": self.metadata,
        }
    
    def to_jsonl(self) -> str:
        """Convert to JSONL format for ledger."""
        return json.dumps(self.to_dict(), default=str)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "GuardianEvent":
        """Create from dictionary."""
        return cls(
            event_id=data.get("event_id", str(uuid4())),
            timestamp=datetime.fromisoformat(data["timestamp"]) if isinstance(data.get("timestamp"), str) else data.get("timestamp", datetime.utcnow()),
            user_id=data.get("user_id"),
            event_type=data.get("event_type", ""),
            scope=DataScope(data.get("scope", "app")),
            data_class=DataClass(data.get("data_class", "telemetry")),
            description=data.get("description", ""),
            data_touched=data.get("data_touched", {}),
            purpose=data.get("purpose", ""),
            risk_level=RiskLevel(data.get("risk_level", "low")),
            risk_score=data.get("risk_score", 0.0),
            risk_factors=data.get("risk_factors", []),
            guardian_action=ResponseAction(data.get("guardian_action", "allow")),
            action_reason=data.get("action_reason", ""),
            user_decision=data.get("user_decision"),
            session_id=data.get("session_id"),
            mfa_required=data.get("mfa_required", False),
            source=data.get("source", ""),
            metadata=data.get("metadata", {}),
        )
