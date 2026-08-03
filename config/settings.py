"""
Centralized Application Settings & Environment Config Manager
"""

import os
from dataclasses import dataclass


@dataclass
class Settings:
    ENV: str = os.getenv("ENV", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Database Settings (PostgreSQL / Supabase / SQLite fallback)
    _DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./threat_intel.db")

    @property
    def DATABASE_URL(self) -> str:
        url = self._DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url

    # AWS Config
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_WORM_BUCKET_NAME: str = os.getenv("S3_WORM_BUCKET_NAME", "threat-intel-worm-audit-vault")
    KMS_KEY_ARN: str = os.getenv("KMS_KEY_ARN", "arn:aws:kms:us-east-1:123456789012:key/worm-audit-key")
    SNS_TOPIC_ARN: str = os.getenv("SNS_TOPIC_ARN", "arn:aws:sns:us-east-1:123456789012:SOCAlertsTopic")

    # Threat Intel API Keys
    ABUSEIPDB_API_KEY: str = os.getenv("ABUSEIPDB_API_KEY", "")

    # Honeypot Ports
    SSH_HONEYPOT_PORT: int = int(os.getenv("SSH_HONEYPOT_PORT", "2222"))
    HTTP_HONEYPOT_PORT: int = int(os.getenv("HTTP_HONEYPOT_PORT", "8080"))


settings = Settings()
