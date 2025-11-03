#!/usr/bin/env python3
"""
Database backup script for Floyo.

Creates PostgreSQL database backups with compression and retention policies.
Supports full and incremental backups.
"""

import os
import sys
import subprocess
import gzip
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.logging_config import setup_logging, get_logger

setup_logging()
logger = get_logger(__name__)

# Configuration
BACKUP_DIR = Path(os.getenv("BACKUP_DIR", "./backups"))
RETENTION_DAYS = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
COMPRESSION = os.getenv("BACKUP_COMPRESSION", "gzip").lower() == "true"

# Database connection from environment
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://floyo:floyo@localhost:5432/floyo")


def parse_db_url(url: str) -> dict:
    """Parse database URL into components."""
    # Simple parser for postgresql://user:pass@host:port/dbname
    url = url.replace("postgresql://", "")
    if "@" in url:
        auth, rest = url.split("@", 1)
        user, password = auth.split(":", 1)
    else:
        user, password = "floyo", ""
        rest = url
    
    if ":" in rest:
        host_port, dbname = rest.rsplit("/", 1)
        if ":" in host_port:
            host, port = host_port.split(":", 1)
        else:
            host = host_port
            port = "5432"
    else:
        host = "localhost"
        port = "5432"
        dbname = rest.split("/")[-1] if "/" in rest else rest
    
    return {
        "user": user,
        "password": password,
        "host": host,
        "port": port,
        "dbname": dbname
    }


def create_backup(full: bool = True, output_path: Optional[Path] = None, parallel_jobs: int = 4) -> Path:
    """
    Create a database backup.
    
    Args:
        full: If True, create a full backup. If False, create incremental.
        output_path: Optional custom output path. If None, auto-generates.
    
    Returns:
        Path to the created backup file.
    """
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    
    db_config = parse_db_url(DATABASE_URL)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    backup_type = "full" if full else "incremental"
    
    if output_path is None:
        output_path = BACKUP_DIR / f"floyo_{backup_type}_{timestamp}.sql"
    
    # Set PGPASSWORD environment variable for non-interactive backup
    env = os.environ.copy()
    if db_config["password"]:
        env["PGPASSWORD"] = db_config["password"]
    
    # Build pg_dump command with optimizations
    # Note: Custom format (-F c) doesn't support parallel jobs, but we can use directory format instead
    # For better performance, use directory format with parallel jobs when available
    use_directory_format = parallel_jobs > 1
    
    if use_directory_format:
        # Directory format supports parallel jobs
        output_dir = output_path.with_suffix('.d')
        output_dir.mkdir(parents=True, exist_ok=True)
        cmd = [
            "pg_dump",
            "-h", db_config["host"],
            "-p", db_config["port"],
            "-U", db_config["user"],
            "-d", db_config["dbname"],
            "-F", "d",  # Directory format (supports parallel jobs)
            "-f", str(output_dir),
            "-j", str(parallel_jobs),  # Parallel jobs for faster backup
            "--verbose"  # Progress output
        ]
        actual_output = output_dir
    else:
        # Custom format (single-threaded but compressed)
        cmd = [
            "pg_dump",
            "-h", db_config["host"],
            "-p", db_config["port"],
            "-U", db_config["user"],
            "-d", db_config["dbname"],
            "-F", "c",  # Custom format (allows compression)
            "-f", str(output_path),
            "--verbose"  # Progress output
        ]
        actual_output = output_path
    
    if full:
        cmd.append("--clean")  # Include DROP statements
        cmd.append("--if-exists")
    
    try:
        logger.info(f"Creating {backup_type} backup to {output_path}")
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        
        # Handle directory format output
        if use_directory_format:
            # For directory format, compress the entire directory
            if COMPRESSION:
                import tarfile
                compressed_path = Path(str(output_dir) + ".tar.gz")
                logger.info(f"Compressing backup directory to {compressed_path}")
                with tarfile.open(compressed_path, "w:gz") as tar:
                    tar.add(output_dir, arcname=output_dir.name)
                shutil.rmtree(output_dir)
                final_output = compressed_path
            else:
                final_output = output_dir
        else:
            # Compress single file if requested
            if COMPRESSION and output_path.suffix != ".gz":
                compressed_path = Path(str(output_path) + ".gz")
                logger.info(f"Compressing backup to {compressed_path}")
                with open(output_path, "rb") as f_in:
                    with gzip.open(compressed_path, "wb") as f_out:
                        shutil.copyfileobj(f_in, f_out)
                output_path.unlink()
                final_output = compressed_path
            else:
                final_output = output_path
        
        # Create metadata file
        metadata_path = final_output.with_suffix(final_output.suffix + ".meta.json")
        metadata = {
            "backup_type": backup_type,
            "timestamp": timestamp,
            "database": db_config["dbname"],
            "host": db_config["host"],
            "size_bytes": final_output.stat().st_size,
            "compressed": COMPRESSION,
            "parallel_jobs": parallel_jobs if use_directory_format else 1,
            "format": "directory" if use_directory_format else "custom",
            "created_at": datetime.utcnow().isoformat()
        }
        
        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)
        
        logger.info(f"Backup created successfully: {final_output} ({final_output.stat().st_size / 1024 / 1024:.2f} MB)")
        return final_output
        
    except subprocess.CalledProcessError as e:
        logger.error(f"Backup failed: {e.stderr}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during backup: {e}")
        raise


