#!/usr/bin/env python3
"""Check if database migrations are up to date."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

try:
    from alembic.config import Config
    from alembic import script
    from alembic.runtime.migration import MigrationContext
    from backend.database import engine
    from backend.config import settings
    
    alembic_cfg = Config("alembic.ini")
    script_dir = script.ScriptDirectory.from_config(alembic_cfg)
    
    # Get current database revision
    with engine.connect() as conn:
        context = MigrationContext.configure(conn)
        current_rev = context.get_current_revision()
    
    # Get head revision
    head_rev = script_dir.get_current_head()
    
    if current_rev != head_rev:
        print(f"❌ Migrations not up to date. Current: {current_rev}, Head: {head_rev}")
        sys.exit(1)
    else:
        print(f"✅ Migrations up to date (revision: {current_rev})")
        sys.exit(0)
        
except Exception as e:
    print(f"❌ Error checking migration status: {e}")
    sys.exit(1)
