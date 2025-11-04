"""Command-line interface for floyo."""

import argparse
import json
import logging
import signal
import sys
import time
from pathlib import Path
from typing import Optional

from .tracker import UsageTracker
from .suggester import IntegrationSuggester
from .watcher import FileSystemMonitor
from .command_tracker import CommandTracker
from .config import Config


# Global monitor for watch command
_monitor: Optional[FileSystemMonitor] = None


def setup_logging(level: str = "INFO", verbose: bool = False):
    """Setup logging configuration.
    
    Args:
        level: Log level
        verbose: Enable verbose/debug output
    """
    log_level = logging.DEBUG if verbose else getattr(logging, level.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )


def record_file_access(file_path: str, tool: Optional[str] = None):
    """Record a file access event.
    
    Args:
        file_path: Path to file
        tool: Tool used to access the file
    """
    tracker = UsageTracker()
    tracker.record_event("file_opened", {
        "file_path": str(Path(file_path).resolve()),
        "tool": tool or "unknown"
    })
    print(f"? Recorded: {file_path}")


def show_suggestions(json_output: bool = False):
    """Show integration suggestions.
    
    Args:
        json_output: Output as JSON instead of formatted text
    """
    tracker = UsageTracker()
    suggester = IntegrationSuggester(tracker)
    
    suggestions = suggester.suggest_integrations()
    
    if json_output:
        print(json.dumps(suggestions, indent=2))
        return
    
    if not suggestions:
        print("No suggestions available yet. Start using files and scripts to generate suggestions!")
        return
    
    print("\n" + "=" * 70)
    print("FLOYO - Integration Suggestions")
    print("=" * 70 + "\n")
    
    for i, suggestion in enumerate(suggestions, 1):
        print(f"Suggestion #{i}")
        print(f"  Trigger: {suggestion['trigger']}")
        print(f"  Tools: {', '.join(suggestion['tools_involved'])}")
        print(f"  Integration: {suggestion['suggested_integration']}")
        print(f"  Reasoning: {suggestion['reasoning']}")
        if suggestion.get('actual_files'):
            print(f"  Files: {', '.join(suggestion['actual_files'][:3])}")
        print(f"\n  Sample Code:")
        print("  " + "-" * 66)
        for line in suggestion['sample_code'].split('\n'):
            print(f"  {line}")
        print("  " + "-" * 66)
        print()


def show_patterns(json_output: bool = False):
    """Show usage patterns.
    
    Args:
        json_output: Output as JSON instead of formatted text
    """
    tracker = UsageTracker()
    patterns = tracker.get_patterns()
    
    if json_output:
        print(json.dumps(patterns, indent=2))
        return
    
    if not patterns:
        print("No usage patterns detected yet.")
        return
    
    print("\n" + "=" * 70)
    print("FLOYO - Usage Patterns")
    print("=" * 70 + "\n")
    
    for file_ext, pattern_data in sorted(patterns.items(), 
                                         key=lambda x: x[1].get('count', 0), 
                                         reverse=True):
        count = pattern_data.get('count', 0)
        last_used = pattern_data.get('last_used', 'Never')
        tools = pattern_data.get('tools', [])
        
        print(f"{file_ext or '(no extension)'}")
        print(f"  Used {count} time(s)")
        print(f"  Last used: {last_used}")
        if tools:
            print(f"  Tools: {', '.join(tools)}")
        print()


def show_status(json_output: bool = False):
    """Show tracking statistics.
    
    Args:
        json_output: Output as JSON instead of formatted text
    """
    tracker = UsageTracker()
    stats = tracker.get_stats()
    
    if json_output:
        print(json.dumps(stats, indent=2))
        return
    
    print("\n" + "=" * 70)
    print("FLOYO - Tracking Status")
    print("=" * 70 + "\n")
    
    print(f"Total Events: {stats['total_events']}")
    print(f"Total Patterns: {stats['total_patterns']}")
    print(f"Total Relationships: {stats['total_relationships']}")
    print(f"Temporal Patterns: {stats['total_temporal_patterns']}")
    print()
    
    if stats['events_by_type']:
        print("Events by Type:")
        for event_type, count in sorted(stats['events_by_type'].items(), 
                                       key=lambda x: x[1], reverse=True):
            print(f"  {event_type}: {count}")
        print()


def clear_data(confirm: bool = False):
    """Clear all tracking data.
    
    Args:
        confirm: Skip confirmation prompt
    """
    if not confirm:
        response = input("Are you sure you want to clear all tracking data? (yes/no): ")
        if response.lower() not in ['yes', 'y']:
            print("Cancelled.")
            return
    
    tracker = UsageTracker()
    tracker.clear_data()
    print("? All tracking data cleared.")


