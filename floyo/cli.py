"""Command-line interface for floyo."""

import argparse
import sys
from pathlib import Path
from typing import Optional

from .tracker import UsageTracker
from .suggester import IntegrationSuggester


def record_file_access(file_path: str, tool: Optional[str] = None):
    """Record a file access event."""
    tracker = UsageTracker()
    tracker.record_event("file_opened", {
        "file_path": str(Path(file_path).resolve()),
        "tool": tool or "unknown"
    })
    print(f"? Recorded: {file_path}")


def show_suggestions():
    """Show integration suggestions."""
    tracker = UsageTracker()
    suggester = IntegrationSuggester(tracker)
    
    suggestions = suggester.suggest_integrations()
    
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
        print(f"\n  Sample Code:")
        print("  " + "-" * 66)
        for line in suggestion['sample_code'].split('\n'):
            print(f"  {line}")
        print("  " + "-" * 66)
        print()


def show_patterns():
    """Show usage patterns."""
    tracker = UsageTracker()
    patterns = tracker.get_patterns()
    
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


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="floyo - Local system app for suggesting API integrations"
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Record command
    record_parser = subparsers.add_parser('record', help='Record a file access')
    record_parser.add_argument('file', help='File path to record')
    record_parser.add_argument('--tool', help='Tool used to access the file')
    
    # Suggest command
    subparsers.add_parser('suggest', help='Show integration suggestions')
    
    # Patterns command
    subparsers.add_parser('patterns', help='Show usage patterns')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    if args.command == 'record':
        record_file_access(args.file, args.tool)
    elif args.command == 'suggest':
        show_suggestions()
    elif args.command == 'patterns':
        show_patterns()


if __name__ == '__main__':
    main()
