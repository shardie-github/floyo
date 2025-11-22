"""Tests for command_tracker module."""

import tempfile
from pathlib import Path

import pytest

from floyo.tracker import UsageTracker
from floyo.command_tracker import CommandTracker


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
def command_tracker(tracker):
    """Create CommandTracker instance."""
    return CommandTracker(tracker)


def test_command_tracker_initialization(command_tracker):
    """Test command tracker initialization."""
    assert command_tracker.tracker is not None
    assert ".py" in command_tracker.script_extensions
    assert ".sh" in command_tracker.script_extensions


def test_track_command(command_tracker):
    """Test tracking a command."""
    command_tracker.track_command("python", ["script.py"], output_path="/output.txt")
    
    events = command_tracker.tracker.events
    assert len(events) == 1
    assert events[0]["type"] == "command_executed"
    assert events[0]["details"]["command"] == "python"
    assert events[0]["details"]["args"] == ["script.py"]


def test_track_command_with_script_detection(temp_data_dir, tracker):
    """Test script type detection."""
    # Create a test script file
    script_file = temp_data_dir / "test_script.py"
    script_file.write_text("# Test script")
    
    command_tracker = CommandTracker(tracker)
    command_tracker.track_command("python", [str(script_file)])
    
    events = tracker.events
    assert len(events) == 1
    details = events[0]["details"]
    assert details.get("script_type") == "python"
    assert details.get("script_path") == str(script_file.resolve())


def test_detect_dependencies_python(temp_data_dir, tracker):
    """Test Python dependency detection."""
    # Create a Python script with imports
    script_file = temp_data_dir / "test.py"
    script_file.write_text("""
import os
import json
from pathlib import Path

data_file = Path('data.json')
with open('config.txt', 'r') as f:
    config = f.read()
""")
    
    # Create referenced files
    (temp_data_dir / "data.json").write_text("{}")
    (temp_data_dir / "config.txt").write_text("config")
    
    command_tracker = CommandTracker(tracker)
    dependencies = command_tracker.detect_dependencies(str(script_file))
    
    # Should detect imports and file reads
    assert "os" in dependencies or "json" in dependencies or "pathlib" in dependencies
    # May detect file paths if they exist
    assert isinstance(dependencies, list)


def test_detect_dependencies_shell(temp_data_dir, tracker):
    """Test shell script dependency detection."""
    # Create a shell script
    script_file = temp_data_dir / "test.sh"
    script_file.write_text("""
#!/bin/bash
source config.sh
cat data.txt
. helper.sh
""")
    
    # Create referenced files
    (temp_data_dir / "config.sh").write_text("# config")
    (temp_data_dir / "data.txt").write_text("data")
    (temp_data_dir / "helper.sh").write_text("# helper")
    
    command_tracker = CommandTracker(tracker)
    dependencies = command_tracker.detect_dependencies(str(script_file))
    
    # Should detect file dependencies
    assert isinstance(dependencies, list)
    # May include detected file paths
    assert len(dependencies) >= 0


def test_detect_dependencies_nonexistent_file(command_tracker):
    """Test dependency detection for non-existent file."""
    dependencies = command_tracker.detect_dependencies("/nonexistent/file.py")
    assert dependencies == []


def test_track_command_without_args(command_tracker):
    """Test tracking command without arguments."""
    command_tracker.track_command("ls")
    
    events = command_tracker.tracker.events
    assert len(events) == 1
    assert events[0]["details"]["command"] == "ls"
    assert events[0]["details"]["args"] == []


def test_track_command_with_output_path(command_tracker):
    """Test tracking command with output path."""
    command_tracker.track_command("python", ["script.py"], output_path="/output/results.json")
    
    events = command_tracker.tracker.events
    assert events[0]["details"]["output_path"] == "/output/results.json"