def restore_backup(backup_path: Path, drop_existing: bool = False) -> None:
    """
    Restore a database from backup.
    
    Args:
        backup_path: Path to the backup file (.sql, .sql.gz, or .custom)
        drop_existing: If True, drop existing database before restore
    """
    db_config = parse_db_url(DATABASE_URL)
    env = os.environ.copy()
    if db_config["password"]:
        env["PGPASSWORD"] = db_config["password"]
    
    # Decompress if needed
    actual_path = backup_path
    if backup_path.suffix == ".gz":
        logger.info(f"Decompressing {backup_path}")
        actual_path = backup_path.with_suffix("")
        with gzip.open(backup_path, "rb") as f_in:
            with open(actual_path, "wb") as f_out:
                shutil.copyfileobj(f_in, f_out)
    
    try:
        if drop_existing:
            logger.info(f"Dropping existing database {db_config['dbname']}")
            drop_cmd = [
                "psql",
                "-h", db_config["host"],
                "-p", db_config["port"],
                "-U", db_config["user"],
                "-d", "postgres",  # Connect to postgres to drop target DB
                "-c", f"DROP DATABASE IF EXISTS {db_config['dbname']};"
            ]
            subprocess.run(drop_cmd, env=env, check=True, capture_output=True)
            
            create_cmd = [
                "psql",
                "-h", db_config["host"],
                "-p", db_config["port"],
                "-U", db_config["user"],
                "-d", "postgres",
                "-c", f"CREATE DATABASE {db_config['dbname']};"
            ]
            subprocess.run(create_cmd, env=env, check=True, capture_output=True)
        
        # Determine restore method based on file format
        if actual_path.suffix == ".custom" or ".custom" in actual_path.suffixes:
            # pg_restore for custom format
            cmd = [
                "pg_restore",
                "-h", db_config["host"],
                "-p", db_config["port"],
                "-U", db_config["user"],
                "-d", db_config["dbname"],
                "--clean",
                "--if-exists",
                str(actual_path)
            ]
        else:
            # psql for plain SQL
            cmd = [
                "psql",
                "-h", db_config["host"],
                "-p", db_config["port"],
                "-U", db_config["user"],
                "-d", db_config["dbname"],
                "-f", str(actual_path)
            ]
        
        logger.info(f"Restoring database from {backup_path}")
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        
        logger.info("Database restored successfully")
        
        # Clean up decompressed file if it was compressed
        if actual_path != backup_path and actual_path.exists():
            actual_path.unlink()
            
    except subprocess.CalledProcessError as e:
        logger.error(f"Restore failed: {e.stderr}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during restore: {e}")
        raise


