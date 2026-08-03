"""
Unit tests for Sprint 4: Preprocessing & ML Threat Classifier
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml.feature_extractor import TelemetryFeatureExtractor
from ml.threat_classifier import CyberThreatClassifier


class TestSprint4MLPipeline(unittest.TestCase):
    def setUp(self):
        self.extractor = TelemetryFeatureExtractor()
        self.classifier = CyberThreatClassifier()

    def test_feature_extraction(self):
        log = {"path": "/admin", "payload": "UNION SELECT", "error_code": "AccessDenied"}
        vec = self.extractor.extract_features(log)
        self.assertEqual(len(vec), 6)
        self.assertGreater(vec[2], 0)  # keyword matches
        self.assertEqual(vec[3], 1.0)  # failed auth

    def test_threat_classification_priv_esc(self):
        log = {"event_name": "AttachUserPolicy", "payload": "AdminAccess"}
        res = self.classifier.classify_log(log)
        self.assertEqual(res["prediction"], "IAM_PRIVILEGE_ESCALATION")
        self.assertGreater(res["confidence"], 0.8)

    def test_threat_classification_recon_exploit(self):
        log = {"path": "/etc/passwd", "payload": "cat /etc/passwd"}
        res = self.classifier.classify_log(log)
        self.assertEqual(res["prediction"], "RECON_EXPLOIT")

    def test_threat_classification_benign(self):
        log = {"path": "/index.html", "payload": "hello world"}
        res = self.classifier.classify_log(log)
        self.assertEqual(res["prediction"], "BENIGN")


if __name__ == "__main__":
    unittest.main()
