"""Tests for config module."""

import tempfile
from pathlib import Path

import pytest

from floyo.config import Config


@pytest.fixture
def temp_config_dir():
    """Create temporary config directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


def test_config_initialization(temp_config_dir):
    """Test config initialization."""
    config_path = temp_config_dir / "config.toml"
    config = Config(config_path=config_path)
    
    assert config.config_path == config_path
    assert config.get("monitored_directories") == []


def test_config_get_set(temp_config_dir):
    """Test getting and setting config values."""
    config_path = temp_config_dir / "config.toml"
    config = Config(config_path=config_path)
    
    config.set("monitored_directories", ["/test/dir"])
    assert config.get("monitored_directories") == ["/test/dir"]
    
    # Test nested access
    config.set("tracking.enable_file_watcher", False)
    assert config.get("tracking.enable_file_watcher") is False


def test_config_defaults(temp_config_dir):
    """Test default configuration values."""
    config_path = temp_config_dir / "config.toml"
    config = Config(config_path=config_path)
    
    assert config.get("tracking.max_events") == 1000
    assert config.get("suggestions.max_suggestions") == 5
    assert len(config.get_exclude_patterns()) > 0
