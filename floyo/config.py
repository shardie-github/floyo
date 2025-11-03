"""Configuration management module."""

import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import json
import toml


class Config:
    """Manages floyo configuration."""
    
    DEFAULT_CONFIG = {
        "monitored_directories": [],
        "exclude_patterns": [
            r"\.git/",
            r"__pycache__/",
            r"\.pyc$",
            r"node_modules/",
            r"\.floyo/",
            r"\.venv/",
            r"venv/",
            r"\.env"
        ],
        "tracking": {
            "enable_file_watcher": True,
            "enable_command_tracking": True,
            "enable_temporal_patterns": True,
            "enable_relationship_mapping": True,
            "max_events": 1000,
            "retention_days": 90
        },
        "suggestions": {
            "max_suggestions": 5,
            "min_pattern_confidence": 0.3,
            "use_actual_file_paths": True
        },
        "privacy": {
            "anonymize_paths": False,
            "exclude_sensitive_dirs": []
        },
        "logging": {
            "level": "INFO",
            "file": None,
            "console": True
        }
    }
    
    def __init__(self, config_path: Optional[Path] = None):
        """Initialize configuration.
        
        Args:
            config_path: Path to config file. Defaults to ~/.floyo/config.toml
        """
        if config_path is None:
            config_path = Path.home() / ".floyo" / "config.toml"
        
        self.config_path = config_path
        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
        self.config = self.DEFAULT_CONFIG.copy()
        self._load_config()
    
    def _load_config(self):
        """Load configuration from file."""
        if self.config_path.exists():
            try:
                if self.config_path.suffix == '.toml':
                    with open(self.config_path, 'r') as f:
                        file_config = toml.load(f)
                        self._merge_config(self.config, file_config)
                elif self.config_path.suffix in ['.yaml', '.yml']:
                    import yaml
                    with open(self.config_path, 'r') as f:
                        file_config = yaml.safe_load(f)
                        self._merge_config(self.config, file_config)
                else:
                    with open(self.config_path, 'r') as f:
                        file_config = json.load(f)
                        self._merge_config(self.config, file_config)
            except Exception as e:
                self.logger.warning(f"Error loading config: {e}. Using defaults.")
        else:
            self._save_config()
    
    def _merge_config(self, base: Dict[str, Any], override: Dict[str, Any]):
        """Recursively merge configuration dictionaries.
        
        Args:
            base: Base configuration
            override: Override configuration
        """
        for key, value in override.items():
            if key in base and isinstance(base[key], dict) and isinstance(value, dict):
                self._merge_config(base[key], value)
            else:
                base[key] = value
    
    def _save_config(self):
        """Save configuration to file."""
        try:
            if self.config_path.suffix == '.toml':
                with open(self.config_path, 'w') as f:
                    toml.dump(self.config, f)
            elif self.config_path.suffix in ['.yaml', '.yml']:
                import yaml
                with open(self.config_path, 'w') as f:
                    yaml.dump(self.config, f)
            else:
                with open(self.config_path, 'w') as f:
                    json.dump(self.config, f, indent=2)
        except Exception as e:
            self.logger.error(f"Error saving config: {e}")
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value.
        
        Args:
            key: Configuration key (supports dot notation, e.g., 'tracking.enable_file_watcher')
            default: Default value if key not found
            
        Returns:
            Configuration value
        """
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value: Any):
        """Set configuration value.
        
        Args:
            key: Configuration key (supports dot notation)
            value: Value to set
        """
        keys = key.split('.')
        config = self.config
        
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        config[keys[-1]] = value
        self._save_config()
    
    def get_monitored_directories(self) -> List[str]:
        """Get list of monitored directories.
        
        Returns:
            List of directory paths
        """
        return self.config.get("monitored_directories", [])
    
    def get_exclude_patterns(self) -> List[str]:
        """Get list of exclusion patterns.
        
        Returns:
            List of regex patterns
        """
        return self.config.get("exclude_patterns", [])
