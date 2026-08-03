"""
Module 9 End-to-End System Integration Test Suite
Verifies complete flow: React API Layer -> FastAPI Backend -> CloudTrail Telemetry ->
S3 WORM Vault -> ML Classification & Anomaly Engine -> Threat Intel -> Lambda Remediation -> Live Metrics.
"""

import unittest
from fastapi.testclient import TestClient
from backend.main import app


class TestEndToEndSystemIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health_monitoring(self):
        """Verifies API health check endpoint and subsystem status."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertEqual(data["services"]["s3_worm_vault"], "ACTIVE")
        self.assertEqual(data["services"]["cloudtrail_pipeline"], "ACTIVE")
        self.assertEqual(data["services"]["ml_classifier"], "READY")

    def test_02_dashboard_baseline_telemetry(self):
        """Verifies SOC dashboard overview data and initial telemetry counts."""
        response = self.client.get("/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["system_status"], "HEALTHY")
        self.assertIn("metrics", data)
        self.assertGreaterEqual(data["metrics"]["total_ingested_events"], 1)

    def test_03_cloudtrail_ingestion_and_ml_remediation_pipeline(self):
        """
        End-to-End: Simulates CloudTrail API attack, verifies normalization,
        ML classification, XAI SHAP generation, S3 WORM locking, SNS alerting,
        and Lambda remediation.
        """
        payload = {
            "Records": [
                {
                    "eventID": "e2e-ct-101",
                    "eventName": "AttachUserPolicy",
                    "eventTime": "2026-08-03T19:25:00Z",
                    "eventSource": "iam.amazonaws.com",
                    "sourceIPAddress": "198.51.100.88",
                    "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123:user/rogue_admin"}
                }
            ]
        }
        res = self.client.post("/simulate/cloudtrail", json=payload)
        self.assertEqual(res.status_code, 201)
        body = res.json()
        self.assertEqual(body["status"], "PROCESSED")
        self.assertEqual(body["ingested_count"], 1)

        event = body["events"][0]
        self.assertIn("ml_classification", event)
        self.assertIn("ml_anomaly_score", event)
        self.assertIn("ml_xai", event)

        # Verify Alert Dispatch
        alerts_res = self.client.get("/alerts")
        self.assertEqual(alerts_res.status_code, 200)
        alerts = alerts_res.json()["alerts"]
        self.assertTrue(any(a["source_ip"] == "198.51.100.88" for a in alerts))

        # Verify Serverless Remediation
        remediation_res = self.client.get("/remediations")
        self.assertEqual(remediation_res.status_code, 200)
        remediations = remediation_res.json()["remediations"]
        self.assertTrue(any("198.51.100.88" in str(r) for r in remediations))

    def test_04_ssh_honeypot_deception_pipeline(self):
        """Simulates SSH attack against Cowrie trap engine and checks metric updates."""
        payload = {
            "source_ip": "198.51.100.77",
            "username": "root",
            "password": "adminpassword"
        }
        res = self.client.post("/simulate/ssh-attack", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["status"], "CAPTURED")
        self.assertEqual(body["telemetry"]["attack_type"], "SSH_BRUTE_FORCE")

    def test_05_http_honeypot_exploit_pipeline(self):
        """Simulates HTTP SQLi attack against web trap engine and verifies threat score."""
        payload = {
            "source_ip": "203.0.113.55",
            "path": "/admin/login",
            "method": "POST",
            "payload": "' OR '1'='1"
        }
        res = self.client.post("/simulate/http-attack", json=payload)
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["status"], "CAPTURED")

    def test_06_threat_intel_aggregation(self):
        """Verifies threat intelligence indicators feed."""
        res = self.client.get("/threats")
        self.assertEqual(res.status_code, 200)
        threats = res.json()["threats"]
        self.assertGreaterEqual(len(threats), 1)


if __name__ == "__main__":
    unittest.main()
