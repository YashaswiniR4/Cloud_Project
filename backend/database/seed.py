"""
Database Seeder Script for Production & Demonstration Environments.
Populates PostgreSQL / Supabase / SQLite database with realistic security events,
alerts, threat intel, honeypot traps, and audit logs.
"""

from datetime import datetime, timezone
from backend.database.database import init_db, SessionLocal
from backend.database import crud
from config.logging_config import logger


def seed_database():
    """Initializes schema and populates sample security telemetry data."""
    init_db()
    db = SessionLocal()

    try:
        logger.info("Seeding production database with baseline demonstration security events...")

        # 1. CloudTrail Telemetry Events
        events_data = [
            {
                "event_id": "ct-seed-101",
                "event_name": "AttachUserPolicy",
                "event_source": "iam.amazonaws.com",
                "source_ip": "198.51.100.45",
                "user_arn": "arn:aws:iam::123456789012:user/rogue_admin",
                "error_code": None,
                "threat_score": 95.0,
                "severity": "HIGH",
                "is_high_risk": True,
                "ml_classification": {"prediction": "IAM_PRIVILEGE_ESCALATION", "confidence": 0.98},
                "ml_anomaly_score": {"is_zero_day_anomaly": True, "anomaly_score": 0.89},
                "ml_xai": {"human_readable_explanations": ["High-risk API call AttachUserPolicy executed by unmapped IP."]}
            },
            {
                "event_id": "ct-seed-102",
                "event_name": "AuthorizeSecurityGroupIngress",
                "event_source": "ec2.amazonaws.com",
                "source_ip": "203.0.113.99",
                "user_arn": "arn:aws:iam::123456789012:user/devops_user",
                "error_code": None,
                "threat_score": 75.0,
                "severity": "HIGH",
                "is_high_risk": True,
                "ml_classification": {"prediction": "NET_INGRESS_EXPOSURE", "confidence": 0.91},
                "ml_anomaly_score": {"is_zero_day_anomaly": False, "anomaly_score": 0.42},
                "ml_xai": {"human_readable_explanations": ["Security Group 0.0.0.0/0 ingress authorization."]}
            },
            {
                "event_id": "ct-seed-103",
                "event_name": "DescribeInstances",
                "event_source": "ec2.amazonaws.com",
                "source_ip": "192.0.2.14",
                "user_arn": "arn:aws:iam::123456789012:user/read_only",
                "error_code": None,
                "threat_score": 10.0,
                "severity": "LOW",
                "is_high_risk": False,
                "ml_classification": {"prediction": "NORMAL_OPERATIONS", "confidence": 0.99},
                "ml_anomaly_score": {"is_zero_day_anomaly": False, "anomaly_score": 0.05},
                "ml_xai": {"human_readable_explanations": ["Standard operational read-only query."]}
            }
        ]

        for evt in events_data:
            crud.create_event(db, evt)

        # 2. Threat Intelligence Indicators
        threats = [
            {"source_ip": "198.51.100.45", "threat_score": 95.0, "category": "MALICIOUS_BOTNET", "isp": "BadActor Subnet Hosting"},
            {"source_ip": "203.0.113.99", "threat_score": 80.0, "category": "RECON_SCANNER", "isp": "ShadowNet Hosting Ltd"},
            {"source_ip": "198.51.100.99", "threat_score": 90.0, "category": "SSH_BRUTE_FORCE", "isp": "BruteForce Automation Group"}
        ]
        for t in threats:
            crud.upsert_threat_intel(db, t["source_ip"], t)

        # 3. Dispatched SNS Alerts
        alerts = [
            {
                "alert_id": "alt-seed-001",
                "severity": "HIGH",
                "event_name": "AttachUserPolicy",
                "source_ip": "198.51.100.45",
                "threat_score": 95.0,
                "sns_topic_arn": "arn:aws:sns:us-east-1:123456789012:SOCAlertsTopic",
                "message": "🚨 [ALERT - HIGH] IAM Privilege Escalation detected from 198.51.100.45",
                "status": "DELIVERED"
            }
        ]
        for a in alerts:
            crud.create_alert(db, a)

        # 4. Honeypot Traps
        crud.create_honeypot_log(db, {
            "honeypot_type": "SSH",
            "source_ip": "198.51.100.99",
            "target_user_or_path": "root",
            "payload_or_password": "toor",
            "threat_score": 90.0
        })

        crud.create_honeypot_log(db, {
            "honeypot_type": "HTTP",
            "source_ip": "203.0.113.88",
            "target_user_or_path": "/admin/login",
            "payload_or_password": "' OR '1'='1",
            "threat_score": 85.0
        })

        # 5. Serverless Remediation
        crud.create_remediation_action(
            db,
            action_type="SECURITY_GROUP_ISOLATION",
            target="198.51.100.45",
            actions=["Revoked Ingress Rules for 198.51.100.45", "Disabled AWS Access Key AKIAIOSFODNN7EXAMPLE"]
        )

        # 6. Audit Vault Logs
        crud.create_audit_log(
            db,
            log_id="audit-seed-001",
            bucket="threat-intel-worm-audit-vault",
            sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )

        logger.info("Database seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
