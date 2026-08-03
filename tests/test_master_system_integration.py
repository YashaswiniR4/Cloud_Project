"""
Master End-to-End System Integration Test Suite
Validates complete pipeline execution across all platform modules.
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from aws.s3_worm_vault import S3WORMVaultManager
from aws.cloudtrail_ingestor import CloudTrailIngestor
from backend.honeypots.ssh_honeypot import SSHHoneypotEngine
from backend.honeypots.http_honeypot import HTTPHoneypotEngine
from ml.feature_extractor import TelemetryFeatureExtractor
from ml.threat_classifier import CyberThreatClassifier
from ml.anomaly_detector import ZeroDayAnomalyDetector
from ml.xai_explainability import ThreatExplainabilityEngine
from backend.threat_intel import ThreatIntelFeedManager
from aws.lambda_remediation import LambdaRemediationHandler
from backend.alerting import IncidentAlertDispatcher


class TestMasterSystemIntegration(unittest.TestCase):
    def test_end_to_end_threat_pipeline(self):
        # 1. Telemetry Ingestion
        ingestor = CloudTrailIngestor()
        raw_cloudtrail = {
            "Records": [
                {
                    "eventID": "master-ev-99",
                    "eventTime": "2026-08-03T17:00:00Z",
                    "eventSource": "iam.amazonaws.com",
                    "eventName": "AttachUserPolicy",
                    "sourceIPAddress": "198.51.100.45",
                    "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123456789012:user/attacker"}
                }
            ]
        }
        parsed = ingestor.ingest_log_batch(raw_cloudtrail)
        self.assertEqual(len(parsed), 1)
        event = parsed[0]

        # 2. Machine Learning Feature Extraction & Threat Classification
        classifier = CyberThreatClassifier()
        ml_res = classifier.classify_log(event)
        self.assertEqual(ml_res["prediction"], "IAM_PRIVILEGE_ESCALATION")

        # 3. Anomaly Detection
        detector = ZeroDayAnomalyDetector()
        anomaly_res = detector.detect(ml_res["feature_vector"])
        self.assertIn("anomaly_score", anomaly_res)

        # 4. XAI Feature Attribution
        xai = ThreatExplainabilityEngine()
        shap_res = xai.calculate_shap_values(ml_res["feature_vector"], ml_res["prediction"])
        self.assertEqual(shap_res["prediction_label"], "IAM_PRIVILEGE_ESCALATION")

        # 5. S3 WORM Vault Storage
        vault = S3WORMVaultManager()
        vault_res = vault.put_immutable_log(f"audit/{event['event_id']}.json", event)
        self.assertEqual(vault_res["status"], "SUCCESS")

        # 6. Threat Intel Lookup
        intel = ThreatIntelFeedManager()
        intel_res = intel.check_ip_reputation(event["source_ip"])
        self.assertTrue(intel_res["is_known_attacker"])

        # 7. Automated Serverless Remediation
        remediator = LambdaRemediationHandler()
        remedy_res = remediator.execute_remediation({
            "source_ip": event["source_ip"],
            "threat_score": event["threat_score"],
            "user_arn": event["user_arn"]
        })
        self.assertEqual(remedy_res["status"], "REMEDIATED")

        # 8. Alert Notification Dispatch
        dispatcher = IncidentAlertDispatcher()
        alert_res = dispatcher.dispatch_alert({
            "severity": event["severity"],
            "source_ip": event["source_ip"],
            "event_name": event["event_name"],
            "threat_score": event["threat_score"]
        })
        self.assertEqual(alert_res["status"], "DELIVERED")


if __name__ == "__main__":
    unittest.main()
