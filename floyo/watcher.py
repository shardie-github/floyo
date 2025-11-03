"""File system watcher for automatic tracking."""

import logging
import re
from pathlib import Path
from typing import List, Optional, Set, Callable, Dict, Any
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent


class FileWatcher(FileSystemEventHandler):
    """Handles file system events for automatic tracking."""
    
    def __init__(self, callback: Callable[[str, Dict[str, Any]], None],
                 exclude_patterns: Optional[List[str]] = None):
        """Initialize the file watcher.
        
        Args:
            callback: Function to call when events occur
            exclude_patterns: List of regex patterns to exclude
        """
        super().__init__()
        self.callback = callback
        self.exclude_patterns = exclude_patterns or []
        self.logger = logging.getLogger(__name__)
    
    def _should_exclude(self, file_path: str) -> bool:
        """Check if a file path should be excluded.
        
        Args:
            file_path: Path to check
            
        Returns:
            True if path should be excluded
        """
        for pattern in self.exclude_patterns:
            if re.search(pattern, file_path):
                return True
        return False
    
    def on_created(self, event: FileSystemEvent):
        """Handle file creation events."""
        if event.is_directory:
            return
        
        file_path = event.src_path
        if self._should_exclude(file_path):
            return
        
        self.callback("file_created", {
            "file_path": str(Path(file_path).resolve()),
            "operation": "create"
        })
    
    def on_modified(self, event: FileSystemEvent):
        """Handle file modification events."""
        if event.is_directory:
            return
        
        file_path = event.src_path
        if self._should_exclude(file_path):
            return
        
        self.callback("file_modified", {
            "file_path": str(Path(file_path).resolve()),
            "operation": "modify"
        })
    
    def on_deleted(self, event: FileSystemEvent):
        """Handle file deletion events."""
        if event.is_directory:
            return
        
        file_path = event.src_path
        if self._should_exclude(file_path):
            return
        
        self.callback("file_deleted", {
            "file_path": str(Path(file_path).resolve()),
            "operation": "delete"
        })
    
    def on_moved(self, event: FileSystemEvent):
        """Handle file move/rename events."""
        if event.is_directory:
            return
        
        file_path = event.dest_path if hasattr(event, 'dest_path') else event.src_path
        if self._should_exclude(file_path):
            return
        
        self.callback("file_moved", {
            "file_path": str(Path(file_path).resolve()),
            "operation": "move",
            "src_path": str(Path(event.src_path).resolve()) if hasattr(event, 'src_path') else None
        })


class FileSystemMonitor:
    """Monitors file system for automatic tracking."""
    
    def __init__(self, tracker, config: Optional[Dict[str, Any]] = None):
        """Initialize the file system monitor.
        
        Args:
            tracker: UsageTracker instance
            config: Configuration dictionary
        """
        self.tracker = tracker
        self.config = config or {}
        self.observer = Observer()
        self.watchers: List[FileWatcher] = []
        self.logger = logging.getLogger(__name__)
        
        # Get monitored directories from config
        monitored_dirs = self.config.get("monitored_directories", [])
        if not monitored_dirs:
            # Default to current working directory and common project dirs
            monitored_dirs = [str(Path.cwd())]
        
        exclude_patterns = self.config.get("exclude_patterns", [
            r"\.git/",
            r"__pycache__/",
            r"\.pyc$",
            r"node_modules/",
            r"\.floyo/"
        ])
        
        # Create watchers for each directory
        for directory in monitored_dirs:
            dir_path = Path(directory)
            if dir_path.exists() and dir_path.is_dir():
                watcher = FileWatcher(
                    self._handle_event,
                    exclude_patterns=exclude_patterns
                )
                self.watchers.append(watcher)
                self.observer.schedule(watcher, str(dir_path), recursive=True)
    
    def _handle_event(self, event_type: str, details: Dict[str, Any]):
        """Handle file system events.
        
        Args:
            event_type: Type of event
            details: Event details
        """
        try:
            self.tracker.record_event(event_type, details)
        except Exception as e:
            self.logger.error(f"Error handling file system event: {e}")
    
    def start(self):
        """Start monitoring."""
        if not self.observer.is_alive():
            self.observer.start()
            self.logger.info("File system monitoring started")
    
    def stop(self):
        """Stop monitoring."""
        if self.observer.is_alive():
            self.observer.stop()
            self.observer.join()
            self.logger.info("File system monitoring stopped")
    
    def is_running(self) -> bool:
        """Check if monitoring is active.
        
        Returns:
            True if monitoring is active
        """
        return self.observer.is_alive()
