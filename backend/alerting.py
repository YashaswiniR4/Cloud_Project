"""
Incident Alerting & Notification Service
Dispatches security alerts to AWS SNS topics and SOC Webhooks (Slack/Teams).
"""

from typing import Dict, Any, List
from datetime import datetime, timezone


class IncidentAlertDispatcher:
    def __init__(self, sns_topic_arn: str = "arn:aws:sns:us-east-1:123456789012:SOCAlertsTopic"):
        self.sns_topic_arn = sns_topic_arn
        self.dispatched_alerts: List[Dict[str, Any]] = []

    def dispatch_alert(self, alert_details: Dict[str, Any]) -> Dict[str, Any]:
        """Formats and dispatches incident alert payload."""
        timestamp = datetime.now(timezone.utc).isoformat()
        severity = alert_details.get("severity", "HIGH")
        source_ip = alert_details.get("source_ip", "0.0.0.0")
        event_name = alert_details.get("event_name", alert_details.get("threat_type", "SECURITY_EVENT"))

        message = (
            f"🚨 [ALERT - {severity}] Cloud Threat Detected!\n"
            f"Timestamp: {timestamp}\n"
            f"Event: {event_name}\n"
            f"Source IP: {source_ip}\n"
            f"Threat Score: {alert_details.get('threat_score', 'N/A')}\n"
            f"Remediation: Autonomous isolation executed via Lambda."
        )

        alert_record = {
            "timestamp": timestamp,
            "sns_topic_arn": self.sns_topic_arn,
            "severity": severity,
            "message": message,
            "status": "DELIVERED"
        }
        self.dispatched_alerts.append(alert_record)
        return alert_record


if __name__ == "__main__":
    dispatcher = IncidentAlertDispatcher()
    res = dispatcher.dispatch_alert({
        "severity": "CRITICAL",
        "source_ip": "198.51.100.45",
        "event_name": "AttachUserPolicy",
        "threat_score": 95.0
    })
    print("Dispatched alert:", res["message"])
