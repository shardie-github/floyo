"""Usage pattern tracking module."""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import hashlib


class UsageTracker:
    """Tracks user activities and usage patterns locally."""
    
    def __init__(self, data_dir: Path = None):
        """Initialize the tracker.
        
        Args:
            data_dir: Directory to store tracking data. Defaults to ~/.floyo
        """
        if data_dir is None:
            data_dir = Path.home() / ".floyo"
        
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.events_file = self.data_dir / "events.json"
        self.patterns_file = self.data_dir / "patterns.json"
        
        self.events: List[Dict[str, Any]] = []
        self.patterns: Dict[str, Any] = {}
        
        self._load_data()
    
    def _load_data(self):
        """Load existing tracking data."""
        if self.events_file.exists():
            try:
                with open(self.events_file, 'r') as f:
                    self.events = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.events = []
        
        if self.patterns_file.exists():
            try:
                with open(self.patterns_file, 'r') as f:
                    self.patterns = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.patterns = {}
    
    def _save_events(self):
        """Save events to disk."""
        with open(self.events_file, 'w') as f:
            json.dump(self.events, f, indent=2)
    
    def _save_patterns(self):
        """Save patterns to disk."""
        with open(self.patterns_file, 'w') as f:
            json.dump(self.patterns, f, indent=2)
    
    def record_event(self, event_type: str, details: Dict[str, Any]):
        """Record a usage event.
        
        Args:
            event_type: Type of event (e.g., 'file_opened', 'script_ran', 'api_called')
            details: Event details (file paths, commands, etc.)
        """
        event = {
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "details": details
        }
        
        self.events.append(event)
        
        # Keep only last 1000 events
        if len(self.events) > 1000:
            self.events = self.events[-1000:]
        
        self._save_events()
        self._analyze_patterns(event)
    
    def _analyze_patterns(self, event: Dict[str, Any]):
        """Analyze events to identify patterns."""
        event_type = event["type"]
        details = event["details"]
        
        # Track file types accessed
        if "file_path" in details:
            file_path = Path(details["file_path"])
            file_ext = file_path.suffix.lower()
            
            if file_ext:
                if file_ext not in self.patterns:
                    self.patterns[file_ext] = {"count": 0, "last_used": None, "tools": set()}
                
                self.patterns[file_ext]["count"] += 1
                self.patterns[file_ext]["last_used"] = event["timestamp"]
                
                # Track associated tools
                if "tool" in details:
                    if isinstance(self.patterns[file_ext]["tools"], set):
                        self.patterns[file_ext]["tools"].add(details["tool"])
                    else:
                        tools_set = set(self.patterns[file_ext]["tools"])
                        tools_set.add(details["tool"])
                        self.patterns[file_ext]["tools"] = tools_set
        
        # Convert sets to lists for JSON serialization
        patterns_to_save = {}
        for key, value in self.patterns.items():
            patterns_to_save[key] = value.copy()
            if isinstance(value.get("tools"), set):
                patterns_to_save[key]["tools"] = list(value["tools"])
        
        self.patterns = patterns_to_save
        self._save_patterns()
    
    def get_recent_events(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent events.
        
        Args:
            limit: Maximum number of events to return
            
        Returns:
            List of recent events
        """
        return self.events[-limit:]
    
    def get_patterns(self) -> Dict[str, Any]:
        """Get identified usage patterns.
        
        Returns:
            Dictionary of usage patterns
        """
        return self.patterns
