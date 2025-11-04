"""Tests for watcher module."""

import tempfile
from pathlib import Path
from unittest.mock import Mock

import pytest

from floyo.tracker import UsageTracker
from floyo.watcher import FileSystemMonitor, FileWatcher


@pytest.fixture
def temp_data_dir():
    """Create temporary data directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def tracker(temp_data_dir):
    """Create UsageTracker instance with temp directory."""
    return UsageTracker(data_dir=temp_data_dir)


def test_file_watcher_initialization():
    """Test FileWatcher initialization."""
    callback = Mock()
    watcher = FileWatcher(callback, exclude_patterns=[r"\.git/"])
    
    assert watcher.callback == callback
    assert len(watcher.exclude_patterns) == 1


def test_file_system_monitor_initialization(tracker):
    """Test FileSystemMonitor initialization."""
    monitor = FileSystemMonitor(tracker, {
        "monitored_directories": [str(Path.cwd())],
        "exclude_patterns": []
    })
    
    assert monitor.tracker == tracker
    assert not monitor.is_running()


def test_file_system_monitor_start_stop(tracker):
    """Test starting and stopping monitoring."""
    monitor = FileSystemMonitor(tracker, {
        "monitored_directories": [str(Path.cwd())],
        "exclude_patterns": []
    })
    
    monitor.start()
    assert monitor.is_running()
    
    monitor.stop()
    # Give it a moment to stop
    import time
    time.sleep(0.1)
    assert not monitor.is_running()