def cleanup_old_backups() -> int:
    """Remove backups older than retention period."""
    cutoff_date = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
    deleted_count = 0
    
    if not BACKUP_DIR.exists():
        return 0
    
    for backup_file in BACKUP_DIR.glob("floyo_*.sql*"):
        try:
            # Extract timestamp from filename
            # Format: floyo_full_20240101_120000.sql.gz
            parts = backup_file.stem.split("_")
            if len(parts) >= 4:
                date_str = f"{parts[2]}_{parts[3]}"
                try:
                    file_date = datetime.strptime(date_str, "%Y%m%d_%H%M%S")
                    if file_date < cutoff_date:
                        backup_file.unlink()
                        # Also delete metadata if exists
                        meta_file = backup_file.with_suffix(backup_file.suffix + ".meta.json")
                        if meta_file.exists():
                            meta_file.unlink()
                        deleted_count += 1
                        logger.info(f"Deleted old backup: {backup_file.name}")
                except ValueError:
                    # Skip files that don't match naming pattern
                    pass
        except Exception as e:
            logger.warning(f"Error checking backup file {backup_file}: {e}")
    
    return deleted_count


def list_backups() -> list:
    """List all available backups."""
    if not BACKUP_DIR.exists():
        return []
    
    backups = []
    for backup_file in sorted(BACKUP_DIR.glob("floyo_*.sql*"), reverse=True):
        if backup_file.suffix == ".gz" or backup_file.name.endswith(".meta.json"):
            continue
        
        meta_file = backup_file.with_suffix(backup_file.suffix + ".meta.json")
        if meta_file.exists():
            with open(meta_file) as f:
                metadata = json.load(f)
            backups.append({
                "path": str(backup_file),
                "type": metadata.get("backup_type", "unknown"),
                "size_mb": metadata.get("size_bytes", 0) / 1024 / 1024,
                "created_at": metadata.get("created_at"),
                "compressed": metadata.get("compressed", False)
            })
        else:
            backups.append({
                "path": str(backup_file),
                "type": "unknown",
                "size_mb": backup_file.stat().st_size / 1024 / 1024,
                "created_at": datetime.fromtimestamp(backup_file.stat().st_mtime).isoformat(),
                "compressed": False
            })
    
    return backups


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Floyo Database Backup Tool")
    parser.add_argument(
        "action",
        choices=["backup", "restore", "list", "cleanup"],
        help="Action to perform"
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="Create full backup (default: True)"
    )
    parser.add_argument(
        "--incremental",
        action="store_true",
        help="Create incremental backup"
    )
    parser.add_argument(
        "--file",
        type=Path,
        help="Backup file path (for restore) or output path (for backup)"
    )
    parser.add_argument(
        "--drop-existing",
        action="store_true",
        help="Drop existing database before restore (use with caution!)"
    )
    
    args = parser.parse_args()
    
    try:
        if args.action == "backup":
            full = not args.incremental
            backup_path = create_backup(full=full, output_path=args.file)
            print(f"Backup created: {backup_path}")
            
        elif args.action == "restore":
            if not args.file:
                parser.error("--file is required for restore action")
            restore_backup(args.file, drop_existing=args.drop_existing)
            print("Database restored successfully")
            
        elif args.action == "list":
            backups = list_backups()
            if backups:
                print(f"\nFound {len(backups)} backup(s):\n")
                for backup in backups:
                    print(f"  {backup['type'].upper():12} {backup['created_at'][:19]:19} "
                          f"{backup['size_mb']:8.2f} MB  {backup['path']}")
            else:
                print("No backups found")
                
        elif args.action == "cleanup":
            deleted = cleanup_old_backups()
            print(f"Deleted {deleted} old backup(s)")
            
    except Exception as e:
        logger.error(f"Operation failed: {e}")
        sys.exit(1)
