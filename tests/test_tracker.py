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
