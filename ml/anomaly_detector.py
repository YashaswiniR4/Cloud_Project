"""
Unsupervised Anomaly Detection Engine (Zero-Day Detector)
Calculates isolation anomaly scores for novel, unseen threat patterns in cloud telemetry.
"""

import math
from typing import Dict, Any, List


class ZeroDayAnomalyDetector:
    def __init__(self):
        # Baseline normal distributions (mean, std) for [length, entropy, keywords, failed_auth, priv_esc, priv_port]
        self.baseline_stats = [
            (25.0, 10.0),  # length
            (2.5, 0.8),    # entropy
            (0.0, 0.1),    # keywords
            (0.0, 0.1),    # failed auth
            (0.0, 0.1),    # priv esc
            (0.0, 0.5)     # priv port
        ]

    def compute_anomaly_score(self, feature_vector: List[float]) -> float:
        """
        Computes Mahalanobis-like standard score (Z-score deviation sum) normalized between 0.0 and 1.0.
        Scores above 0.7 indicate potential zero-day anomalies.
        """
        total_z_score = 0.0
        for val, (mean, std) in zip(feature_vector, self.baseline_stats):
            std_adj = max(std, 0.01)
            z = abs(val - mean) / std_adj
            total_z_score += z

        # Sigmoid normalization
        normalized_score = 1.0 / (1.0 + math.exp(-0.3 * (total_z_score - 4.0)))
        return round(normalized_score, 4)

    def detect(self, feature_vector: List[float]) -> Dict[str, Any]:
        score = self.compute_anomaly_score(feature_vector)
        is_anomaly = score > 0.65
        return {
            "anomaly_score": score,
            "is_zero_day_anomaly": is_anomaly,
            "risk_level": "CRITICAL_ZERO_DAY" if score > 0.85 else ("HIGH_ANOMALY" if is_anomaly else "NORMAL")
        }


if __name__ == "__main__":
    detector = ZeroDayAnomalyDetector()
    normal_vec = [20.0, 2.1, 0.0, 0.0, 0.0, 0.0]
    anomaly_vec = [350.0, 5.8, 4.0, 1.0, 1.0, 1.0]

    print("Normal score:", detector.detect(normal_vec))
    print("Anomaly score:", detector.detect(anomaly_vec))
