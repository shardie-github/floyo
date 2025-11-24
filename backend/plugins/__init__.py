"""
Plugin System
Architecture for extensible plugins and marketplace integration.
"""

from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class PluginMetadata:
    """Plugin metadata."""
    id: str
    name: str
    version: str
    description: str
    author: str
    category: str
    tags: List[str]
    icon_url: Optional[str] = None
    homepage_url: Optional[str] = None
    repository_url: Optional[str] = None


class Plugin(ABC):
    """Base plugin interface."""
    
    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        """Plugin metadata."""
        pass
    
    @abstractmethod
    def initialize(self, config: Dict[str, Any]) -> None:
        """Initialize plugin with configuration."""
        pass
    
    @abstractmethod
    def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute plugin action."""
        pass
    
    def cleanup(self) -> None:
        """Cleanup plugin resources."""
        pass


class PluginManager:
    """Manages plugin lifecycle and execution."""
    
    def __init__(self):
        self._plugins: Dict[str, Plugin] = {}
    
    def register_plugin(self, plugin: Plugin) -> None:
        """Register a plugin."""
        self._plugins[plugin.metadata.id] = plugin
    
    def get_plugin(self, plugin_id: str) -> Optional[Plugin]:
        """Get plugin by ID."""
        return self._plugins.get(plugin_id)
    
    def list_plugins(self, category: Optional[str] = None) -> List[PluginMetadata]:
        """List all plugins, optionally filtered by category."""
        plugins = list(self._plugins.values())
        
        if category:
            plugins = [p for p in plugins if p.metadata.category == category]
        
        return [p.metadata for p in plugins]
    
    def execute_plugin(self, plugin_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a plugin."""
        plugin = self.get_plugin(plugin_id)
        if not plugin:
            raise ValueError(f"Plugin not found: {plugin_id}")
        
        return plugin.execute(context)
