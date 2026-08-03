"""
Unit tests for Module 6: CloudTrail → S3 Telemetry Pipeline
"""

import unittest
import os
import sys
import json
import gzip
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from aws.cloudtrail_pipeline import CloudTrailTelemetryPipeline


class TestModule6CloudTrailPipeline(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.store_path = os.path.join(self.temp_dir.name, "normalized_events.json")
        self.pipeline = CloudTrailTelemetryPipeline(output_store_path=self.store_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_valid_dict_ingestion(self):
        payload = {
            "Records": [
                {
                    "eventID": "test-evt-001",
                    "eventName": "AttachUserPolicy",
                    "eventTime": "2026-08-03T18:00:00Z",
                    "eventSource": "iam.amazonaws.com",
                    "sourceIPAddress": "198.51.100.45",
                    "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123:user/attacker"}
                }
            ]
        }
        events = self.pipeline.ingest_raw_payload(payload)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_name"], "AttachUserPolicy")
        self.assertTrue(events[0]["is_high_risk"])

    def test_gzip_binary_payload_ingestion(self):
        payload = {
            "Records": [
                {
                    "eventID": "test-evt-002",
                    "eventName": "DescribeInstances",
                    "eventTime": "2026-08-03T18:05:00Z",
                    "eventSource": "ec2.amazonaws.com",
                    "sourceIPAddress": "203.0.113.10"
                }
            ]
        }
        json_bytes = json.dumps(payload).encode('utf-8')
        gz_bytes = gzip.compress(json_bytes)

        events = self.pipeline.ingest_raw_payload(gz_bytes)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_name"], "DescribeInstances")
        self.assertFalse(events[0]["is_high_risk"])

    def test_malformed_event_filtering(self):
        malformed_payload = {
            "Records": [
                {
                    "eventID": "bad-001",
                    "missing_eventName": True
                },
                {
                    "eventID": "good-001",
                    "eventName": "ConsoleLogin",
                    "eventTime": "2026-08-03T18:10:00Z",
                    "eventSource": "signin.amazonaws.com"
                }
            ]
        }
        events = self.pipeline.ingest_raw_payload(malformed_payload)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["event_id"], "good-001")
        self.assertGreater(self.pipeline.total_filtered_malformed, 0)

    def test_ml_dataset_persistence(self):
        payload = {
            "Records": [
                {
                    "eventID": "ml-001",
                    "eventName": "AuthorizeSecurityGroupIngress",
                    "eventTime": "2026-08-03T18:15:00Z",
                    "eventSource": "ec2.amazonaws.com",
                    "sourceIPAddress": "198.51.100.99"
                }
            ]
        }
        self.pipeline.ingest_raw_payload(payload)
        self.assertTrue(os.path.exists(self.store_path))
        with open(self.store_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["event_id"], "ml-001")


if __name__ == "__main__":
    unittest.main()
