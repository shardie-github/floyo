"""Email service for sending transactional emails (password reset, verification, etc.)."""

import os
import logging
from typing import Optional
from pathlib import Path
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

logger = logging.getLogger(__name__)


class EmailService:
    """Email service supporting SMTP and SendGrid."""
    
    def __init__(self):
        """Initialize email service from environment variables."""
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "noreply@floyo.dev")
        self.smtp_use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
        
        # SendGrid configuration
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.sendgrid_from_email = os.getenv("SENDGRID_FROM_EMAIL", self.smtp_from_email)
        
        # Determine which service to use
        self.use_sendgrid = bool(self.sendgrid_api_key)
        self.use_smtp = bool(self.smtp_host and self.smtp_username and self.smtp_password)
        
        if not self.use_sendgrid and not self.use_smtp:
            logger.warning(
                "No email service configured. Set SENDGRID_API_KEY or SMTP_* environment variables. "
                "Emails will be logged only."
            )
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """
        Send email using configured service (SendGrid or SMTP).
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
        
        Returns:
            True if email sent successfully, False otherwise
        """
        if self.use_sendgrid:
            return self._send_via_sendgrid(to_email, subject, html_body, text_body)
        elif self.use_smtp:
            return self._send_via_smtp(to_email, subject, html_body, text_body)
        else:
            # Log email in development
            logger.info(
                f"Email not sent (no service configured):\n"
                f"To: {to_email}\n"
                f"Subject: {subject}\n"
                f"Body: {text_body or html_body[:200]}..."
            )
            return False
    
    def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send email via SendGrid API."""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, Content
            
            sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
            
            from_email = Email(self.sendgrid_from_email)
            to_email_obj = Email(to_email)
            
            # Create message
            message = Mail(
                from_email=from_email,
                to_emails=to_email_obj,
                subject=subject
            )
            
            # Add content
            message.add_content(Content("text/html", html_body))
            if text_body:
                message.add_content(Content("text/plain", text_body))
            
            # Send
            response = sg.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent via SendGrid to {to_email}")
                return True
            else:
                logger.error(f"SendGrid error: {response.status_code} - {response.body}")
                return False
                
        except ImportError:
            logger.error("sendgrid package not installed. Install with: pip install sendgrid")
            return False
        except Exception as e:
            logger.error(f"Error sending email via SendGrid: {e}")
            return False
    
    def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send email via SMTP."""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.smtp_from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text and HTML parts
            if text_body:
                text_part = MIMEText(text_body, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            # Send via SMTP
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            
            if self.smtp_use_tls:
                server.starttls()
            
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent via SMTP to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending email via SMTP: {e}")
            return False
    
    def send_password_reset_email(self, to_email: str, reset_token: str, reset_url: Optional[str] = None) -> bool:
        """Send password reset email."""
        # Generate reset URL if not provided
        if not reset_url:
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            reset_url = f"{base_url}/reset-password?token={reset_token}"
        
        subject = "Reset Your Floyo Password"
        
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
                <h2>Password Reset Request</h2>
                <p>You've requested to reset your password for your Floyo account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="{reset_url}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{reset_url}">{reset_url}</a></p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                <div class="footer">
                    <p>This is an automated message from Floyo. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Password Reset Request
        
        You've requested to reset your password for your Floyo account.
        
        Click this link to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        ---
        This is an automated message from Floyo. Please do not reply to this email.
        """
        
        return self.send_email(to_email, subject, html_body, text_body)
    
    def send_email_verification_email(self, to_email: str, verification_token: str, verification_url: Optional[str] = None) -> bool:
        """Send email verification email."""
        if not verification_url:
            base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            verification_url = f"{base_url}/verify-email?token={verification_token}"
        
        subject = "Verify Your Floyo Email Address"
        
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
                <h2>Verify Your Email Address</h2>
                <p>Thank you for signing up for Floyo!</p>
                <p>Please verify your email address by clicking the button below:</p>
                <a href="{verification_url}" class="button">Verify Email</a>
                <p>Or copy and paste this link into your browser:</p>
                <p><a href="{verification_url}">{verification_url}</a></p>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <div class="footer">
                    <p>This is an automated message from Floyo. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Verify Your Email Address
        
        Thank you for signing up for Floyo!
        
        Please verify your email address by clicking this link:
        {verification_url}
        
        This link will expire in 24 hours.
        
        ---
        This is an automated message from Floyo. Please do not reply to this email.
        """
        
        return self.send_email(to_email, subject, html_body, text_body)


# Global email service instance
email_service = EmailService()
