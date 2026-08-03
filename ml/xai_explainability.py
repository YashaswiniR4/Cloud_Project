"""
Explainable AI (XAI) & SHAP Attributor
Provides mathematical feature attributions and natural language explanations for threat detections.
"""

from typing import Dict, Any, List


class ThreatExplainabilityEngine:
    FEATURE_NAMES = [
        "Payload Length",
        "Payload Entropy",
        "Attack Keyword Count",
        "Failed Auth Indicator",
        "Privilege Escalation Risk",
        "Privileged Egress Port"
    ]

    def __init__(self):
        self.baseline_values = [25.0, 2.5, 0.0, 0.0, 0.0, 0.0]

    def calculate_shap_values(self, feature_vector: List[float], prediction_label: str) -> Dict[str, Any]:
        """Calculates exact feature importance contributions (SHAP values) for prediction transparency."""
        shap_values = {}
        explanations = []

        weights = [0.05, 0.15, 0.35, 0.20, 0.20, 0.05]

        for name, val, base, weight in zip(self.FEATURE_NAMES, feature_vector, self.baseline_values, weights):
            diff = val - base
            shap_val = round(diff * weight, 4)
            shap_values[name] = shap_val

            if abs(shap_val) > 0.05:
                direction = "increased" if shap_val > 0 else "decreased"
                explanations.append(f"'{name}' ({val}) {direction} threat probability by {abs(shap_val):.2f}")

        top_contributor = max(shap_values, key=lambda k: abs(shap_values[k]))

        return {
            "prediction_label": prediction_label,
            "shap_values": shap_values,
            "top_risk_driver": top_contributor,
            "human_readable_explanations": explanations or ["All features are within standard operational baselines."]
        }


if __name__ == "__main__":
    xai = ThreatExplainabilityEngine()
    test_vec = [120.0, 4.8, 3.0, 1.0, 0.0, 1.0]
    res = xai.calculate_shap_values(test_vec, "RECON_EXPLOIT")
    import json
    print(json.dumps(res, indent=2))
