"""
Cyber Threat Telemetry Feature Extractor
Converts raw cloud security logs into structured numeric feature vectors for Machine Learning models.
"""

import math
from typing import Dict, Any, List


class TelemetryFeatureExtractor:
    def __init__(self):
        self.known_attack_keywords = [
            "select", "union", "drop", "delete", "insert", "exec", "cmd",
            "etc/passwd", "root", "admin", "stoplogging", "attachuserpolicy"
        ]

    def calculate_entropy(self, text: str) -> float:
        """Calculates Shannon entropy of string payload to detect obfuscation/encryption."""
        if not text:
            return 0.0
        prob = [float(text.count(c)) / len(text) for c in set(text)]
        return -sum([p * math.log2(p) for p in prob])

    def extract_features(self, log_record: Dict[str, Any]) -> List[float]:
        """
        Transforms log payload into normalized numeric vector:
        [0]: payload_length
        [1]: payload_entropy
        [2]: attack_keyword_matches
        [3]: is_failed_auth (1.0 or 0.0)
        [4]: privilege_escalation_risk (1.0 or 0.0)
        [5]: source_port_type (1.0 for privileged, 0.0 otherwise)
        """
        payload = str(log_record.get("payload", log_record.get("eventName", ""))).lower()
        path = str(log_record.get("path", "")).lower()
        combined_text = payload + " " + path

        payload_length = float(len(combined_text))
        payload_entropy = float(self.calculate_entropy(combined_text))

        keyword_matches = sum(1 for kw in self.known_attack_keywords if kw in combined_text)

        error_code = log_record.get("error_code", "")
        is_failed_auth = 1.0 if (error_code == "AccessDenied" or log_record.get("attack_type") == "SSH_BRUTE_FORCE") else 0.0

        event_name = log_record.get("event_name", log_record.get("eventName", ""))
        is_priv_esc = 1.0 if event_name in ["AttachUserPolicy", "CreateAccessKey", "PutBucketPolicy"] else 0.0

        port = log_record.get("port", 80)
        is_priv_port = 1.0 if port < 1024 else 0.0

        return [
            payload_length,
            payload_entropy,
            float(keyword_matches),
            is_failed_auth,
            is_priv_esc,
            is_priv_port
        ]


if __name__ == "__main__":
    extractor = TelemetryFeatureExtractor()
    sample = {"path": "/admin?cmd=cat /etc/passwd", "payload": "' UNION SELECT *", "error_code": "AccessDenied"}
    vec = extractor.extract_features(sample)
    print("Extracted feature vector:", vec)