def start_watching(daemon: bool = False):
    """Start file system monitoring.
    
    Args:
        daemon: Run in background daemon mode
    """
    global _monitor
    
    config = Config()
    tracker = UsageTracker()
    
    # Get monitored directories from config or use current directory
    monitored_dirs = config.get_monitored_directories()
    if not monitored_dirs:
        monitored_dirs = [str(Path.cwd())]
        config.set("monitored_directories", monitored_dirs)
        print(f"Monitoring current directory: {Path.cwd()}")
    else:
        print(f"Monitoring directories: {', '.join(monitored_dirs)}")
    
    _monitor = FileSystemMonitor(tracker, {
        "monitored_directories": monitored_dirs,
        "exclude_patterns": config.get_exclude_patterns()
    })
    
    def signal_handler(sig, frame):
        """Handle shutdown signals."""
        print("\n\nStopping file system monitoring...")
        if _monitor:
            _monitor.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    _monitor.start()
    
    if daemon:
        print("File system monitoring started in background.")
        print("Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            signal_handler(None, None)
    else:
        print("File system monitoring started. Press Ctrl+C to stop.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            signal_handler(None, None)


def export_data(output_file: str):
    """Export tracking data to file.
    
    Args:
        output_file: Path to output file
    """
    tracker = UsageTracker()
    
    data = {
        "events": tracker.events,
        "patterns": tracker.get_patterns(),
        "relationships": tracker.get_relationships(),
        "temporal_patterns": tracker.get_temporal_patterns(limit=100)
    }
    
    output_path = Path(output_file)
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"? Data exported to {output_file}")


def import_data(input_file: str):
    """Import tracking data from file.
    
    Args:
        input_file: Path to input file
    """
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"Error: File {input_file} does not exist.")
        sys.exit(1)
    
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    tracker = UsageTracker()
    
    # Merge imported data
    if "events" in data:
        tracker.events.extend(data["events"])
        tracker._save_events()
    
    if "patterns" in data:
        existing_patterns = tracker.get_patterns()
        for key, value in data["patterns"].items():
            existing_patterns[key] = value
        tracker.patterns = existing_patterns
        tracker._save_patterns()
    
    # Note: Relationships and temporal patterns would need more sophisticated merging
    print(f"? Data imported from {input_file}")


def show_temporal_patterns(json_output: bool = False, limit: int = 20):
    """Show temporal patterns.
    
    Args:
        json_output: Output as JSON instead of formatted text
        limit: Maximum number of patterns to show
    """
    tracker = UsageTracker()
    patterns = tracker.get_temporal_patterns(limit=limit)
    
    if json_output:
        print(json.dumps(patterns, indent=2))
        return
    
    if not patterns:
        print("No temporal patterns detected yet.")
        return
    
    print("\n" + "=" * 70)
    print("FLOYO - Temporal Patterns")
    print("=" * 70 + "\n")
    
    for pattern in patterns:
        print(f"Sequence: {pattern['sequence']}")
        print(f"  Frequency: {pattern['count']} time(s)")
        print(f"  Avg Time Gap: {pattern.get('avg_time_gap', 0):.2f} seconds")
        if pattern.get('files'):
            print(f"  Files: {pattern['files']}")
        print()


def show_relationships(file_path: Optional[str] = None, json_output: bool = False):
    """Show file relationships.
    
    Args:
        file_path: Optional file path to show relationships for
        json_output: Output as JSON instead of formatted text
    """
    tracker = UsageTracker()
    relationships = tracker.get_relationships(file_path)
    
    if json_output:
        print(json.dumps(relationships, indent=2))
        return
    
    if not relationships:
        print("No relationships detected yet." if not file_path else f"No relationships found for {file_path}.")
        return
    
    print("\n" + "=" * 70)
    if file_path:
        print(f"FLOYO - Relationships for {file_path}")
    else:
        print("FLOYO - File Relationships")
    print("=" * 70 + "\n")
    
    for source, targets in relationships.items():
        print(f"{source}:")
        for target, rel_data in targets.items():
            print(f"  -> {target}")
            print(f"     Type: {rel_data['relation_type']}")
            print(f"     Weight: {rel_data['weight']}")
        print()


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="floyo - Local system app for suggesting API integrations",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument('-v', '--verbose', action='store_true',
                       help='Enable verbose/debug output')
    parser.add_argument('--json', action='store_true',
                       help='Output as JSON (for scripting)')
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Record command
    record_parser = subparsers.add_parser('record', help='Record a file access')
    record_parser.add_argument('file', help='File path to record')
    record_parser.add_argument('--tool', help='Tool used to access the file')
    
    # Suggest command
    suggest_parser = subparsers.add_parser('suggest', help='Show integration suggestions')
    
    # Patterns command
    patterns_parser = subparsers.add_parser('patterns', help='Show usage patterns')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show tracking statistics')
    
    # Clear command
    clear_parser = subparsers.add_parser('clear', help='Clear all tracking data')
    clear_parser.add_argument('-y', '--yes', action='store_true',
                             help='Skip confirmation prompt')
    
    # Watch command
    watch_parser = subparsers.add_parser('watch', help='Start file system monitoring')
    watch_parser.add_argument('-d', '--daemon', action='store_true',
                             help='Run in background daemon mode')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export tracking data')
    export_parser.add_argument('output', help='Output file path')
    
    # Import command
    import_parser = subparsers.add_parser('import', help='Import tracking data')
    import_parser.add_argument('input', help='Input file path')
    
    # Temporal patterns command
    temporal_parser = subparsers.add_parser('temporal', help='Show temporal patterns')
    temporal_parser.add_argument('-l', '--limit', type=int, default=20,
                                help='Maximum number of patterns to show')
    
    # Relationships command
    rel_parser = subparsers.add_parser('relationships', help='Show file relationships')
    rel_parser.add_argument('file', nargs='?', help='Optional file path to show relationships for')
    
    args = parser.parse_args()
    
    # Setup logging
    setup_logging(verbose=args.verbose)
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    json_output = args.json
    
    if args.command == 'record':
        record_file_access(args.file, args.tool)
    elif args.command == 'suggest':
        show_suggestions(json_output=json_output)
    elif args.command == 'patterns':
        show_patterns(json_output=json_output)
    elif args.command == 'status':
        show_status(json_output=json_output)
    elif args.command == 'clear':
        clear_data(confirm=args.yes)
    elif args.command == 'watch':
        start_watching(daemon=args.daemon)
    elif args.command == 'export':
        export_data(args.output)
    elif args.command == 'import':
        import_data(args.input)
    elif args.command == 'temporal':
        show_temporal_patterns(json_output=json_output, limit=args.limit)
    elif args.command == 'relationships':
        show_relationships(file_path=args.file, json_output=json_output)


if __name__ == '__main__':
    main()
