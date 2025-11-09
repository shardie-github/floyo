"""Retention campaign email automation system."""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database.models import User, Event, Workflow, Suggestion, RetentionCampaign
from backend.email_service import email_service
from backend.audit import log_audit
from backend.growth import RetentionEngine
import logging

logger = logging.getLogger(__name__)


class RetentionCampaignService:
    """Service for automated retention email campaigns."""
    
    @staticmethod
    def send_day_3_activation_email(db: Session, user_id: UUID) -> bool:
        """Send Day 3 activation email (encourage first workflow creation)."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Check if user is already activated
        workflow_count = db.query(Workflow).filter(Workflow.user_id == user_id).count()
        if workflow_count > 0:
            return False  # User already activated
        
        # Check if email already sent
        existing = db.query(RetentionCampaign).filter(
            and_(
                RetentionCampaign.user_id == user_id,
                RetentionCampaign.campaign_type == "day_3_activation",
                RetentionCampaign.status == "sent"
            )
        ).first()
        if existing:
            return False
        
        subject = "Create Your First Workflow Automation"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                .button:hover {{ background-color: #0056b3; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Ready to Automate Your Work?</h2>
                <p>Hi {user.email.split('@')[0]},</p>
                <p>You've been using Floyo for a few days now. It's time to create your first workflow automation!</p>
                <p>Floyo learns your work patterns and suggests automations. Here's how to get started:</p>
                <ol>
                    <li>Review your pattern suggestions in the dashboard</li>
                    <li>Click "Create Workflow" on any suggestion</li>
                    <li>Customize the automation to fit your needs</li>
                </ol>
                <a href="{email_service.smtp_from_email.replace('noreply@', 'https://')}/dashboard" class="button">Create Your First Workflow</a>
                <p>Need help? Check out our <a href="#">quick start guide</a> or reply to this email.</p>
                <div class="footer">
                    <p>This is an automated message from Floyo. You're receiving this because you signed up 3 days ago.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Ready to Automate Your Work?
        
        Hi {user.email.split('@')[0]},
        
        You've been using Floyo for a few days now. It's time to create your first workflow automation!
        
        Floyo learns your work patterns and suggests automations. Here's how to get started:
        
        1. Review your pattern suggestions in the dashboard
        2. Click "Create Workflow" on any suggestion
        3. Customize the automation to fit your needs
        
        Create your first workflow: {email_service.smtp_from_email.replace('noreply@', 'https://')}/dashboard
        
        Need help? Check out our quick start guide or reply to this email.
        
        ---
        This is an automated message from Floyo. You're receiving this because you signed up 3 days ago.
        """
        
        success = email_service.send_email(user.email, subject, html_body, text_body)
        
        if success:
            # Create campaign record
            campaign = RetentionCampaign(
                user_id=user_id,
                campaign_type="day_3_activation",
                content={"subject": subject, "sent_at": datetime.utcnow().isoformat()},
                scheduled_at=datetime.utcnow(),
                status="sent"
            )
            db.add(campaign)
            db.commit()
            
            log_audit(
                db=db,
                user_id=user_id,
                action="retention_email_sent",
                resource_type="retention_campaign",
                resource_id=str(campaign.id),
                details={"campaign_type": "day_3_activation"}
            )
        
        return success
    
    @staticmethod
    def send_day_7_workflow_suggestions_email(db: Session, user_id: UUID) -> bool:
        """Send Day 7 email with personalized workflow suggestions."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Get top suggestions for user
        suggestions = db.query(Suggestion).filter(
            and_(
                Suggestion.user_id == user_id,
                Suggestion.is_dismissed == False,
                Suggestion.is_applied == False
            )
        ).order_by(Suggestion.confidence.desc()).limit(3).all()
        
        if not suggestions:
            return False  # No suggestions to send
        
        # Check if email already sent
        existing = db.query(RetentionCampaign).filter(
            and_(
                RetentionCampaign.user_id == user_id,
                RetentionCampaign.campaign_type == "day_7_suggestions",
                RetentionCampaign.status == "sent"
            )
        ).first()
        if existing:
            return False
        
        subject = "3 Workflow Automations Just for You"
        
        suggestions_html = ""
        for i, suggestion in enumerate(suggestions, 1):
            suggestions_html += f"""
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
                <h3 style="margin-top: 0;">{i}. {suggestion.title or 'Workflow Suggestion'}</h3>
                <p>{suggestion.description or 'Automate this pattern to save time.'}</p>
                <p><strong>Confidence:</strong> {suggestion.confidence * 100:.0f}%</p>
            </div>
            """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                .button:hover {{ background-color: #218838; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Workflow Suggestions Based on Your Patterns</h2>
                <p>Hi {user.email.split('@')[0]},</p>
                <p>We've analyzed your work patterns and found 3 automations that could save you time:</p>
                {suggestions_html}
                <a href="{email_service.smtp_from_email.replace('noreply@', 'https://')}/dashboard/suggestions" class="button">View All Suggestions</a>
                <p>These suggestions are personalized based on your actual usage patterns. Try them out!</p>
                <div class="footer">
                    <p>This is an automated message from Floyo. You're receiving this because you've been using Floyo for a week.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Workflow Suggestions Based on Your Patterns
        
        Hi {user.email.split('@')[0]},
        
        We've analyzed your work patterns and found 3 automations that could save you time:
        
        {chr(10).join([f"{i+1}. {s.title or 'Workflow Suggestion'}: {s.description or 'Automate this pattern.'}" for i, s in enumerate(suggestions)])}
        
        View all suggestions: {email_service.smtp_from_email.replace('noreply@', 'https://')}/dashboard/suggestions
        
        These suggestions are personalized based on your actual usage patterns. Try them out!
        
        ---
        This is an automated message from Floyo. You're receiving this because you've been using Floyo for a week.
        """
        
        success = email_service.send_email(user.email, subject, html_body, text_body)
        
        if success:
            campaign = RetentionCampaign(
                user_id=user_id,
                campaign_type="day_7_suggestions",
                content={
                    "subject": subject,
                    "suggestions_count": len(suggestions),
                    "sent_at": datetime.utcnow().isoformat()
                },
                scheduled_at=datetime.utcnow(),
                status="sent"
            )
            db.add(campaign)
            db.commit()
            
            log_audit(
                db=db,
                user_id=user_id,
                action="retention_email_sent",
                resource_type="retention_campaign",
                resource_id=str(campaign.id),
                details={"campaign_type": "day_7_suggestions"}
            )
        
        return success
    
    @staticmethod
    def send_day_14_advanced_features_email(db: Session, user_id: UUID) -> bool:
        """Send Day 14 email highlighting advanced features."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        # Check if email already sent
        existing = db.query(RetentionCampaign).filter(
            and_(
                RetentionCampaign.user_id == user_id,
                RetentionCampaign.campaign_type == "day_14_advanced",
                RetentionCampaign.status == "sent"
            )
        ).first()
        if existing:
            return False
        
        # Get user's workflow count
        workflow_count = db.query(Workflow).filter(Workflow.user_id == user_id).count()
        
        subject = "Unlock Advanced Automation Features"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #6f42c1; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                .button:hover {{ background-color: #5a32a3; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>You've Created {workflow_count} Workflow{'' if workflow_count == 1 else 's'}!</h2>
                <p>Hi {user.email.split('@')[0]},</p>
                <p>Great job! You've been automating your work with Floyo. Ready to take it to the next level?</p>
                <h3>Advanced Features to Try:</h3>
                <ul>
                    <li><strong>Workflow Scheduling:</strong> Run automations on a schedule</li>
                    <li><strong>Advanced Analytics:</strong> Track time saved and ROI</li>
                    <li><strong>Team Collaboration:</strong> Share workflows with your team</li>
                    <li><strong>API Access:</strong> Integrate Floyo into your own tools</li>
                </ul>
                <a href="{email_service.smtp_from_email.replace('noreply@', 'https://')}/dashboard" class="button">Explore Advanced Features</a>
                <p>Upgrade to Pro to unlock unlimited workflows and advanced features.</p>
                <div class="footer">
                    <p>This is an automated message from Floyo. You're receiving this because you've been using Floyo for 2 weeks.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        You've Created {workflow_count} Workflow{'' if workflow_count == 1 else 's'}!
        
        Hi {user.email.split('@')[0]},
        
        Great job! You've been automating your work with Floyo. Ready to take it to the next level?
        
        Advanced Features to Try:
        - Workflow Scheduling: Run automations on a schedule
        - Advanced Analytics: Track time saved and ROI
        - Team Collaboration: Share workflows with your team
        - API Access: Integrate Floyo into your own tools
        
        Explore advanced features: {email_service.smtp_from_email.replace('noreply@', 'https://')}/dashboard
        
        Upgrade to Pro to unlock unlimited workflows and advanced features.
        
        ---
        This is an automated message from Floyo. You're receiving this because you've been using Floyo for 2 weeks.
        """
        
        success = email_service.send_email(user.email, subject, html_body, text_body)
        
        if success:
            campaign = RetentionCampaign(
                user_id=user_id,
                campaign_type="day_14_advanced",
                content={
                    "subject": subject,
                    "workflow_count": workflow_count,
                    "sent_at": datetime.utcnow().isoformat()
                },
                scheduled_at=datetime.utcnow(),
                status="sent"
            )
            db.add(campaign)
            db.commit()
            
            log_audit(
                db=db,
                user_id=user_id,
                action="retention_email_sent",
                resource_type="retention_campaign",
                resource_id=str(campaign.id),
                details={"campaign_type": "day_14_advanced"}
            )
        
        return success
    
    @staticmethod
    def process_retention_campaigns(db: Session) -> Dict[str, Any]:
        """Process all pending retention campaigns."""
        now = datetime.utcnow()
        results = {
            "day_3_sent": 0,
            "day_7_sent": 0,
            "day_14_sent": 0,
            "errors": []
        }
        
        # Get users who signed up 3 days ago
        three_days_ago = now - timedelta(days=3)
        three_days_users = db.query(User).filter(
            and_(
                User.created_at >= three_days_ago - timedelta(hours=12),
                User.created_at <= three_days_ago + timedelta(hours=12)
            )
        ).all()
        
        for user in three_days_users:
            try:
                if RetentionCampaignService.send_day_3_activation_email(db, user.id):
                    results["day_3_sent"] += 1
            except Exception as e:
                logger.error(f"Error sending Day 3 email to {user.id}: {e}")
                results["errors"].append(f"Day 3 - {user.id}: {str(e)}")
        
        # Get users who signed up 7 days ago
        seven_days_ago = now - timedelta(days=7)
        seven_days_users = db.query(User).filter(
            and_(
                User.created_at >= seven_days_ago - timedelta(hours=12),
                User.created_at <= seven_days_ago + timedelta(hours=12)
            )
        ).all()
        
        for user in seven_days_users:
            try:
                if RetentionCampaignService.send_day_7_workflow_suggestions_email(db, user.id):
                    results["day_7_sent"] += 1
            except Exception as e:
                logger.error(f"Error sending Day 7 email to {user.id}: {e}")
                results["errors"].append(f"Day 7 - {user.id}: {str(e)}")
        
        # Get users who signed up 14 days ago
        fourteen_days_ago = now - timedelta(days=14)
        fourteen_days_users = db.query(User).filter(
            and_(
                User.created_at >= fourteen_days_ago - timedelta(hours=12),
                User.created_at <= fourteen_days_ago + timedelta(hours=12)
            )
        ).all()
        
        for user in fourteen_days_users:
            try:
                if RetentionCampaignService.send_day_14_advanced_features_email(db, user.id):
                    results["day_14_sent"] += 1
            except Exception as e:
                logger.error(f"Error sending Day 14 email to {user.id}: {e}")
                results["errors"].append(f"Day 14 - {user.id}: {str(e)}")
        
        return results
