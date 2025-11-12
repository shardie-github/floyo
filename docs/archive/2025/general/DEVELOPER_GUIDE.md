> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Floyo Developer Guide

## Architecture Overview

Floyo consists of several key modules:

### Core Modules

1. **tracker.py** - Usage tracking and pattern analysis
   - `UsageTracker`: Records events, analyzes patterns, detects relationships
   - Handles data persistence to JSON files
   - Implements temporal pattern detection
   - Manages file relationships

2. **suggester.py** - Integration suggestion engine
   - `IntegrationSuggester`: Generates suggestions based on patterns
   - Contains integration templates for different file types
   - Analyzes workflow patterns

3. **watcher.py** - File system monitoring
   - `FileWatcher`: Handles file system events
   - `FileSystemMonitor`: Manages monitoring sessions
   - Uses watchdog library for cross-platform support

4. **command_tracker.py** - Command execution tracking
   - `CommandTracker`: Tracks script executions
   - Detects dependencies from script content

5. **config.py** - Configuration management
   - `Config`: Manages configuration in TOML/YAML/JSON
   - Provides default configuration
   - Supports nested configuration access

6. **cli.py** - Command-line interface
   - Parses command-line arguments
   - Coordinates between modules
   - Provides user-facing commands

## Data Structures

### Events

Events represent user actions:
```python
{
    "timestamp": "2024-01-01T12:00:00",
    "type": "file_opened",
    "details": {
        "file_path": "/path/to/file.py",
        "tool": "python"
    }
}
```

### Patterns

Patterns track file type usage:
```python
{
    ".py": {
        "count": 10,
        "last_used": "2024-01-01T12:00:00",
        "tools": ["python", "vim"]
    }
}
```

### Relationships

Relationships map file connections:
```python
{
    "/path/to/script.py": {
        "/path/to/output.json": {
            "relation_type": "generates",
            "weight": 5,
            "first_seen": "2024-01-01T12:00:00",
            "last_seen": "2024-01-01T12:00:00"
        }
    }
}
```

### Temporal Patterns

Temporal patterns detect event sequences:
```python
{
    "sequence": "file_opened -> file_modified",
    "count": 3,
    "avg_time_gap": 5.2,
    "files": {
        "prev": "/path/to/file1.py",
        "curr": "/path/to/file2.py"
    }
}
```

## Extending Floyo

### Adding New Integration Types

Edit `suggester.py` and add to `tool_integrations`:

```python
".go": {
    "tools": ["go", "compiler"],
    "integrations": [
        "Docker API - containerize Go apps",
        "Kubernetes API - deploy to clusters"
    ]
}
```

### Adding New Event Types

1. Record events with new types:
```python
tracker.record_event("custom_event", {
    "custom_field": "value"
})
```

2. Handle in pattern analysis:
```python
def _analyze_patterns(self, event):
    if event["type"] == "custom_event":
        # Handle custom event
        pass
```

### Adding New Commands

1. Add command parser in `cli.py`:
```python
new_parser = subparsers.add_parser('newcommand', help='Description')
new_parser.add_argument('arg', help='Argument description')
```

2. Add handler function:
```python
def handle_new_command(args):
    # Implementation
    pass
```

3. Wire up in `main()`:
```python
elif args.command == 'newcommand':
    handle_new_command(args)
```

## Testing

Run tests:
```bash
pytest
```

With coverage:
```bash
pytest --cov=floyo --cov-report=html
```

### Writing Tests

Tests are in the `tests/` directory. Follow pytest conventions:

```python
def test_functionality():
    """Test description."""
    # Arrange
    tracker = UsageTracker(data_dir=temp_dir)
    
    # Act
    tracker.record_event("test", {})
    
    # Assert
    assert len(tracker.events) == 1
```

## API Reference

### UsageTracker

**Methods:**
- `record_event(event_type, details)` - Record an event
- `get_patterns()` - Get usage patterns
- `get_temporal_patterns(limit)` - Get temporal patterns
- `get_relationships(file_path)` - Get file relationships
- `get_stats()` - Get tracking statistics
- `clear_data()` - Clear all data

### IntegrationSuggester

**Methods:**
- `suggest_integrations()` - Generate suggestions

### FileSystemMonitor

**Methods:**
- `start()` - Start monitoring
- `stop()` - Stop monitoring
- `is_running()` - Check if running

### Config

**Methods:**
- `get(key, default)` - Get config value (supports dot notation)
- `set(key, value)` - Set config value
- `get_monitored_directories()` - Get monitored directories
- `get_exclude_patterns()` - Get exclusion patterns

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

## Code Style

- Follow PEP 8
- Use type hints
- Add docstrings to all public methods
- Keep functions focused and small
- Use meaningful variable names

## Error Handling

Floyo handles errors gracefully:
- Invalid JSON files are reset to defaults
- File system errors are logged but don't crash
- Missing dependencies are handled with fallbacks

## Performance Considerations

- Events are limited to last 1000 (configurable)
- Patterns are kept to last 100
- Relationships are stored efficiently
- File watching uses watchdog for efficiency

## Future Enhancements

Potential areas for contribution:
- Machine learning-based pattern detection
- More integration templates
- IDE plugins
- Web UI
- Advanced analytics
