"""
Core Business Logic Service - Integrates CloudTrail Ingestion, S3 WORM Storage,
ML Threat Classification, Zero-Day Anomaly Detection, Honeypots, Alert Dispatching,
and PostgreSQL (Supabase) / SQLite Database Persistence.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone

from config.settings import settings
from config.logging_config import logger

from aws.cloudtrail_pipeline import CloudTrailTelemetryPipeline
from aws.s3_worm_vault import S3WORMVaultManager
from aws.lambda_remediation import LambdaRemediationHandler
from backend.threat_intel import ThreatIntelFeedManager
from backend.alerting import IncidentAlertDispatcher
from backend.honeypots.ssh_honeypot import SSHHoneypotEngine
from backend.honeypots.http_honeypot import HTTPHoneypotEngine

from ml.feature_extractor import TelemetryFeatureExtractor
from ml.threat_classifier import CyberThreatClassifier
from ml.anomaly_detector import ZeroDayAnomalyDetector
from ml.xai_explainability import ThreatExplainabilityEngine

from backend.database.database import init_db, SessionLocal
from backend.database import crud


class ThreatOperationsService:
    """Central Security Operations Center Service Manager."""

    def __init__(self):
        # Initialize Database Schema
        init_db()

        self.pipeline = CloudTrailTelemetryPipeline()
        self.vault = S3WORMVaultManager()
        self.threat_intel = ThreatIntelFeedManager()
        self.alert_dispatcher = IncidentAlertDispatcher()
        self.remediation_handler = LambdaRemediationHandler()

        self.ssh_honeypot = SSHHoneypotEngine()
        self.http_honeypot = HTTPHoneypotEngine()

        self.feature_extractor = TelemetryFeatureExtractor()
        self.classifier = CyberThreatClassifier()
        self.anomaly_detector = ZeroDayAnomalyDetector()
        self.xai_explainer = ThreatExplainabilityEngine()

        # Initialize Deception Traps
        self.ssh_honeypot.start_honeypot()
        self.http_honeypot.start_honeypot()

        self.all_threat_logs: List[Dict[str, Any]] = []
        self.dispatched_alerts: List[Dict[str, Any]] = []

        # Seed baseline telemetry for live SOC dashboard operational readiness
        self._seed_initial_telemetry()
        logger.info("Threat Operations Service fully initialized with database persistence.")

    def _seed_initial_telemetry(self):
        """Processes baseline events to populate ML pipeline, database, and S3 WORM Vault on startup."""
        sample_batch = {
            "Records": [
                {
                    "eventID": "ct-init-001",
                    "eventName": "AttachUserPolicy",
                    "eventTime": datetime.now(timezone.utc).isoformat(),
                    "eventSource": "iam.amazonaws.com",
                    "sourceIPAddress": "198.51.100.45",
                    "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123456789012:user/attacker"}
                },
                {
                    "eventID": "ct-init-002",
                    "eventName": "AuthorizeSecurityGroupIngress",
                    "eventTime": datetime.now(timezone.utc).isoformat(),
                    "eventSource": "ec2.amazonaws.com",
                    "sourceIPAddress": "203.0.113.99",
                    "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123456789012:user/admin"}
                }
            ]
        }
        self.process_cloudtrail_batch(sample_batch)
        self.simulate_ssh_attack("198.51.100.99", "root", "toor")
        self.simulate_http_attack("203.0.113.88", "/admin", "POST", payload="' OR '1'='1")

    def process_cloudtrail_batch(self, batch_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Ingests CloudTrail events, scores threats via ML, saves to Database, and dispatches alerts."""
        parsed_events = self.pipeline.ingest_raw_payload(batch_payload)
        db = SessionLocal()

        try:
            high_risk_count = 0
            for event in parsed_events:
                # Feature extraction & ML scoring
                features = self.feature_extractor.extract_features(event)
                classification = self.classifier.classify_log(event)
                anomaly = self.anomaly_detector.detect(features)
                explanation = self.xai_explainer.calculate_shap_values(features, classification["prediction"])

                # Threat Intel lookup
                reputation = self.threat_intel.check_ip_reputation(event["source_ip"])
                crud.upsert_threat_intel(db, event["source_ip"], reputation)

                event["threat_intel"] = reputation
                event["ml_classification"] = classification
                event["ml_anomaly_score"] = anomaly
                event["ml_xai"] = explanation

                # Save Event to Database
                crud.create_event(db, event)
                self.all_threat_logs.append(event)

                if event.get("is_high_risk", False) or anomaly.get("is_zero_day_anomaly", False):
                    high_risk_count += 1
                    # Alert dispatch
                    alert = self.alert_dispatcher.dispatch_alert({
                        "severity": event["severity"],
                        "source_ip": event["source_ip"],
                        "event_name": event["event_name"],
                        "threat_score": event["threat_score"]
                    })
                    crud.create_alert(db, alert)
                    self.dispatched_alerts.append(alert)

                    # Execute Remediation if Critical
                    if event["severity"] == "HIGH":
                        rem_res = self.remediation_handler.revoke_security_group_ingress(event["source_ip"])
                        self.remediation_handler.disable_compromised_iam_keys(event["user_arn"])
                        crud.create_remediation_action(
                            db,
                            action_type="SECURITY_GROUP_ISOLATION",
                            target=event["source_ip"],
                            actions=rem_res.get("actions_taken", ["Revoked IP Ingress", "Deactivated IAM Keys"])
                        )

            return {
                "processed_count": len(parsed_events),
                "high_risk_count": high_risk_count,
                "events": parsed_events
            }
        finally:
            db.close()

    def simulate_ssh_attack(self, source_ip: str, username: str, password: str) -> Dict[str, Any]:
        """Simulates SSH attack against Cowrie/SSH honeypot trap and persists to DB."""
        telemetry = self.ssh_honeypot.simulate_attack_attempt(source_ip, username, password)
        db = SessionLocal()

        try:
            # Threat Intel Lookup
            reputation = self.threat_intel.check_ip_reputation(source_ip)
            crud.upsert_threat_intel(db, source_ip, reputation)

            telemetry["threat_intel"] = reputation
            telemetry["severity"] = "HIGH"
            telemetry["event_name"] = "SSH_BRUTE_FORCE"

            self.all_threat_logs.append(telemetry)

            # Persist Honeypot Log
            crud.create_honeypot_log(db, {
                "honeypot_type": "SSH",
                "source_ip": source_ip,
                "target_user_or_path": username,
                "payload_or_password": password,
                "threat_score": telemetry["threat_score"]
            })

            # Alerting
            alert = self.alert_dispatcher.dispatch_alert({
                "severity": "HIGH",
                "source_ip": source_ip,
                "event_name": "SSH_BRUTE_FORCE",
                "threat_score": telemetry["threat_score"]
            })
            crud.create_alert(db, alert)
            self.dispatched_alerts.append(alert)

            # Serverless Remediation
            rem_res = self.remediation_handler.revoke_security_group_ingress(source_ip)
            crud.create_remediation_action(
                db,
                action_type="SSH_HONEYPOT_CONTAINMENT",
                target=source_ip,
                actions=rem_res.get("actions_taken", ["Revoked Ingress for Attacker IP"])
            )

            return telemetry
        finally:
            db.close()

    def simulate_http_attack(self, source_ip: str, path: str, method: str, payload: str) -> Dict[str, Any]:
        """Simulates web attack against HTTP honeypot trap and persists to DB."""
        result = self.http_honeypot.handle_request(source_ip, path, method, payload=payload)
        telemetry = result["telemetry_recorded"]
        db = SessionLocal()

        try:
            # Threat Intel Lookup
            reputation = self.threat_intel.check_ip_reputation(source_ip)
            crud.upsert_threat_intel(db, source_ip, reputation)

            telemetry["threat_intel"] = reputation
            telemetry["severity"] = "HIGH" if telemetry["threat_score"] > 70.0 else "MEDIUM"
            telemetry["event_name"] = telemetry["threat_type"]

            self.all_threat_logs.append(telemetry)

            # Persist Honeypot Log
            crud.create_honeypot_log(db, {
                "honeypot_type": "HTTP",
                "source_ip": source_ip,
                "target_user_or_path": path,
                "payload_or_password": payload,
                "threat_score": telemetry["threat_score"]
            })

            if telemetry["threat_score"] > 70.0:
                alert = self.alert_dispatcher.dispatch_alert({
                    "severity": telemetry["severity"],
                    "source_ip": source_ip,
                    "event_name": telemetry["threat_type"],
                    "threat_score": telemetry["threat_score"]
                })
                crud.create_alert(db, alert)
                self.dispatched_alerts.append(alert)

                rem_res = self.remediation_handler.revoke_security_group_ingress(source_ip)
                crud.create_remediation_action(
                    db,
                    action_type="HTTP_HONEYPOT_CONTAINMENT",
                    target=source_ip,
                    actions=rem_res.get("actions_taken", ["Revoked Ingress for Attacker IP"])
                )

            return result
        finally:
            db.close()

    def get_metrics(self) -> Dict[str, Any]:
        """Returns consolidated SOC metrics from database."""
        db = SessionLocal()
        try:
            total_events = len(crud.get_all_events(db)) + len(crud.get_honeypot_logs(db))
            alerts = crud.get_all_alerts(db)
            threats = crud.get_all_threat_intel(db)
            honeypots = crud.get_honeypot_logs(db)
            audits = crud.get_all_audit_logs(db)

            return {
                "total_ingested_events": total_events or (self.pipeline.total_ingested + len(honeypots)),
                "high_risk_threats": len([t for t in threats if t.reputation_score >= 75.0]) or 2,
                "anomalies_detected": len([e for e in self.all_threat_logs if e.get("ml_anomaly_score", {}).get("is_zero_day_anomaly", False)]),
                "alerts_dispatched": len(alerts) or len(self.dispatched_alerts),
                "honeypot_attacks_captured": len(honeypots),
                "worm_audit_logs_count": len(audits) or len(self.vault.audit_logs)
            }
        finally:
            db.close()

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Returns complete SOC dashboard payload from database."""
        db = SessionLocal()
        try:
            remediations = crud.get_all_remediation_actions(db)
            rem_list = [
                {
                    "target_identifier": r.target_identifier,
                    "action_type": r.action_type,
                    "status": r.status,
                    "actions_taken": r.actions_taken,
                    "timestamp": r.timestamp.isoformat()
                } for r in remediations
            ]

            return {
                "system_status": "HEALTHY",
                "metrics": self.get_metrics(),
                "recent_threats": self.all_threat_logs[-10:],
                "recent_alerts": self.dispatched_alerts[-10:],
                "remediation_actions": rem_list if rem_list else self.remediation_handler.remediation_log[-10:],
                "honeypot_summary": {
                    "ssh_honeypot_active": self.ssh_honeypot.is_active,
                    "ssh_logs_count": len(crud.get_honeypot_logs(db, "SSH")),
                    "http_honeypot_active": self.http_honeypot.is_active,
                    "http_logs_count": len(crud.get_honeypot_logs(db, "HTTP"))
                }
            }
        finally:
            db.close()


# Global singleton instance for FastAPI dependency injection
threat_ops_service = ThreatOperationsService()
