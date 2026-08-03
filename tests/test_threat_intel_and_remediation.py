"""
Unit tests for Sprint 6: Threat Intel, Remediation & Alerting
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.threat_intel import ThreatIntelFeedManager
from aws.lambda_remediation import LambdaRemediationHandler
from backend.alerting import IncidentAlertDispatcher


class TestSprint6IntelAndRemediation(unittest.TestCase):
    def test_threat_intel_lookup(self):
        intel = ThreatIntelFeedManager()
        bad_ip_info = intel.check_ip_reputation("198.51.100.45")
        self.assertTrue(bad_ip_info["is_known_attacker"])
        self.assertEqual(bad_ip_info["action_recommended"], "BLOCK_IMMEDIATELY")

        good_ip_info = intel.check_ip_reputation("8.8.8.8")
        self.assertFalse(good_ip_info["is_known_attacker"])

    def test_lambda_remediation(self):
        remediator = LambdaRemediationHandler()
        event = {
            "source_ip": "198.51.100.45",
            "threat_score": 95.0,
            "user_arn": "arn:aws:iam::123:user/attacker"
        }
        res = remediator.execute_remediation(event)
        self.assertEqual(res["status"], "REMEDIATED")
        self.assertIn("198.51.100.45", remediator.blocked_ips)

    def test_alert_dispatch(self):
        dispatcher = IncidentAlertDispatcher()
        res = dispatcher.dispatch_alert({
            "severity": "CRITICAL",
            "source_ip": "198.51.100.45",
            "event_name": "UnauthorizedS3Access",
            "threat_score": 90.0
        })
        self.assertEqual(res["status"], "DELIVERED")
        self.assertIn("198.51.100.45", res["message"])


if __name__ == "__main__":
    unittest.main()
