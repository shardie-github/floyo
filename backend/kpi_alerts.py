"""KPI threshold alerts and monitoring."""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from backend.operational_alignment import OperationalAlignment, OperationalMetrics
from backend.email_service import email_service
import logging

logger = logging.getLogger(__name__)


class KPIAlertSystem:
    """Alert system for KPI thresholds."""
    
    # Alert thresholds
    ALERT_THRESHOLDS = {
        "activation_rate": {"warning": 30.0, "critical": 20.0},
        "d7_retention": {"warning": 20.0, "critical": 15.0},
        "d30_retention": {"warning": 12.0, "critical": 8.0},
        "churn_rate": {"warning": 7.0, "critical": 10.0},
        "ltv_cac_ratio": {"warning": 3.0, "critical": 2.0},
    }
    
    @staticmethod
    def check_kpi_alerts(db: Session, days: int = 30) -> List[Dict[str, Any]]:
        """Check KPIs against thresholds and generate alerts."""
        alerts = []
        kpi_status = OperationalAlignment.get_kpi_status(db, days)
        
        for kpi_name, status_data in kpi_status["kpis"].items():
            current = status_data["current"]
            threshold = KPIAlertSystem.ALERT_THRESHOLDS.get(kpi_name)
            
            if not threshold:
                continue
            
            # For metrics where lower is better (churn_rate), invert logic
            if kpi_name == "churn_rate":
                if current >= threshold["critical"]:
                    alerts.append({
                        "kpi": kpi_name,
                        "severity": "critical",
                        "current": current,
                        "threshold": threshold["critical"],
                        "message": f"Critical: {kpi_name} is {current:.2f}% (threshold: {threshold['critical']}%)"
                    })
                elif current >= threshold["warning"]:
                    alerts.append({
                        "kpi": kpi_name,
                        "severity": "warning",
                        "current": current,
                        "threshold": threshold["warning"],
                        "message": f"Warning: {kpi_name} is {current:.2f}% (threshold: {threshold['warning']}%)"
                    })
            else:
                # For metrics where higher is better
                if current <= threshold["critical"]:
                    alerts.append({
                        "kpi": kpi_name,
                        "severity": "critical",
                        "current": current,
                        "threshold": threshold["critical"],
                        "message": f"Critical: {kpi_name} is {current:.2f}% (threshold: {threshold['critical']}%)"
                    })
                elif current <= threshold["warning"]:
                    alerts.append({
                        "kpi": kpi_name,
                        "severity": "warning",
                        "current": current,
                        "threshold": threshold["warning"],
                        "message": f"Warning: {kpi_name} is {current:.2f}% (threshold: {threshold['warning']}%)"
                    })
        
        return alerts
    
    @staticmethod
    def send_alert_email(db: Session, alerts: List[Dict[str, Any]], recipient: str = None) -> bool:
        """Send alert email to administrators."""
        if not alerts:
            return False
        
        # Group by severity
        critical_alerts = [a for a in alerts if a["severity"] == "critical"]
        warning_alerts = [a for a in alerts if a["severity"] == "warning"]
        
        subject = f"KPI Alerts: {len(critical_alerts)} Critical, {len(warning_alerts)} Warnings"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .critical {{ background-color: #fee; border-left: 4px solid #c00; padding: 10px; margin: 10px 0; }}
                .warning {{ background-color: #ffe; border-left: 4px solid #fa0; padding: 10px; margin: 10px 0; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>KPI Alert Report</h2>
                <p>Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                
                {"<h3>Critical Alerts</h3>" + "".join([f'<div class="critical"><strong>{a["kpi"]}</strong>: {a["message"]}</div>' for a in critical_alerts]) if critical_alerts else ""}
                
                {"<h3>Warning Alerts</h3>" + "".join([f'<div class="warning"><strong>{a["kpi"]}</strong>: {a["message"]}</div>' for a in warning_alerts]) if warning_alerts else ""}
                
                <div class="footer">
                    <p>This is an automated alert from Floyo Operational Alignment System.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        KPI Alert Report
        Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
        
        {"CRITICAL ALERTS:" if critical_alerts else ""}
        {chr(10).join([f"- {a['message']}" for a in critical_alerts]) if critical_alerts else ""}
        
        {"WARNINGS:" if warning_alerts else ""}
        {chr(10).join([f"- {a['message']}" for a in warning_alerts]) if warning_alerts else ""}
        
        ---
        This is an automated alert from Floyo Operational Alignment System.
        """
        
        # Get admin email from environment or use default
        admin_email = recipient or os.getenv("ADMIN_EMAIL", "admin@floyo.dev")
        
        return email_service.send_email(admin_email, subject, html_body, text_body)
    
    @staticmethod
    def check_and_alert(db: Session, days: int = 30, send_email: bool = True) -> Dict[str, Any]:
        """Check KPIs and send alerts if needed."""
        alerts = KPIAlertSystem.check_kpi_alerts(db, days)
        
        result = {
            "alerts_found": len(alerts),
            "critical_count": len([a for a in alerts if a["severity"] == "critical"]),
            "warning_count": len([a for a in alerts if a["severity"] == "warning"]),
            "alerts": alerts,
            "checked_at": datetime.utcnow().isoformat()
        }
        
        if alerts and send_email:
            try:
                email_sent = KPIAlertSystem.send_alert_email(db, alerts)
                result["email_sent"] = email_sent
            except Exception as e:
                logger.error(f"Failed to send alert email: {e}")
                result["email_sent"] = False
                result["email_error"] = str(e)
        
        return result
