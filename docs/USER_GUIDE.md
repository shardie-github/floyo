# Floyo User Guide

## Introduction

Floyo is a local system app that suggests concrete, niche API integrations based on your actual usage patterns. It learns from your file access, script executions, and workflows to provide personalized integration suggestions.

## Installation

```bash
pip install -e .
```

Or install dependencies manually:
```bash
pip install -r requirements.txt
```

## Quick Start

### 1. Start Monitoring

Start automatic file system monitoring:
```bash
floyo watch
```

This will monitor the current directory (or directories configured in `~/.floyo/config.toml`).

### 2. Record Events Manually

You can also manually record file access:
```bash
floyo record /path/to/file.py --tool python
```

### 3. View Suggestions

Get integration suggestions based on your usage:
```bash
floyo suggest
```

### 4. View Patterns

See detected usage patterns:
```bash
floyo patterns
```

### 5. Check Status

View tracking statistics:
```bash
floyo status
```

## CLI Commands

### `floyo record <file> [--tool TOOL]`
Record a file access event manually.

**Example:**
```bash
floyo record script.py --tool python
```

### `floyo suggest [--json]`
Show integration suggestions based on usage patterns.

**Options:**
- `--json`: Output as JSON for scripting

### `floyo patterns [--json]`
Show detected usage patterns for file types.

**Options:**
- `--json`: Output as JSON for scripting

### `floyo status [--json]`
Show tracking statistics.

**Options:**
- `--json`: Output as JSON for scripting

### `floyo watch [-d]`
Start file system monitoring.

**Options:**
- `-d, --daemon`: Run in background daemon mode

### `floyo clear [-y]`
Clear all tracking data.

**Options:**
- `-y, --yes`: Skip confirmation prompt

### `floyo export <output_file>`
Export tracking data to a JSON file.

**Example:**
```bash
floyo export backup.json
```

### `floyo import <input_file>`
Import tracking data from a JSON file.

**Example:**
```bash
floyo import backup.json
```

### `floyo temporal [-l LIMIT] [--json]`
Show temporal patterns (sequences of events).

**Options:**
- `-l, --limit`: Maximum number of patterns to show (default: 20)
- `--json`: Output as JSON for scripting

### `floyo relationships [file] [--json]`
Show file relationships.

**Options:**
- `file`: Optional file path to show relationships for
- `--json`: Output as JSON for scripting

## Configuration

Configuration is stored in `~/.floyo/config.toml`. You can edit this file to customize behavior.

### Example Configuration

```toml
monitored_directories = [
    "/home/user/projects",
    "/home/user/documents"
]

exclude_patterns = [
    r"\.git/",
    r"__pycache__/",
    r"node_modules/"
]

[tracking]
enable_file_watcher = true
enable_command_tracking = true
max_events = 1000
retention_days = 90

[suggestions]
max_suggestions = 5
use_actual_file_paths = true

[privacy]
anonymize_paths = false
exclude_sensitive_dirs = []
```

## Features

### Automatic File System Monitoring

Floyo can automatically monitor file system events:
- File creation
- File modification
- File deletion
- File moves/renames

### Pattern Detection

Floyo detects:
- File type usage patterns
- Temporal patterns (event sequences)
- File relationships (input/output, dependencies)
- Workflow patterns

### Integration Suggestions

Based on detected patterns, Floyo suggests:
- Dropbox API integration for file syncing
- Email API integration for sending results
- Database API integration for storing data
- Slack API integration for notifications
- And more based on your usage

## Privacy

- All data is stored locally in `~/.floyo/`
- No data is sent to external services
- You can exclude sensitive directories in configuration
- You can clear all data at any time with `floyo clear`

## Troubleshooting

### File system monitoring not working

Make sure you have the `watchdog` library installed:
```bash
pip install watchdog
```

### No suggestions appearing

Make sure you've been using files and scripts. Floyo needs usage data to generate suggestions.

### Configuration not loading

Check that `~/.floyo/config.toml` exists and is valid TOML format.

## Examples

### Example Workflow

1. Start monitoring:
   ```bash
   floyo watch
   ```

2. Work normally - edit Python scripts, run commands, etc.

3. After some usage, check suggestions:
   ```bash
   floyo suggest
   ```

4. View detected patterns:
   ```bash
   floyo patterns
   ```

5. See temporal patterns:
   ```bash
   floyo temporal
   ```

6. Export data for backup:
   ```bash
   floyo export backup.json
   ```

## Advanced Usage

### JSON Output for Scripting

All commands support `--json` flag for programmatic access:
```bash
floyo suggest --json | jq '.[0].suggested_integration'
```

### Verbose Mode

Enable debug output:
```bash
floyo --verbose watch
```

### Multiple Monitor Sessions

You can run monitoring in daemon mode and continue using other commands:
```bash
floyo watch -d &
floyo status
floyo suggest
```

## FAQ

**Q: Does Floyo send data to the cloud?**
A: No, all data is stored locally in `~/.floyo/`

**Q: Can I exclude certain directories?**
A: Yes, configure `exclude_patterns` in `~/.floyo/config.toml`

**Q: How much disk space does Floyo use?**
A: Minimal - it stores event history (up to 1000 events by default) and patterns

**Q: Can I share my patterns with others?**
A: Yes, use `floyo export` to create a shareable JSON file
