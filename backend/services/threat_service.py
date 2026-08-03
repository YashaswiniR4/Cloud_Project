"""
Core Business Logic Service - Integrates CloudTrail Ingestion, S3 WORM Storage,
ML Threat Classification, Zero-Day Anomaly Detection, Honeypots, and Alert Dispatching.
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


class ThreatOperationsService:
    """Central Security Operations Center Service Manager."""

    def __init__(self):
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

        # Initialize Services
        self.ssh_honeypot.start_honeypot()
        self.http_honeypot.start_honeypot()

        self.all_threat_logs: List[Dict[str, Any]] = []
        self.dispatched_alerts: List[Dict[str, Any]] = []

        logger.info("Threat Operations Service fully initialized.")

    def process_cloudtrail_batch(self, batch_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Ingests CloudTrail events, scores threats via ML, and dispatches alerts."""
        parsed_events = self.pipeline.ingest_raw_payload(batch_payload)

        high_risk_count = 0
        for event in parsed_events:
            # Feature extraction & ML scoring
            features = self.feature_extractor.extract_features(event)
            classification = self.classifier.classify_log(event)
            anomaly = self.anomaly_detector.detect(features)
            explanation = self.xai_explainer.calculate_shap_values(features, classification["prediction"])

            event["ml_classification"] = classification
            event["ml_anomaly_score"] = anomaly
            event["ml_xai"] = explanation

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
                self.dispatched_alerts.append(alert)

                # Execute Remediation if Critical
                if event["severity"] == "HIGH":
                    self.remediation_handler.revoke_security_group_ingress(event["source_ip"])
                    self.remediation_handler.disable_compromised_iam_keys(event["user_arn"])

        return {
            "processed_count": len(parsed_events),
            "high_risk_count": high_risk_count,
            "events": parsed_events
        }

    def simulate_ssh_attack(self, source_ip: str, username: str, password: str) -> Dict[str, Any]:
        """Simulates SSH attack against Cowrie/SSH honeypot trap."""
        telemetry = self.ssh_honeypot.simulate_attack_attempt(source_ip, username, password)

        # Threat Intel Lookup
        reputation = self.threat_intel.check_ip_reputation(source_ip)
        telemetry["threat_intel"] = reputation

        self.all_threat_logs.append(telemetry)

        # Alerting
        alert = self.alert_dispatcher.dispatch_alert({
            "severity": "HIGH",
            "source_ip": source_ip,
            "event_name": "SSH_BRUTE_FORCE",
            "threat_score": telemetry["threat_score"]
        })
        self.dispatched_alerts.append(alert)

        return telemetry

    def simulate_http_attack(self, source_ip: str, path: str, method: str, payload: str) -> Dict[str, Any]:
        """Simulates web attack against HTTP honeypot trap."""
        result = self.http_honeypot.handle_request(source_ip, path, method, payload=payload)
        telemetry = result["telemetry_recorded"]

        # Threat Intel Lookup
        reputation = self.threat_intel.check_ip_reputation(source_ip)
        telemetry["threat_intel"] = reputation

        self.all_threat_logs.append(telemetry)

        if telemetry["threat_score"] > 70.0:
            alert = self.alert_dispatcher.dispatch_alert({
                "severity": "HIGH",
                "source_ip": source_ip,
                "event_name": telemetry["threat_type"],
                "threat_score": telemetry["threat_score"]
            })
            self.dispatched_alerts.append(alert)

        return result

    def get_metrics(self) -> Dict[str, Any]:
        """Returns consolidated SOC metrics."""
        return {
            "total_ingested_events": self.pipeline.total_ingested + len(self.ssh_honeypot.get_captured_telemetry()) + len(self.http_honeypot.get_captured_telemetry()),
            "high_risk_threats": self.pipeline.total_high_risk,
            "anomalies_detected": len([e for e in self.all_threat_logs if e.get("ml_anomaly_score", {}).get("is_zero_day_anomaly", False)]),
            "alerts_dispatched": len(self.dispatched_alerts),
            "honeypot_attacks_captured": len(self.ssh_honeypot.get_captured_telemetry()) + len(self.http_honeypot.get_captured_telemetry()),
            "worm_audit_logs_count": len(self.vault.audit_logs)
        }

    def get_dashboard_summary(self) -> Dict[str, Any]:
        """Returns complete SOC dashboard payload."""
        return {
            "system_status": "HEALTHY",
            "metrics": self.get_metrics(),
            "recent_threats": self.all_threat_logs[-10:],
            "recent_alerts": self.dispatched_alerts[-10:],
            "honeypot_summary": {
                "ssh_honeypot_active": self.ssh_honeypot.is_active,
                "ssh_logs_count": len(self.ssh_honeypot.get_captured_telemetry()),
                "http_honeypot_active": self.http_honeypot.is_active,
                "http_logs_count": len(self.http_honeypot.get_captured_telemetry())
            }
        }


# Global singleton instance for FastAPI dependency injection
threat_ops_service = ThreatOperationsService()
