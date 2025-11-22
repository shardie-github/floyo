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


def test_suggest_integrations_recent_usage(tracker, suggester):
    """Test suggestions prioritize recently used files."""
    from datetime import datetime, timedelta
    
    # Record recent Python file usage
    tracker.record_event("file_opened", {
        "file_path": "/test/recent.py",
        "tool": "python"
    })
    
    suggestions = suggester.suggest_integrations()
    assert isinstance(suggestions, list)
    # May include Python-related suggestions


def test_generate_sample_code(suggester):
    """Test sample code generation."""
    code = suggester._generate_sample_code(".py", "Dropbox API - auto-sync output files", ["/test/file.py"])
    assert isinstance(code, str)
    assert len(code) > 0
    assert "dropbox" in code.lower() or "Dropbox" in code


def test_generate_workflow_code(suggester):
    """Test workflow code generation."""
    code = suggester._generate_workflow_code("python_word")
    assert isinstance(code, str)
    assert len(code) > 0
    assert "python" in code.lower()


def test_generate_reasoning(suggester, tracker):
    """Test reasoning generation."""
    tracker.record_event("file_opened", {
        "file_path": "/test/file.py",
        "tool": "python"
    })
    
    patterns = tracker.get_patterns()
    recent_events = tracker.get_recent_events(10)
    
    reasoning = suggester._generate_reasoning(".py", patterns.get(".py", {}), recent_events)
    assert isinstance(reasoning, str)
    assert len(reasoning) > 0


def test_suggestions_limit(suggester, tracker):
    """Test that suggestions are limited to max."""
    # Record multiple file types
    for ext in [".py", ".sh", ".js", ".sql", ".csv", ".json", ".md"]:
        tracker.record_event("file_opened", {"file_path": f"/test/file{ext}"})
    
    suggestions = suggester.suggest_integrations()
    # Should return at most 5 suggestions
    assert len(suggestions) <= 5
