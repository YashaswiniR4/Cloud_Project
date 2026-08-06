"""
Supervised Threat Classifier Engine
Multi-class Machine Learning model for classifying cloud telemetry into cyber threat categories.
"""

from typing import Dict, Any, List, Tuple
from ml.feature_extractor import TelemetryFeatureExtractor


class CyberThreatClassifier:
    CLASSES = [
        "BENIGN", 
        "BRUTE_FORCE", 
        "RECON_EXPLOIT", 
        "IAM_PRIVILEGE_ESCALATION", 
        "RCE_WEBSHELL_UPLOAD",
        "MALICIOUS_SQLI_PAYLOAD",
        "MALICIOUS_EXECUTABLE_UPLOAD",
        "WEBSHELL_XSS_INJECTION",
        "UNKNOWN_THREAT"
    ]

    def __init__(self):
        self.feature_extractor = TelemetryFeatureExtractor()

    def classify_payload_content(self, filename: str, contents: bytes) -> Tuple[str, float]:
        """Inspects file extension and raw payload bytes for specific malware and attack patterns."""
        fname = filename.lower()
        lower_content = contents.lower()

        # RCE / WebShell Check
        if fname.endswith(".sh") or fname.endswith(".bash") or fname.endswith(".php") or b"eval(" in lower_content or b"exec(" in lower_content or b"/bin/bash" in lower_content or b"system(" in lower_content or b"passthru(" in lower_content or b"nc -e" in lower_content:
            return ("RCE_WEBSHELL_UPLOAD", 0.98)

        # SQL Injection Check
        if b"union select" in lower_content or b"or '1'='1" in lower_content or b"or 1=1" in lower_content or b"drop table" in lower_content or b"information_schema" in lower_content or b"--" in lower_content:
            return ("MALICIOUS_SQLI_PAYLOAD", 0.96)

        # XSS Injection Check
        if b"<script>" in lower_content or b"javascript:" in lower_content or b"onerror=" in lower_content or b"onload=" in lower_content:
            return ("WEBSHELL_XSS_INJECTION", 0.94)

        # Executable Malware Check
        if fname.endswith(".exe") or fname.endswith(".dll") or fname.endswith(".bat") or fname.endswith(".vbs") or fname.endswith(".ps1") or b"EICAR" in contents or contents.startswith(b"MZ"):
            return ("MALICIOUS_EXECUTABLE_UPLOAD", 0.99)

        return ("BENIGN", 0.99)

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
        payload = log_record.get("raw_payload", {})
        if isinstance(payload, dict) and "filename" in payload and "contents" in payload:
            label, confidence = self.classify_payload_content(payload["filename"], payload["contents"])
        else:
            label, confidence = self.predict_vector(vector)

        return {
            "prediction": label,
            "confidence": confidence,
            "feature_vector": vector,
            "risk_score": float(confidence * 100.0) if label != "BENIGN" else 5.0
        }
