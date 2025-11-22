"""Weekly metrics report generation and automation."""

import sys
from pathlib import Path
from typing import Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import json

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.database import SessionLocal
from backend.logging_config import setup_logging, get_logger
from backend.jobs.metrics_aggregation import aggregate_weekly_metrics
from backend.jobs.retention_analysis import analyze_retention_cohorts

setup_logging()
logger = get_logger(__name__)


def generate_weekly_report(db: Session) -> Dict[str, Any]:
    """
    Generate comprehensive weekly metrics report.
    
    Returns:
        Dictionary with weekly metrics report
    """
    try:
        # Get weekly metrics
        weekly_metrics = aggregate_weekly_metrics(db)
        
        # Get retention analysis
        retention_analysis = analyze_retention_cohorts(db, weeks_back=12)
        
        # Compile report
        report = {
            "report_date": datetime.utcnow().isoformat(),
            "period": {
                "week_start": weekly_metrics.get("week_start"),
                "week_end": (datetime.fromisoformat(weekly_metrics["week_start"]) + timedelta(days=7)).isoformat(),
            },
            "metrics": {
                "signups": weekly_metrics.get("signups", 0),
                "activations": weekly_metrics.get("activations", 0),
                "activation_rate": weekly_metrics.get("activation_rate", 0),
                "retention_7d": weekly_metrics.get("retention_7d", 0),
            },
            "retention": {
                "average_7d": retention_analysis.get("averages", {}).get("retention_7d", 0),
                "average_30d": retention_analysis.get("averages", {}).get("retention_30d", 0),
                "cohorts_analyzed": len(retention_analysis.get("cohorts", [])),
            },
            "insights": _generate_insights(weekly_metrics, retention_analysis),
            "recommendations": _generate_recommendations(weekly_metrics, retention_analysis),
        }
        
        logger.info(f"Weekly report generated: {report}")
        return report
        
    except Exception as e:
        logger.error(f"Error generating weekly report: {e}", exc_info=True)
        raise


def _generate_insights(
    weekly_metrics: Dict[str, Any],
    retention_analysis: Dict[str, Any]
) -> List[str]:
    """Generate insights from metrics."""
    insights = []
    
    activation_rate = weekly_metrics.get("activation_rate", 0)
    if activation_rate < 30:
        insights.append(f"Activation rate ({activation_rate}%) is below target (40%+). Focus on onboarding improvements.")
    elif activation_rate > 50:
        insights.append(f"Activation rate ({activation_rate}%) exceeds target. Consider focusing on retention.")
    
    retention_7d = weekly_metrics.get("retention_7d", 0)
    if retention_7d < 25:
        insights.append(f"7-day retention ({retention_7d}%) is below target (30%+). Focus on engagement.")
    
    return insights


def _generate_recommendations(
    weekly_metrics: Dict[str, Any],
    retention_analysis: Dict[str, Any]
) -> List[str]:
    """Generate recommendations from metrics."""
    recommendations = []
    
    activation_rate = weekly_metrics.get("activation_rate", 0)
    if activation_rate < 30:
        recommendations.append("Improve onboarding flow to increase activation rate")
        recommendations.append("Add sample data generation for faster time-to-first-insight")
    
    retention_7d = weekly_metrics.get("retention_7d", 0)
    if retention_7d < 25:
        recommendations.append("Implement re-engagement campaigns for inactive users")
        recommendations.append("Add email notifications for new insights")
    
    return recommendations


def save_report_to_file(report: Dict[str, Any], output_path: str = None) -> str:
    """Save weekly report to JSON file."""
    if output_path is None:
        output_path = f"reports/weekly-metrics-{datetime.utcnow().strftime('%Y-%m-%d')}.json"
    
    # Ensure reports directory exists
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    logger.info(f"Weekly report saved to {output_path}")
    return output_path


if __name__ == "__main__":
    db = SessionLocal()
    try:
        report = generate_weekly_report(db)
        output_path = save_report_to_file(report)
        print(f"Weekly report generated: {output_path}")
        print(json.dumps(report, indent=2))
    finally:
        db.close()
