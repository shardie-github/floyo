"""Export functionality for patterns and data."""

import csv
import json
from typing import List, Dict, Any
from io import StringIO
from database.models import Pattern, Event, Suggestion


def export_patterns_csv(patterns: List[Pattern]) -> str:
    """Export patterns to CSV format."""
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "File Extension", "Count", "Last Used", "Tools", "Created At"
    ])
    
    # Write data
    for pattern in patterns:
        tools_str = ", ".join(pattern.tools) if pattern.tools else ""
        writer.writerow([
            pattern.file_extension or "",
            pattern.count,
            pattern.last_used.isoformat() if pattern.last_used else "",
            tools_str,
            pattern.created_at.isoformat() if pattern.created_at else ""
        ])
    
    return output.getvalue()


def export_patterns_json(patterns: List[Pattern]) -> str:
    """Export patterns to JSON format."""
    data = [
        {
            "id": str(pattern.id),
            "file_extension": pattern.file_extension,
            "count": pattern.count,
            "last_used": pattern.last_used.isoformat() if pattern.last_used else None,
            "tools": pattern.tools,
            "created_at": pattern.created_at.isoformat() if pattern.created_at else None,
        }
        for pattern in patterns
    ]
    return json.dumps(data, indent=2)


def export_events_csv(events: List[Event]) -> str:
    """Export events to CSV format."""
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "Event Type", "File Path", "Tool", "Operation", "Timestamp", "Details"
    ])
    
    # Write data
    for event in events:
        details_str = json.dumps(event.details) if event.details else ""
        writer.writerow([
            event.event_type,
            event.file_path or "",
            event.tool or "",
            event.operation or "",
            event.timestamp.isoformat() if event.timestamp else "",
            details_str
        ])
    
    return output.getvalue()


def export_events_json(events: List[Event]) -> str:
    """Export events to JSON format."""
    data = [
        {
            "id": str(event.id),
            "event_type": event.event_type,
            "file_path": event.file_path,
            "tool": event.tool,
            "operation": event.operation,
            "timestamp": event.timestamp.isoformat() if event.timestamp else None,
            "details": event.details,
        }
        for event in events
    ]
    return json.dumps(data, indent=2)
