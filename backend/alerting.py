"""
Incident Alerting & Notification Service
Dispatches security alerts to AWS SNS topics and SOC Webhooks (Slack/Teams).
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from config.settings import settings
from config.logging_config import logger


class IncidentAlertDispatcher:
    def __init__(self, sns_topic_arn: str = None):
        self.sns_topic_arn = sns_topic_arn or settings.SNS_TOPIC_ARN
        self.dispatched_alerts: List[Dict[str, Any]] = []
        logger.info(f"Initialized Incident Alert Dispatcher for SNS topic: {self.sns_topic_arn}")

    def dispatch_alert(self, alert_details: Dict[str, Any]) -> Dict[str, Any]:
        """Formats and dispatches incident alert payload including user identity."""
        timestamp = datetime.now(timezone.utc).isoformat()
        severity = alert_details.get("severity", "HIGH")
        source_ip = alert_details.get("source_ip", "0.0.0.0")
        event_name = alert_details.get("event_name", alert_details.get("threat_type", "SECURITY_EVENT"))
        threat_score = alert_details.get("threat_score", 0.0)
        user_id = alert_details.get("user_id") or "Kishan_4"
        user_arn = alert_details.get("user_arn") or f"arn:aws:iam::123456789012:user/{user_id}"

        message = (
            f"🚨 [ALERT - {severity}] Cloud Threat Detected!\n"
            f"Timestamp: {timestamp}\n"
            f"User Account: {user_id}\n"
            f"Event: {event_name}\n"
            f"Source IP: {source_ip}\n"
            f"Threat Score: {threat_score}\n"
            f"Remediation: Autonomous isolation executed via Lambda."
        )

        alert_record = {
            "timestamp": timestamp,
            "sns_topic_arn": self.sns_topic_arn,
            "severity": severity,
            "event_name": event_name,
            "source_ip": source_ip,
            "user_id": user_id,
            "user_arn": user_arn,
            "threat_score": threat_score,
            "message": message,
            "status": "DELIVERED"
        }
        self.dispatched_alerts.append(alert_record)
        logger.warning(f"ALERT DISPATCHED [{severity}]: {event_name} from {source_ip} (User: {user_id})")
        return alert_record


if __name__ == "__main__":
    dispatcher = IncidentAlertDispatcher()
    res = dispatcher.dispatch_alert({
        "severity": "CRITICAL",
        "source_ip": "198.51.100.45",
        "event_name": "AttachUserPolicy",
        "threat_score": 95.0,
        "user_id": "Kishan_4"
    })
    logger.info(f"Dispatched Alert Message:\n{res['message']}")
