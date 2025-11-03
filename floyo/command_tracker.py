"""Command execution tracking module."""

import logging
import subprocess
import shlex
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime


class CommandTracker:
    """Tracks command executions and script runs."""
    
    def __init__(self, tracker):
        """Initialize command tracker.
        
        Args:
            tracker: UsageTracker instance
        """
        self.tracker = tracker
        self.logger = logging.getLogger(__name__)
        
        # Known script extensions and interpreters
        self.script_extensions = {
            '.py': 'python',
            '.sh': 'bash',
            '.bash': 'bash',
            '.zsh': 'zsh',
            '.js': 'node',
            '.rb': 'ruby',
            '.pl': 'perl',
            '.ps1': 'powershell',
            '.vba': 'vba',
            '.sql': 'sql'
        }
    
    def track_command(self, command: str, args: Optional[List[str]] = None, 
                     output_path: Optional[str] = None):
        """Track a command execution.
        
        Args:
            command: Command that was executed
            args: Command arguments
            output_path: Path to output file if any
        """
        details = {
            "command": command,
            "args": args or [],
            "output_path": output_path
        }
        
        # Detect script type
        if args and len(args) > 0:
            first_arg = args[0]
            script_path = Path(first_arg)
            if script_path.exists():
                ext = script_path.suffix.lower()
                if ext in self.script_extensions:
                    details["script_type"] = self.script_extensions[ext]
                    details["script_path"] = str(script_path.resolve())
                    details["interpreter"] = command
        
        self.tracker.record_event("command_executed", details)
    
    def detect_dependencies(self, script_path: str) -> List[str]:
        """Detect dependencies for a script.
        
        Args:
            script_path: Path to script file
            
        Returns:
            List of detected dependencies
        """
        dependencies = []
        script_path_obj = Path(script_path)
        
        if not script_path_obj.exists():
            return dependencies
        
        ext = script_path_obj.suffix.lower()
        
        try:
            with open(script_path_obj, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            if ext == '.py':
                # Detect Python imports
                import re
                import_pattern = r'^(?:from\s+(\S+)|import\s+(\S+))'
                for line in content.split('\n'):
                    match = re.search(import_pattern, line.strip())
                    if match:
                        module = match.group(1) or match.group(2)
                        if module:
                            dependencies.append(module.split('.')[0])
                
                # Detect file reads
                read_patterns = [
                    r'open\(["\']([^"\']+)["\']',
                    r'Path\(["\']([^"\']+)["\']',
                    r'pd\.read_([a-z]+)\(["\']([^"\']+)["\']'
                ]
                for pattern in read_patterns:
                    for match in re.finditer(pattern, content):
                        file_path = match.group(1) if len(match.groups()) >= 1 else None
                        if file_path:
                            full_path = (script_path_obj.parent / file_path).resolve()
                            if full_path.exists():
                                dependencies.append(str(full_path))
            
            elif ext in ['.sh', '.bash', '.zsh']:
                # Detect shell script dependencies
                import re
                # Look for file operations
                file_patterns = [
                    r'(?:cat|less|more|head|tail)\s+([^\s]+)',
                    r'read\s+<[>\s]+([^\s]+)',
                    r'source\s+([^\s]+)',
                    r'\.\s+([^\s]+)'
                ]
                for pattern in file_patterns:
                    for match in re.finditer(pattern, content):
                        if match.group(1):
                            dep_path = Path(match.group(1))
                            if not dep_path.is_absolute():
                                dep_path = script_path_obj.parent / dep_path
                            if dep_path.exists():
                                dependencies.append(str(dep_path.resolve()))
        
        except Exception as e:
            self.logger.warning(f"Error detecting dependencies for {script_path}: {e}")
        
        return dependencies
