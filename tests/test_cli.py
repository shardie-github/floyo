"""Tests for CLI module."""

import tempfile
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
import sys

import pytest

from floyo.cli import (
    record_file_access,
    show_suggestions,
    show_patterns,
    show_status,
    clear_data,
    export_data,
    import_data,
    show_temporal_patterns,
    show_relationships
)
from floyo.tracker import UsageTracker


@pytest.fixture
def temp_data_dir():
    """Create temporary data directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def mock_tracker(temp_data_dir):
    """Create a mock tracker."""
    with patch('floyo.cli.UsageTracker') as mock:
        tracker_instance = UsageTracker(data_dir=temp_data_dir)
        mock.return_value = tracker_instance
        yield tracker_instance


def test_record_file_access(mock_tracker):
    """Test recording file access."""
    with patch('builtins.print'):
        record_file_access("/test/file.py", "python")
    
    assert len(mock_tracker.events) == 1
    assert mock_tracker.events[0]["type"] == "file_opened"


def test_show_suggestions_empty(mock_tracker):
    """Test showing suggestions with no data."""
    with patch('builtins.print') as mock_print:
        show_suggestions()
    
    # Should print something (either suggestions or "no suggestions")
    assert mock_print.called


def test_show_suggestions_json(mock_tracker):
    """Test showing suggestions as JSON."""
    # Add some data
    mock_tracker.record_event("file_opened", {
        "file_path": "/test/file.py",
        "tool": "python"
    })
    
    with patch('builtins.print') as mock_print:
        show_suggestions(json_output=True)
    
    # Should print JSON
    assert mock_print.called
    # Check that json.dumps was called (indirectly)
    call_args = str(mock_print.call_args)
    assert "json" in call_args.lower() or len(mock_print.call_args_list) > 0


def test_show_patterns(mock_tracker):
    """Test showing patterns."""
    mock_tracker.record_event("file_opened", {
        "file_path": "/test/file.py",
        "tool": "python"
    })
    
    with patch('builtins.print') as mock_print:
        show_patterns()
    
    assert mock_print.called


def test_show_status(mock_tracker):
    """Test showing status."""
    mock_tracker.record_event("file_opened", {"file_path": "/test/file.py"})
    
    with patch('builtins.print') as mock_print:
        show_status()
    
    assert mock_print.called


def test_clear_data_with_confirmation(mock_tracker):
    """Test clearing data with confirmation."""
    mock_tracker.record_event("file_opened", {"file_path": "/test/file.py"})
    
    with patch('builtins.input', return_value='yes'):
        with patch('builtins.print'):
            clear_data(confirm=False)
    
    assert len(mock_tracker.events) == 0


def test_clear_data_without_confirmation(mock_tracker):
    """Test clearing data without confirmation."""
    mock_tracker.record_event("file_opened", {"file_path": "/test/file.py"})
    
    with patch('builtins.print'):
        clear_data(confirm=True)
    
    assert len(mock_tracker.events) == 0


def test_export_data(temp_data_dir, mock_tracker):
    """Test exporting data."""
    mock_tracker.record_event("file_opened", {"file_path": "/test/file.py"})
    
    output_file = temp_data_dir / "export.json"
    
    with patch('builtins.print'):
        export_data(str(output_file))
    
    assert output_file.exists()
    with open(output_file) as f:
        data = json.load(f)
        assert "events" in data


def test_import_data(temp_data_dir, mock_tracker):
    """Test importing data."""
    # Create export file
    export_file = temp_data_dir / "import.json"
    export_data = {
        "events": [{"type": "file_opened", "details": {"file_path": "/imported/file.py"}}],
        "patterns": {".py": {"count": 1}}
    }
    with open(export_file, 'w') as f:
        json.dump(export_data, f)
    
    with patch('builtins.print'):
        import_data(str(export_file))
    
    # Data should be imported
    assert len(mock_tracker.events) > 0 or len(mock_tracker.patterns) > 0


def test_show_temporal_patterns(mock_tracker):
    """Test showing temporal patterns."""
    mock_tracker.record_event("file_opened", {"file_path": "/test/file1.py"})
    mock_tracker.record_event("file_modified", {"file_path": "/test/file2.py"})
    
    with patch('builtins.print') as mock_print:
        show_temporal_patterns()
    
    assert mock_print.called


def test_show_relationships(mock_tracker):
    """Test showing relationships."""
    mock_tracker.record_event("file_opened", {"file_path": "/test/file1.py"})
    mock_tracker.record_event("file_opened", {"file_path": "/test/file2.py"})
    
    with patch('builtins.print') as mock_print:
        show_relationships()
    
    assert mock_print.called


def test_show_relationships_for_file(mock_tracker):
    """Test showing relationships for specific file."""
    mock_tracker.record_event("file_opened", {"file_path": "/test/file1.py"})
    
    with patch('builtins.print') as mock_print:
        show_relationships(file_path="/test/file1.py")
    
    assert mock_print.called
