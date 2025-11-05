"""Guardian CLI commands for ops."""

import click
from pathlib import Path
import sys

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.guardian.ledger import TrustLedger
from backend.guardian.service import get_guardian_service
from backend.guardian.inspector import GuardianInspector
from ops.guardian.audit import GuardianAuditor


@click.group()
def guardian():
    """Guardian privacy system commands."""
    pass


@guardian.command()
@click.option("--user-id", required=True, help="User ID to verify")
def verify(user_id: str):
    """Verify trust ledger integrity."""
    ledger = TrustLedger()
    verification = ledger.verify(user_id)
    
    if verification["valid"]:
        click.echo(f"✅ Ledger integrity verified for user {user_id}")
        click.echo(f"   Entries: {verification['entries']}")
        if verification.get("last_hash"):
            click.echo(f"   Last hash: {verification['last_hash'][:16]}...")
    else:
        click.echo(f"❌ Ledger integrity failed for user {user_id}")
        for error in verification["errors"]:
            click.echo(f"   Error: {error}")
        sys.exit(1)


@guardian.command()
@click.option("--user-id", required=True, help="User ID")
def report(user_id: str):
    """Generate trust report for user."""
    inspector = GuardianInspector()
    report = inspector.generate_trust_report(user_id)
    
    click.echo(f"Trust Report for user {user_id}")
    click.echo(f"Generated: {report['generated_at']}")
    click.echo(f"\nDaily Summary:")
    click.echo(f"  Total events: {report['daily']['total_events']}")
    click.echo(f"  Confidence score: {report['daily']['confidence_score']:.1f}%")
    click.echo(f"\nWeekly Summary:")
    click.echo(f"  Total events: {report['weekly']['total_events']}")
    click.echo(f"  Confidence score: {report['weekly']['confidence_score']:.1f}%")


@guardian.command()
def audit():
    """Run Guardian audit checks."""
    auditor = GuardianAuditor()
    report = auditor.run_all_checks()
    
    if report["passed"]:
        click.echo("✅ All Guardian audit checks passed!")
        sys.exit(0)
    else:
        click.echo("❌ Guardian audit failed")
        sys.exit(1)


if __name__ == "__main__":
    guardian()
