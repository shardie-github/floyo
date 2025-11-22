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


def test_config_nested_access(temp_config_dir):
    """Test nested configuration access."""
    config_path = temp_config_dir / "config.toml"
    config = Config(config_path=config_path)
    
    # Test getting nested value
    value = config.get("tracking.enable_file_watcher")
    assert value is True  # Default value
    
    # Test setting nested value
    config.set("tracking.enable_file_watcher", False)
    assert config.get("tracking.enable_file_watcher") is False


def test_config_get_with_default(temp_config_dir):
    """Test getting config value with default."""
    config_path = temp_config_dir / "config.toml"
    config = Config(config_path=config_path)
    
    # Get non-existent key with default
    value = config.get("nonexistent.key", "default_value")
    assert value == "default_value"


def test_config_persistence(temp_config_dir):
    """Test that config persists across instances."""
    config_path = temp_config_dir / "config.toml"
    
    config1 = Config(config_path=config_path)
    config1.set("test_key", "test_value")
    
    config2 = Config(config_path=config_path)
    assert config2.get("test_key") == "test_value"


def test_get_monitored_directories(temp_config_dir):
    """Test getting monitored directories."""
    config_path = temp_config_dir / "config.toml"
    config = Config(config_path=config_path)
    
    directories = config.get_monitored_directories()
    assert isinstance(directories, list)
    
    config.set("monitored_directories", ["/path1", "/path2"])
    assert config.get_monitored_directories() == ["/path1", "/path2"]


def test_get_exclude_patterns(temp_config_dir):
    """Test getting exclude patterns."""
    config_path = temp_config_dir / "config.toml"
    config = Config(config_path=config_path)
    
    patterns = config.get_exclude_patterns()
    assert isinstance(patterns, list)
    assert len(patterns) > 0
    # Should include common patterns
    assert any(".git" in p for p in patterns)
