# floyo

Tiny system app that suggests concrete, niche API integrations based on actual user routine: "This MS Word macro could be chained with last week's Python scraper and Dropbox move to create a new workflow—here's sample code." No cloud; totally local, learning from usage patterns, not vendors.

## Features

- 🔍 **Automatic File System Monitoring** - Tracks file access, creation, modification, and deletion
- 📊 **Pattern Detection** - Identifies usage patterns, temporal sequences, and file relationships
- 💡 **Smart Suggestions** - Suggests API integrations based on your actual workflow
- 🔗 **Relationship Mapping** - Detects input/output relationships and file dependencies
- ⏱️ **Temporal Analysis** - Learns sequential workflows and time-based patterns
- 🔒 **Privacy First** - All data stored locally, no cloud, no external services
- ⚙️ **Configurable** - Customize monitored directories, exclusions, and behavior

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Install in development mode
pip install -e .
```

## Quick Start

```bash
# Start automatic file system monitoring
floyo watch

# In another terminal, get suggestions
floyo suggest

# View usage patterns
floyo patterns

# Check tracking status
floyo status
```

## Commands

- `floyo watch` - Start file system monitoring
- `floyo suggest` - Show integration suggestions
- `floyo patterns` - Show usage patterns
- `floyo status` - Show tracking statistics
- `floyo temporal` - Show temporal patterns
- `floyo relationships [file]` - Show file relationships
- `floyo record <file>` - Manually record file access
- `floyo export <file>` - Export tracking data
- `floyo import <file>` - Import tracking data
- `floyo clear` - Clear all tracking data

See [USER_GUIDE.md](docs/USER_GUIDE.md) for detailed documentation.

## Configuration

Configuration is stored in `~/.floyo/config.toml`. Customize monitored directories, exclusion patterns, and more.

## Development

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=floyo

# View documentation
cat docs/USER_GUIDE.md
cat docs/DEVELOPER_GUIDE.md
```

See [DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for development documentation.

## Architecture

- **tracker.py** - Usage tracking and pattern analysis
- **suggester.py** - Integration suggestion engine
- **watcher.py** - File system monitoring (uses watchdog)
- **command_tracker.py** - Command execution tracking
- **config.py** - Configuration management
- **cli.py** - Command-line interface

## Requirements

- Python 3.7+
- watchdog (file system monitoring)
- pyyaml (configuration)
- toml (configuration)

## License

Apache-2.0
