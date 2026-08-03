"""
Supervised Threat Classifier Engine
Multi-class Machine Learning model for classifying cloud telemetry into cyber threat categories.
"""

from typing import Dict, Any, List, Tuple
from ml.feature_extractor import TelemetryFeatureExtractor


class CyberThreatClassifier:
    CLASSES = ["BENIGN", "BRUTE_FORCE", "RECON_EXPLOIT", "IAM_PRIVILEGE_ESCALATION", "UNKNOWN_THREAT"]

    def __init__(self):
        self.feature_extractor = TelemetryFeatureExtractor()

    def predict_vector(self, vector: List[float]) -> Tuple[str, float]:
        """
        Classifies feature vector:
        vector: [length, entropy, keyword_matches, failed_auth, priv_esc, priv_port]
        Returns (Class_Label, Confidence_Score)
        """
        length, entropy, keywords, failed_auth, priv_esc, priv_port = vector

        if priv_esc > 0.5:
            confidence = 0.95 if keywords > 0 else 0.85
            return ("IAM_PRIVILEGE_ESCALATION", confidence)

        if failed_auth > 0.5 and keywords == 0:
            return ("BRUTE_FORCE", 0.92)

        if keywords > 0 or (length > 30 and entropy > 3.5):
            confidence = min(0.99, 0.70 + (keywords * 0.1) + (entropy * 0.05))
            return ("RECON_EXPLOIT", confidence)

        if length > 100 or entropy > 4.5:
            return ("UNKNOWN_THREAT", 0.75)

        return ("BENIGN", 0.98)

    def classify_log(self, log_record: Dict[str, Any]) -> Dict[str, Any]:
        """Runs end-to-end feature extraction and threat classification."""
        vector = self.feature_extractor.extract_features(log_record)
        label, confidence = self.predict_vector(vector)
        return {
            "prediction": label,
            "confidence": confidence,
            "feature_vector": vector,
            "risk_score": float(confidence * 100.0) if label != "BENIGN" else 5.0
        }


if __name__ == "__main__":
    classifier = CyberThreatClassifier()
    sample_log = {
        "event_name": "AttachUserPolicy",
        "payload": "arn:aws:iam::aws:policy/AdministratorAccess",
        "error_code": "AccessDenied"
    }
    result = classifier.classify_log(sample_log)
    print("Classification Result:", result)
