"""Usage pattern tracking module."""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional


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
        self.relationships_file = self.data_dir / "relationships.json"
        self.temporal_patterns_file = self.data_dir / "temporal_patterns.json"
        
        self.events: List[Dict[str, Any]] = []
        self.patterns: Dict[str, Any] = {}
        self.relationships: Dict[str, Any] = {}
        self.temporal_patterns: List[Dict[str, Any]] = []
        
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
        
        if self.relationships_file.exists():
            try:
                with open(self.relationships_file, 'r') as f:
                    self.relationships = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.relationships = {}
        
        if self.temporal_patterns_file.exists():
            try:
                with open(self.temporal_patterns_file, 'r') as f:
                    self.temporal_patterns = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.temporal_patterns = []
    
    def _save_events(self):
        """Save events to disk."""
        try:
            with open(self.events_file, 'w') as f:
                json.dump(self.events, f, indent=2)
        except (IOError, OSError) as e:
            import logging
            logging.getLogger(__name__).error(f"Error saving events: {e}")
    
    def _save_patterns(self):
        """Save patterns to disk."""
        try:
            with open(self.patterns_file, 'w') as f:
                json.dump(self.patterns, f, indent=2)
        except (IOError, OSError) as e:
            import logging
            logging.getLogger(__name__).error(f"Error saving patterns: {e}")
    
    def _save_relationships(self):
        """Save relationships to disk."""
        try:
            with open(self.relationships_file, 'w') as f:
                json.dump(self.relationships, f, indent=2)
        except (IOError, OSError) as e:
            import logging
            logging.getLogger(__name__).error(f"Error saving relationships: {e}")
    
    def _save_temporal_patterns(self):
        """Save temporal patterns to disk."""
        try:
            with open(self.temporal_patterns_file, 'w') as f:
                json.dump(self.temporal_patterns, f, indent=2)
        except (IOError, OSError) as e:
            import logging
            logging.getLogger(__name__).error(f"Error saving temporal patterns: {e}")
    
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
        self._analyze_temporal_patterns(event)
        self._analyze_relationships(event)
    
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
    
    def _analyze_temporal_patterns(self, event: Dict[str, Any]):
        """Analyze temporal patterns in events.
        
        Args:
            event: New event to analyze
        """
        try:
            if len(self.events) < 2:
                return
            
            # Look for sequences in recent events (last 10 events)
            recent_events = self.events[-10:]
            
            # Detect common sequences
            sequences = []
            for i in range(len(recent_events) - 1):
                prev_event = recent_events[i]
                curr_event = recent_events[i + 1]
                
                prev_type = prev_event.get("type")
                curr_type = curr_event.get("type")
                prev_file = prev_event.get("details", {}).get("file_path")
                curr_file = curr_event.get("details", {}).get("file_path")
                
                if prev_type and curr_type:
                    # Calculate time gap
                    prev_time = datetime.fromisoformat(prev_event["timestamp"])
                    curr_time = datetime.fromisoformat(curr_event["timestamp"])
                    time_gap = (curr_time - prev_time).total_seconds()
                    
                    # Only consider sequences within 5 minutes
                    if time_gap < 300:  # 5 minutes
                        sequence_key = f"{prev_type} -> {curr_type}"
                        
                        pattern = {
                            "sequence": sequence_key,
                            "time_gap_seconds": time_gap,
                            "timestamp": curr_event["timestamp"],
                            "files": {
                                "prev": prev_file,
                                "curr": curr_file
                            },
                            "count": 1
                        }
                        
                        # Check if this pattern already exists
                        existing = None
                        for tp in self.temporal_patterns:
                            if tp.get("sequence") == sequence_key:
                                existing = tp
                                break
                        
                        if existing:
                            existing["count"] += 1
                            # Update average time gap
                            avg_gap = existing.get("avg_time_gap", time_gap)
                            existing["avg_time_gap"] = (avg_gap + time_gap) / 2
                        else:
                            pattern["avg_time_gap"] = time_gap
                            self.temporal_patterns.append(pattern)
            
            # Keep only last 100 patterns
            if len(self.temporal_patterns) > 100:
                self.temporal_patterns = self.temporal_patterns[-100:]
            
            self._save_temporal_patterns()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Error analyzing temporal patterns: {e}")
    
    def _analyze_relationships(self, event: Dict[str, Any]):
        """Analyze file relationships.
        
        Args:
            event: New event to analyze
        """
        try:
            event_type = event.get("type")
            details = event.get("details", {})
            
            file_path = details.get("file_path")
            if not file_path:
                return
            
            file_path_obj = Path(file_path)
            
            # Track file relationships based on event type
            if event_type == "command_executed":
                script_path = details.get("script_path")
                output_path = details.get("output_path")
                
                if script_path:
                    # Script -> Output relationship
                    if output_path:
                        self._add_relationship(script_path, output_path, "generates")
                    
                    # Script -> Input relationship (from dependencies)
                    dependencies = details.get("dependencies", [])
                    for dep in dependencies:
                        if isinstance(dep, str) and Path(dep).exists():
                            self._add_relationship(dep, script_path, "consumes")
            
            # Track files accessed together (within short time window)
            if len(self.events) >= 2:
                current_time = datetime.fromisoformat(event["timestamp"])
                # Look at last 5 events
                for prev_event in self.events[-5:-1]:
                    prev_time = datetime.fromisoformat(prev_event["timestamp"])
                    time_diff = (current_time - prev_time).total_seconds()
                    
                    # If accessed within 30 seconds, they might be related
                    if time_diff < 30:
                        prev_file = prev_event.get("details", {}).get("file_path")
                        if prev_file and prev_file != file_path:
                            self._add_relationship(prev_file, file_path, "accessed_together", weight=1)
                
                self._save_relationships()
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Error analyzing relationships: {e}")
    
    def _add_relationship(self, source: str, target: str, relation_type: str, weight: int = 1):
        """Add a relationship between files.
        
        Args:
            source: Source file path
            target: Target file path
            relation_type: Type of relationship
            weight: Relationship weight/strength
        """
        source_key = str(Path(source).resolve())
        target_key = str(Path(target).resolve())
        
        if source_key not in self.relationships:
            self.relationships[source_key] = {}
        
        if target_key not in self.relationships[source_key]:
            self.relationships[source_key][target_key] = {
                "relation_type": relation_type,
                "weight": 0,
                "first_seen": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat()
            }
        
        rel = self.relationships[source_key][target_key]
        rel["weight"] += weight
        rel["last_seen"] = datetime.now().isoformat()
        
        # Also create reverse relationship for some types
        if relation_type in ["accessed_together"]:
            if target_key not in self.relationships:
                self.relationships[target_key] = {}
            if source_key not in self.relationships[target_key]:
                self.relationships[target_key][source_key] = {
                    "relation_type": relation_type,
                    "weight": 0,
                    "first_seen": datetime.now().isoformat(),
                    "last_seen": datetime.now().isoformat()
                }
            rev_rel = self.relationships[target_key][source_key]
            rev_rel["weight"] += weight
            rev_rel["last_seen"] = datetime.now().isoformat()
    
    def get_temporal_patterns(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get temporal patterns.
        
        Args:
            limit: Maximum number of patterns to return
            
        Returns:
            List of temporal patterns sorted by frequency
        """
        sorted_patterns = sorted(
            self.temporal_patterns,
            key=lambda x: x.get("count", 0),
            reverse=True
        )
        return sorted_patterns[:limit]
    
    def get_relationships(self, file_path: Optional[str] = None) -> Dict[str, Any]:
        """Get file relationships.
        
        Args:
            file_path: Optional file path to get relationships for
            
        Returns:
            Dictionary of relationships
        """
        if file_path:
            file_key = str(Path(file_path).resolve())
            return self.relationships.get(file_key, {})
        return self.relationships
    
    def clear_data(self):
        """Clear all tracking data."""
        self.events = []
        self.patterns = {}
        self.relationships = {}
        self.temporal_patterns = []
        self._save_events()
        self._save_patterns()
        self._save_relationships()
        self._save_temporal_patterns()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get tracking statistics.
        
        Returns:
            Dictionary with statistics
        """
        total_events = len(self.events)
        total_patterns = len(self.patterns)
        total_relationships = sum(len(rels) for rels in self.relationships.values())
        total_temporal = len(self.temporal_patterns)
        
        # Count events by type
        event_types: Dict[str, int] = {}
        for event in self.events:
            event_type = event.get("type", "unknown")
            event_types[event_type] = event_types.get(event_type, 0) + 1
        
        return {
            "total_events": total_events,
            "total_patterns": total_patterns,
            "total_relationships": total_relationships,
            "total_temporal_patterns": total_temporal,
            "events_by_type": event_types
        }
