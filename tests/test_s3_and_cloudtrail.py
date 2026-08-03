"""
Unit tests for Sprint 2: S3 WORM Vault & CloudTrail Ingestor
Uses Python standard unittest library.
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from aws.s3_worm_vault import S3WORMVaultManager
from aws.cloudtrail_ingestor import CloudTrailIngestor


class TestSprint2S3AndCloudTrail(unittest.TestCase):
    def test_s3_worm_immutability(self):
        vault = S3WORMVaultManager(bucket_name="test-vault")
        log_key = "logs/test_event.json"
        data = {"event": "TestAccessDenied", "source_ip": "10.0.0.1"}

        # Store immutable log
        res = vault.put_immutable_log(log_key, data)
        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["legal_hold"], "ON")

        # Verify integrity
        integrity = vault.verify_object_integrity(log_key)
        self.assertTrue(integrity["valid"])
        self.assertTrue(integrity["kms_encrypted"])

        # Attempt modification/overwrite - should fail
        with self.assertRaises(PermissionError):
            vault.put_immutable_log(log_key, {"event": "Tampered"})

        # Attempt deletion - should fail under legal hold
        del_res = vault.attempt_delete_object(log_key)
        self.assertFalse(del_res["deleted"])
        self.assertIn("AccessDenied", del_res["reason"])

    def test_cloudtrail_ingestion_and_risk_scoring(self):
        ingestor = CloudTrailIngestor()
        sample_data = {
            "Records": [
                {
                    "eventID": "ev-01",
                    "eventName": "StopLogging",
                    "sourceIPAddress": "203.0.113.5",
                    "userIdentity": {"arn": "arn:aws:iam::123:user/rogue"}
                },
                {
                    "eventID": "ev-02",
                    "eventName": "DescribeInstances",
                    "sourceIPAddress": "10.0.1.15",
                    "userIdentity": {"arn": "arn:aws:iam::123:user/admin"}
                }
            ]
        }

        events = ingestor.ingest_log_batch(sample_data)
        self.assertEqual(len(events), 2)
        high_risk = ingestor.filter_high_risk_events(events)
        self.assertEqual(len(high_risk), 1)
        self.assertEqual(high_risk[0]["event_name"], "StopLogging")
        self.assertEqual(high_risk[0]["threat_score"], 85.0)


if __name__ == "__main__":
    unittest.main()
