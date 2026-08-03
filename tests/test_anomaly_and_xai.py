"""
Unit tests for Sprint 5: Anomaly Detector & XAI Explainability Engine
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from ml.anomaly_detector import ZeroDayAnomalyDetector
from ml.xai_explainability import ThreatExplainabilityEngine


class TestSprint5AnomalyAndXAI(unittest.TestCase):
    def test_anomaly_detection(self):
        detector = ZeroDayAnomalyDetector()
        normal_vec = [20.0, 2.0, 0.0, 0.0, 0.0, 0.0]
        normal_res = detector.detect(normal_vec)
        self.assertFalse(normal_res["is_zero_day_anomaly"])
        self.assertLess(normal_res["anomaly_score"], 0.65)

        anomaly_vec = [500.0, 6.2, 5.0, 1.0, 1.0, 1.0]
        anomaly_res = detector.detect(anomaly_vec)
        self.assertTrue(anomaly_res["is_zero_day_anomaly"])
        self.assertEqual(anomaly_res["risk_level"], "CRITICAL_ZERO_DAY")

    def test_xai_explainability(self):
        xai = ThreatExplainabilityEngine()
        vec = [150.0, 5.2, 3.0, 1.0, 1.0, 0.0]
        res = xai.calculate_shap_values(vec, "IAM_PRIVILEGE_ESCALATION")

        self.assertEqual(res["prediction_label"], "IAM_PRIVILEGE_ESCALATION")
        self.assertIn("shap_values", res)
        self.assertIn("Attack Keyword Count", res["shap_values"])
        self.assertGreater(len(res["human_readable_explanations"]), 0)


if __name__ == "__main__":
    unittest.main()
