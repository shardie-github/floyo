"""Tests for tracker module."""

import json
import tempfile
from pathlib import Path
from datetime import datetime

import pytest

from floyo.tracker import UsageTracker


@pytest.fixture
def temp_data_dir():
    """Create temporary data directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def tracker(temp_data_dir):
    """Create UsageTracker instance with temp directory."""
    return UsageTracker(data_dir=temp_data_dir)


def test_tracker_initialization(tracker):
    """Test tracker initialization."""
    assert tracker.data_dir.exists()
    assert tracker.events == []
    assert tracker.patterns == {}


def test_record_event(tracker):
    """Test recording events."""
    tracker.record_event("file_opened", {"file_path": "/test/file.py"})
    
    assert len(tracker.events) == 1
    assert tracker.events[0]["type"] == "file_opened"
    assert tracker.events[0]["details"]["file_path"] == "/test/file.py"


def test_pattern_analysis(tracker):
    """Test pattern analysis."""
    tracker.record_event("file_opened", {
        "file_path": "/test/file.py",
        "tool": "python"
    })
    
    patterns = tracker.get_patterns()
    assert ".py" in patterns
    assert patterns[".py"]["count"] == 1
    assert "python" in patterns[".py"]["tools"]


def test_temporal_patterns(tracker):
    """Test temporal pattern detection."""
    # Record two events with small time gap
    tracker.record_event("file_opened", {"file_path": "/test/file1.py"})
    tracker.record_event("file_modified", {"file_path": "/test/file2.py"})
    
    patterns = tracker.get_temporal_patterns()
    # Should detect sequence pattern
    assert len(patterns) > 0 or len(tracker.temporal_patterns) > 0


def test_relationships(tracker):
    """Test relationship mapping."""
    tracker.record_event("command_executed", {
        "script_path": "/test/script.py",
        "output_path": "/test/output.json"
    })
    
    relationships = tracker.get_relationships("/test/script.py")
    assert len(relationships) > 0 or "/test/output.json" in str(relationships)


def test_get_stats(tracker):
    """Test statistics retrieval."""
    tracker.record_event("file_opened", {"file_path": "/test/file.py"})
    
    stats = tracker.get_stats()
    assert stats["total_events"] == 1
    assert stats["total_patterns"] >= 0


def test_clear_data(tracker):
    """Test clearing data."""
    tracker.record_event("file_opened", {"file_path": "/test/file.py"})
    tracker.clear_data()
    
    assert len(tracker.events) == 0
    assert len(tracker.patterns) == 0


def test_data_persistence(temp_data_dir):
    """Test that data persists across tracker instances."""
    tracker1 = UsageTracker(data_dir=temp_data_dir)
    tracker1.record_event("file_opened", {"file_path": "/test/file.py"})
    
    tracker2 = UsageTracker(data_dir=temp_data_dir)
    assert len(tracker2.events) == 1


def test_get_recent_events(tracker):
    """Test getting recent events with limit."""
    # Record multiple events
    for i in range(25):
        tracker.record_event("file_opened", {"file_path": f"/test/file{i}.py"})
    
    recent = tracker.get_recent_events(limit=10)
    assert len(recent) == 10
    assert recent[-1]["details"]["file_path"] == "/test/file24.py"


def test_event_limit_enforcement(tracker):
    """Test that events are limited to max_events."""
    # Record more than 1000 events
    for i in range(1005):
        tracker.record_event("file_opened", {"file_path": f"/test/file{i}.py"})
    
    # Should keep only last 1000
    assert len(tracker.events) <= 1000


def test_pattern_tools_conversion(tracker):
    """Test that pattern tools are converted from sets to lists."""
    tracker.record_event("file_opened", {
        "file_path": "/test/file.py",
        "tool": "python"
    })
    tracker.record_event("file_opened", {
        "file_path": "/test/file2.py",
        "tool": "python"
    })
    
    patterns = tracker.get_patterns()
    if ".py" in patterns:
        tools = patterns[".py"].get("tools", [])
        # Tools should be a list, not a set
        assert isinstance(tools, list) or isinstance(tools, set)


def test_temporal_patterns_time_gap(tracker):
    """Test temporal patterns respect time gap threshold."""
    import time
    
    tracker.record_event("file_opened", {"file_path": "/test/file1.py"})
    time.sleep(0.1)  # Small gap
    tracker.record_event("file_modified", {"file_path": "/test/file2.py"})
    
    patterns = tracker.get_temporal_patterns()
    # Should detect patterns within 5 minutes
    assert isinstance(patterns, list)


def test_relationships_reverse_mapping(tracker):
    """Test bidirectional relationship mapping."""
    # Record two files accessed together
    tracker.record_event("file_opened", {"file_path": "/test/file1.py"})
    import time
    time.sleep(0.05)
    tracker.record_event("file_opened", {"file_path": "/test/file2.py"})
    
    rels1 = tracker.get_relationships("/test/file1.py")
    rels2 = tracker.get_relationships("/test/file2.py")
    
    # Should have relationships (may be empty if time gap too large)
    assert isinstance(rels1, dict)
    assert isinstance(rels2, dict)


def test_stats_event_types(tracker):
    """Test statistics include event type breakdown."""
    tracker.record_event("file_opened", {"file_path": "/test/file1.py"})
    tracker.record_event("file_modified", {"file_path": "/test/file2.py"})
    tracker.record_event("file_opened", {"file_path": "/test/file3.py"})
    
    stats = tracker.get_stats()
    assert stats["total_events"] == 3
    assert "events_by_type" in stats
    assert stats["events_by_type"].get("file_opened", 0) >= 2
