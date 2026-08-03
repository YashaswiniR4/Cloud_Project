"""
Integration tests for Module 7: FastAPI Security Operations Center Backend
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.main import app


class TestModule7FastAPIBackend(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertIn("services", data)

    def test_metrics_endpoint(self):
        response = self.client.get("/metrics")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_ingested_events", data)
        self.assertIn("high_risk_threats", data)

    def test_dashboard_endpoint(self):
        response = self.client.get("/dashboard")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["system_status"], "HEALTHY")
        self.assertIn("metrics", data)

    def test_simulate_cloudtrail_endpoint(self):
        payload = {
            "Records": [
                {
                    "eventID": "api-test-01",
                    "eventName": "AttachUserPolicy",
                    "eventTime": "2026-08-03T18:00:00Z",
                    "eventSource": "iam.amazonaws.com",
                    "sourceIPAddress": "198.51.100.45",
                    "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123:user/attacker"}
                }
            ]
        }
        response = self.client.post("/simulate/cloudtrail", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["status"], "PROCESSED")
        self.assertGreater(data["high_risk_count"], 0)

    def test_simulate_ssh_attack_endpoint(self):
        payload = {
            "source_ip": "198.51.100.99",
            "username": "root",
            "password": "supersecretpassword"
        }
        response = self.client.post("/simulate/ssh-attack", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "CAPTURED")
        self.assertEqual(data["telemetry"]["username"], "root")

    def test_simulate_http_attack_endpoint(self):
        payload = {
            "source_ip": "203.0.113.88",
            "path": "/admin",
            "method": "POST",
            "payload": "' OR '1'='1"
        }
        response = self.client.post("/simulate/http-attack", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "CAPTURED")
        self.assertEqual(data["result"]["telemetry_recorded"]["threat_type"], "SQL_INJECTION")

    def test_logs_alerts_threats_endpoints(self):
        res_logs = self.client.get("/logs")
        self.assertEqual(res_logs.status_code, 200)

        res_alerts = self.client.get("/alerts")
        self.assertEqual(res_alerts.status_code, 200)

        res_threats = self.client.get("/threats")
        self.assertEqual(res_threats.status_code, 200)


if __name__ == "__main__":
    unittest.main()
