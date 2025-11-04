"""Trust ledger - append-only immutable log with hash chains."""

import os
import json
import hashlib
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from .events import GuardianEvent
import logging

logger = logging.getLogger(__name__)


class TrustLedger:
    """Append-only trust ledger with cryptographic verification."""
    
    def __init__(self, ledger_dir: Optional[Path] = None):
        """Initialize trust ledger."""
        if ledger_dir is None:
            # Use user-specific directory or fallback to default
            base_dir = Path(os.getenv("GUARDIAN_LEDGER_DIR", "/tmp/guardian/ledger"))
            ledger_dir = base_dir
        
        self.ledger_dir = Path(ledger_dir)
        self.ledger_dir.mkdir(parents=True, exist_ok=True)
        
        # Per-user ledger files
        self.user_ledgers: Dict[str, Path] = {}
    
    def _get_ledger_file(self, user_id: str) -> Path:
        """Get ledger file path for user."""
        if user_id not in self.user_ledgers:
            ledger_file = self.ledger_dir / f"user_{user_id}.jsonl"
            self.user_ledgers[user_id] = ledger_file
        
        return self.user_ledgers[user_id]
    
    def append(self, event: GuardianEvent) -> str:
        """Append event to ledger and return hash."""
        ledger_file = self._get_ledger_file(event.user_id or "anonymous")
        
        # Read existing entries to get previous hash
        previous_hash = self._get_last_hash(ledger_file)
        
        # Create entry with hash chain
        entry_data = event.to_dict()
        entry_data["previous_hash"] = previous_hash
        
        # Calculate hash
        entry_json = json.dumps(entry_data, sort_keys=True, default=str)
        entry_hash = hashlib.sha256(entry_json.encode()).hexdigest()
        entry_data["hash"] = entry_hash
        
        # Append to ledger (append-only)
        final_entry = {**entry_data, "hash": entry_hash}
        with open(ledger_file, 'a') as f:
            f.write(json.dumps(final_entry, default=str) + '\n')
        
        logger.debug(f"Appended event {event.event_id} to ledger, hash: {entry_hash[:16]}...")
        
        return entry_hash
    
    def _get_last_hash(self, ledger_file: Path) -> Optional[str]:
        """Get hash of last entry in ledger."""
        if not ledger_file.exists():
            return None
        
        try:
            # Read last line
            with open(ledger_file, 'rb') as f:
                try:
                    f.seek(-2, os.SEEK_END)
                    while f.read(1) != b'\n':
                        f.seek(-2, os.SEEK_CUR)
                except OSError:
                    f.seek(0)
                
                last_line = f.readline().decode()
                if last_line.strip():
                    entry = json.loads(last_line)
                    return entry.get("hash")
        except Exception as e:
            logger.warning(f"Failed to read last hash from {ledger_file}: {e}")
        
        return None
    
    def get_user_ledger(self, user_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all entries for a user."""
        ledger_file = self._get_ledger_file(user_id)
        
        if not ledger_file.exists():
            return []
        
        entries = []
        try:
            with open(ledger_file, 'r') as f:
                for line in f:
                    if line.strip():
                        entry = json.loads(line)
                        entries.append(entry)
            
            # Reverse to get most recent first
            entries.reverse()
            
            if limit:
                entries = entries[:limit]
        except Exception as e:
            logger.error(f"Failed to read ledger for user {user_id}: {e}")
        
        return entries
    
    def verify(self, user_id: str) -> Dict[str, Any]:
        """Verify integrity of ledger hash chain."""
        ledger_file = self._get_ledger_file(user_id)
        
        if not ledger_file.exists():
            return {
                "valid": True,
                "entries": 0,
                "errors": [],
            }
        
        entries = []
        errors = []
        previous_hash = None
        
        try:
            with open(ledger_file, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    if not line.strip():
                        continue
                    
                    try:
                        entry = json.loads(line)
                        entries.append(entry)
                        
                        # Verify hash chain
                        stored_hash = entry.get("hash")
                        stored_prev_hash = entry.get("previous_hash")
                        
                        if previous_hash and stored_prev_hash != previous_hash:
                            errors.append(f"Hash chain broken at line {line_num}: expected {previous_hash[:16]}..., got {stored_prev_hash[:16] if stored_prev_hash else 'None'}...")
                        
                        # Verify entry hash
                        entry_copy = {k: v for k, v in entry.items() if k != "hash"}
                        entry_json = json.dumps(entry_copy, sort_keys=True, default=str)
                        calculated_hash = hashlib.sha256(entry_json.encode()).hexdigest()
                        
                        if stored_hash != calculated_hash:
                            errors.append(f"Hash mismatch at line {line_num}: stored {stored_hash[:16]}..., calculated {calculated_hash[:16]}...")
                        
                        previous_hash = stored_hash
                    except json.JSONDecodeError as e:
                        errors.append(f"Invalid JSON at line {line_num}: {e}")
        
        except Exception as e:
            errors.append(f"Failed to read ledger: {e}")
        
        return {
            "valid": len(errors) == 0,
            "entries": len(entries),
            "errors": errors,
            "last_hash": previous_hash,
        }
    
    def get_daily_hash_root(self, user_id: str, date: Optional[datetime] = None) -> Optional[str]:
        """Get hash root for a specific day."""
        if date is None:
            date = datetime.utcnow()
        
        date_str = date.strftime("%Y-%m-%d")
        entries = self.get_user_ledger(user_id)
        
        # Filter entries for the date
        day_entries = [
            e for e in entries
            if datetime.fromisoformat(e["timestamp"]).strftime("%Y-%m-%d") == date_str
        ]
        
        if not day_entries:
            return None
        
        # Calculate root hash of all entries for the day
        entries_json = json.dumps(day_entries, sort_keys=True, default=str)
        root_hash = hashlib.sha256(entries_json.encode()).hexdigest()
        
        return root_hash
