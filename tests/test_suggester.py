"""Tests for suggester module."""

import tempfile
from pathlib import Path

import pytest

from floyo.tracker import UsageTracker
from floyo.suggester import IntegrationSuggester


@pytest.fixture
def temp_data_dir():
    """Create temporary data directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def tracker(temp_data_dir):
    """Create UsageTracker instance with temp directory."""
    return UsageTracker(data_dir=temp_data_dir)


@pytest.fixture
def suggester(tracker):
    """Create IntegrationSuggester instance."""
    return IntegrationSuggester(tracker)


def test_suggester_initialization(suggester):
    """Test suggester initialization."""
    assert suggester.tracker is not None
    assert ".py" in suggester.tool_integrations


def test_suggest_integrations_empty(tracker, suggester):
    """Test suggestions with no patterns."""
    suggestions = suggester.suggest_integrations()
    # Should return empty list or handle gracefully
    assert isinstance(suggestions, list)


def test_suggest_integrations_with_patterns(tracker, suggester):
    """Test suggestions with patterns."""
    # Record some Python file usage
    tracker.record_event("file_opened", {
        "file_path": "/test/script.py",
        "tool": "python"
    })
    
    suggestions = suggester.suggest_integrations()
    # May or may not have suggestions depending on recent usage
    assert isinstance(suggestions, list)


def test_workflow_pattern_detection(tracker, suggester):
    """Test workflow pattern detection."""
    # Record Python and Word files
    tracker.record_event("file_opened", {"file_path": "/test/script.py"})
    tracker.record_event("file_opened", {"file_path": "/test/doc.docx"})
    
    suggestions = suggester.suggest_integrations()
    assert isinstance(suggestions, list)
