"""Retention analysis job for calculating 7-day and 30-day retention rates."""

import sys
from pathlib import Path
from typing import Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, distinct

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database import SessionLocal, get_db
from backend.logging_config import setup_logging, get_logger
from database.models import User, AuditLog, Event

setup_logging()
logger = get_logger(__name__)


def calculate_retention_rates(
    db: Session,
    cohort_date: datetime = None
) -> Dict[str, Any]:
    """
    Calculate 7-day and 30-day retention rates for a cohort.
    
    Args:
        db: Database session
        cohort_date: Date of the cohort (defaults to 30 days ago)
        
    Returns:
        Dictionary with retention metrics
    """
    if cohort_date is None:
        cohort_date = datetime.utcnow() - timedelta(days=30)
    
    cohort_start = cohort_date.replace(hour=0, minute=0, second=0, microsecond=0)
    cohort_end = cohort_start + timedelta(days=1)
    
    logger.info(f"Calculating retention for cohort starting {cohort_start.date()}")
    
    try:
        # Get cohort size (users who signed up on cohort_date)
        cohort_size = db.query(func.count(User.id)).filter(
            and_(
                User.created_at >= cohort_start,
                User.created_at < cohort_end
            )
        ).scalar() or 0
        
        if cohort_size == 0:
            return {
                "cohort_date": cohort_start.date().isoformat(),
                "cohort_size": 0,
                "retention_7d": 0,
                "retention_30d": 0,
            }
        
        # Calculate 7-day retention (users active 7 days after signup)
        retention_7d_date = cohort_start + timedelta(days=7)
        retention_7d_end = retention_7d_date + timedelta(days=1)
        
        retention_7d_users = db.query(func.count(distinct(AuditLog.user_id))).join(
            User, AuditLog.user_id == User.id
        ).filter(
            and_(
                User.created_at >= cohort_start,
                User.created_at < cohort_end,
                AuditLog.created_at >= retention_7d_date,
                AuditLog.created_at < retention_7d_end
            )
        ).scalar() or 0
        
        retention_7d_rate = (retention_7d_users / cohort_size * 100) if cohort_size > 0 else 0
        
        # Calculate 30-day retention (users active 30 days after signup)
        retention_30d_date = cohort_start + timedelta(days=30)
        retention_30d_end = retention_30d_date + timedelta(days=1)
        
        retention_30d_users = db.query(func.count(distinct(AuditLog.user_id))).join(
            User, AuditLog.user_id == User.id
        ).filter(
            and_(
                User.created_at >= cohort_start,
                User.created_at < cohort_end,
                AuditLog.created_at >= retention_30d_date,
                AuditLog.created_at < retention_30d_end
            )
        ).scalar() or 0
        
        retention_30d_rate = (retention_30d_users / cohort_size * 100) if cohort_size > 0 else 0
        
        return {
            "cohort_date": cohort_start.date().isoformat(),
            "cohort_size": cohort_size,
            "retention_7d": {
                "users": retention_7d_users,
                "rate": round(retention_7d_rate, 2)
            },
            "retention_30d": {
                "users": retention_30d_users,
                "rate": round(retention_30d_rate, 2)
            },
            "calculated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error calculating retention rates: {e}", exc_info=True)
        raise


def analyze_retention_cohorts(
    db: Session,
    weeks_back: int = 12
) -> Dict[str, Any]:
    """
    Analyze retention for multiple cohorts.
    
    Args:
        db: Database session
        weeks_back: Number of weeks to analyze
        
    Returns:
        Dictionary with retention analysis for multiple cohorts
    """
    cohorts = []
    
    for week in range(weeks_back):
        cohort_date = datetime.utcnow() - timedelta(weeks=week + 1)
        cohort_data = calculate_retention_rates(db, cohort_date)
        cohorts.append(cohort_data)
    
    # Calculate averages
    avg_7d = sum(c['retention_7d']['rate'] for c in cohorts if c['cohort_size'] > 0) / len([c for c in cohorts if c['cohort_size'] > 0]) if cohorts else 0
    avg_30d = sum(c['retention_30d']['rate'] for c in cohorts if c['cohort_size'] > 0) / len([c for c in cohorts if c['cohort_size'] > 0]) if cohorts else 0
    
    return {
        "cohorts": cohorts,
        "averages": {
            "retention_7d": round(avg_7d, 2),
            "retention_30d": round(avg_30d, 2),
        },
        "weeks_analyzed": weeks_back,
        "calculated_at": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Calculate retention rates")
    parser.add_argument("--cohort-date", type=str, help="Cohort date (YYYY-MM-DD)")
    parser.add_argument("--weeks", type=int, default=12, help="Number of weeks to analyze")
    
    args = parser.parse_args()
    
    db = SessionLocal()
    try:
        if args.cohort_date:
            cohort_date = datetime.strptime(args.cohort_date, "%Y-%m-%d")
            result = calculate_retention_rates(db, cohort_date)
        else:
            result = analyze_retention_cohorts(db, args.weeks)
        
        print(f"Retention Analysis Results:")
        print(f"{result}")
    finally:
        db.close()
