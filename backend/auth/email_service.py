"""
Enterprise Email & OTP Verification Service
Generates secure 6-digit OTP tokens and dispatches emails via SMTP with comprehensive logging and error reporting.
"""

import os
import secrets
import smtplib
from typing import Dict, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from config.settings import settings
from config.logging_config import logger


def generate_otp_code() -> str:
    """Generates a secure 6-digit numeric OTP string."""
    code = secrets.randbelow(900000) + 100000
    otp_str = str(code)
    logger.info(f"OTP generated: {otp_str}")
    return otp_str


def send_verification_otp_email(to_email: str, otp_code: str) -> Dict[str, Any]:
    """
    Dispatches 6-digit OTP verification code to target email address via SMTP.
    Provides detailed logging and returns success status or exact error details.
    """
    logger.info(f"OTP generated: {otp_code} for recipient: {to_email}")

    smtp_host = settings.SMTP_HOST or os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = settings.SMTP_PORT or int(os.getenv("SMTP_PORT", "587"))
    smtp_user = settings.SMTP_USER or os.getenv("SMTP_USER", "")
    smtp_password = settings.SMTP_PASSWORD or os.getenv("SMTP_PASSWORD", "")
    smtp_from = settings.SMTP_FROM_EMAIL or os.getenv("SMTP_FROM_EMAIL", smtp_user or "noreply@cloudsoc.io")
    smtp_use_ssl = settings.SMTP_USE_SSL or (smtp_port == 465)

    # Check for SMTP credentials
    if not smtp_user or not smtp_password:
        err_msg = "SMTP_USER or SMTP_PASSWORD is not configured in .env file."
        logger.error(f"Email sending failed: {err_msg}")

        # If running unit tests or in development without credentials, log OTP to console
        if settings.ENV in ("testing", "development") or os.getenv("TESTING", "false").lower() in ("true", "1"):
            logger.warning(f"⚠️ [DEVELOPMENT LOG MOCK] Destination: {to_email} | OTP: {otp_code}")
            return {
                "success": True,
                "message": f"[Dev Mode] Verification OTP {otp_code} logged to console."
            }

        return {
            "success": False,
            "error": err_msg
        }

    logger.info(f"Sending email to {to_email} via SMTP server {smtp_host}:{smtp_port}...")

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Cloud SOC - Your 6-Digit Verification Code: {otp_code}"
        msg["From"] = smtp_from
        msg["To"] = to_email

        text_content = f"Your Cloud SOC Analyst Verification Code is: {otp_code}\n\nThis code will expire in 5 minutes."
        html_content = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0b0f19; color: #ffffff;">
            <h2 style="color: #3b82f6;">Autonomous Cloud SOC Portal</h2>
            <p>Welcome! Please use the following 6-digit code to verify your analyst email address:</p>
            <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #10b981; margin: 20px 0;">
                {otp_code}
            </div>
            <p style="font-size: 12px; color: #94a3b8;">This verification code will expire in 5 minutes.</p>
        </div>
        """

        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Connection handling: SSL vs STARTTLS
        if smtp_use_ssl or smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()

        with server:
            server.login(smtp_user, smtp_password)
            logger.info(f"SMTP authentication successful for {smtp_user}")
            server.send_message(msg)

        logger.info(f"Email sent successfully to {to_email}")
        return {
            "success": True,
            "message": f"Verification email successfully delivered to {to_email}"
        }

    except smtplib.SMTPAuthenticationError as e:
        err_msg = f"SMTP authentication failed for user '{smtp_user}'. Please check credentials or Gmail App Password. Exact Error: {e.smtp_error.decode() if isinstance(e.smtp_error, bytes) else e.smtp_error}"
        logger.error(f"Email sending failed: {err_msg}")
        return {"success": False, "error": err_msg}

    except smtplib.SMTPException as e:
        err_msg = f"SMTP protocol error: {e}"
        logger.error(f"Email sending failed: {err_msg}")
        return {"success": False, "error": err_msg}

    except Exception as e:
        err_msg = f"Unexpected SMTP error: {str(e)}"
        logger.error(f"Email sending failed: {err_msg}", exc_info=True)
        return {"success": False, "error": err_msg}
