"""Automated reporting and scheduled metric calculations."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from backend.services.analytics_service import AnalyticsService as AnalyticsDashboard
from backend.operational_alignment import OperationalAlignment, OperationalMetrics
from backend.kpi_alerts import KPIAlertSystem
from backend.data_quality import DataQualityMonitor
from backend.email_service import email_service
import os
import logging

logger = logging.getLogger(__name__)


class AutomatedReporting:
    """Automated reporting system."""
    
    @staticmethod
    def generate_daily_report(db: Session) -> Dict[str, Any]:
        """Generate daily business report."""
        report = {
            "report_date": datetime.utcnow().date().isoformat(),
            "generated_at": datetime.utcnow().isoformat(),
            "metrics": {},
            "alerts": [],
            "recommendations": []
        }
        
        # Get metrics
        report["metrics"]["activation"] = AnalyticsDashboard.get_activation_metrics(db, days=1)
        report["metrics"]["revenue"] = AnalyticsDashboard.get_revenue_metrics(db, days=1)
        report["metrics"]["real_time"] = OperationalMetrics.get_real_time_metrics(db)
        report["metrics"]["system_health"] = OperationalMetrics.get_system_health(db)
        
        # Check for alerts
        alerts = KPIAlertSystem.check_kpi_alerts(db, days=7)
        report["alerts"] = alerts
        
        # Get priority actions
        actions = OperationalAlignment.get_priority_actions(db, days=7)
        report["recommendations"] = actions[:5]  # Top 5
        
        # Data quality check
        report["data_quality"] = DataQualityMonitor.check_data_quality(db, days=1)
        
        return report
    
    @staticmethod
    def generate_weekly_report(db: Session) -> Dict[str, Any]:
        """Generate weekly business report."""
        report = {
            "report_period": "weekly",
            "report_date": datetime.utcnow().date().isoformat(),
            "generated_at": datetime.utcnow().isoformat(),
            "metrics": {},
            "trends": {},
            "alerts": [],
            "recommendations": []
        }
        
        # Get metrics for the week
        report["metrics"]["activation"] = AnalyticsDashboard.get_activation_metrics(db, days=7)
        report["metrics"]["retention"] = AnalyticsDashboard.get_retention_cohorts(db)
        report["metrics"]["conversion"] = AnalyticsDashboard.get_conversion_funnel(db, days=7)
        report["metrics"]["revenue"] = AnalyticsDashboard.get_revenue_metrics(db, days=7)
        report["metrics"]["growth"] = AnalyticsDashboard.get_growth_metrics(db, days=7)
        
        # Alignment score
        alignment = OperationalAlignment.calculate_alignment_score(db, days=7)
        report["metrics"]["alignment_score"] = alignment["overall_score"]
        
        # Trends
        report["trends"] = OperationalAlignment.get_alignment_trends(db, days=30)
        
        # Alerts
        alerts = KPIAlertSystem.check_kpi_alerts(db, days=7)
        report["alerts"] = alerts
        
        # Recommendations
        actions = OperationalAlignment.get_priority_actions(db, days=7)
        report["recommendations"] = actions
        
        return report
    
    @staticmethod
    def send_daily_report_email(db: Session, recipient: str = None) -> bool:
        """Send daily report via email."""
        report = AutomatedReporting.generate_daily_report(db)
        
        subject = f"Daily Business Report - {report['report_date']}"
        
        # Format metrics for email
        metrics_html = f"""
        <h3>Key Metrics</h3>
        <ul>
            <li><strong>Activation Rate:</strong> {report['metrics']['activation'].get('activation_rate', 0):.2f}%</li>
            <li><strong>Revenue (24h):</strong> ${report['metrics']['revenue'].get('mrr', 0):.2f}</li>
            <li><strong>Active Users (24h):</strong> {report['metrics']['real_time']['active_users']['last_24h']}</li>
            <li><strong>System Health:</strong> {report['metrics']['system_health']['status']}</li>
        </ul>
        """
        
        alerts_html = ""
        if report["alerts"]:
            alerts_html = f"""
            <h3>Alerts ({len(report['alerts'])})</h3>
            <ul>
                {''.join([f"<li>{alert['message']}</li>" for alert in report['alerts'][:5]])}
            </ul>
            """
        
        recommendations_html = ""
        if report["recommendations"]:
            recommendations_html = f"""
            <h3>Top Recommendations</h3>
            <ol>
                {''.join([f"<li>{rec['action']} (Priority: {rec['priority']})</li>" for rec in report['recommendations']])}
            </ol>
            """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Daily Business Report</h2>
                <p>Date: {report['report_date']}</p>
                {metrics_html}
                {alerts_html}
                {recommendations_html}
                <div class="footer">
                    <p>This is an automated report from Floyo.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        admin_email = recipient or os.getenv("ADMIN_EMAIL", "admin@floyo.dev")
        return email_service.send_email(admin_email, subject, html_body, "")
    
    @staticmethod
    def send_weekly_report_email(db: Session, recipient: str = None) -> bool:
        """Send weekly report via email."""
        report = AutomatedReporting.generate_weekly_report(db)
        
        subject = f"Weekly Business Report - {report['report_date']}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .metric {{ margin: 10px 0; padding: 10px; background: #f5f5f5; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Weekly Business Report</h2>
                <p>Period: {report['report_date']}</p>
                
                <div class="metric">
                    <h3>Alignment Score: {report['metrics']['alignment_score']:.1f}/100</h3>
                </div>
                
                <h3>Key Metrics</h3>
                <ul>
                    <li>Activation Rate: {report['metrics']['activation'].get('activation_rate', 0):.2f}%</li>
                    <li>D7 Retention: {report['metrics']['retention'].get('d7', {}).get('retention_rate', 0):.2f}%</li>
                    <li>MRR: ${report['metrics']['revenue'].get('mrr', 0):.2f}</li>
                    <li>Growth Rate: {report['metrics']['growth'].get('growth_rate', 0):.2f}%</li>
                </ul>
                
                {"<h3>Alerts</h3><ul>" + "".join([f"<li>{a['message']}</li>" for a in report['alerts'][:5]]) + "</ul>" if report['alerts'] else ""}
                
                {"<h3>Recommendations</h3><ol>" + "".join([f"<li>{r['action']}</li>" for r in report['recommendations'][:5]]) + "</ol>" if report['recommendations'] else ""}
                
                <div class="footer">
                    <p>This is an automated report from Floyo.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        admin_email = recipient or os.getenv("ADMIN_EMAIL", "admin@floyo.dev")
        return email_service.send_email(admin_email, subject, html_body, "")
