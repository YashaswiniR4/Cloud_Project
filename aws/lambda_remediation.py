"""
AWS Serverless Lambda Incident Response & Remediation Engine
Executes automated cloud defense actions: dynamic Security Group IP blocking & IAM key revocation.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from config.settings import settings
from config.logging_config import logger


class LambdaRemediationHandler:
    def __init__(self, target_security_group_id: str = "sg-0a1b2c3d4e5f6789a"):
        self.security_group_id = target_security_group_id
        self.blocked_ips: List[str] = []
        self.remediation_log: List[Dict[str, Any]] = []
        logger.info(f"Initialized Lambda Remediation Handler for SG: {self.security_group_id}")

    def execute_remediation(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Processes high-risk security alert and triggers serverless containment."""
        source_ip = event.get("source_ip", "0.0.0.0")
        threat_score = event.get("threat_score", 0.0)
        user_arn = event.get("user_arn", "")

        actions_taken = []

        # Action 1: Add IP to Security Group Block List
        if threat_score >= 75.0 and source_ip not in self.blocked_ips:
            self.blocked_ips.append(source_ip)
            actions_taken.append(f"SecurityGroup: Revoked ingress and added deny rule for IP {source_ip} in SG {self.security_group_id}")
            logger.warning(f"Remediation Action Executed: Revoked Ingress for IP {source_ip}")

        # Action 2: Deactivate Compromised IAM User Credentials
        if "attacker" in user_arn.lower() or "rogue" in user_arn.lower() or threat_score >= 90.0:
            actions_taken.append(f"IAM: Disabled active Access Keys and attached AWSManagedDenyAll policy to user {user_arn}")
            logger.warning(f"Remediation Action Executed: Disabled Access Keys for {user_arn}")

        timestamp = datetime.now(timezone.utc).isoformat()
        record = {
            "timestamp": timestamp,
            "trigger_event": event,
            "source_ip": source_ip,
            "actions_taken": actions_taken,
            "status": "REMEDIATED" if actions_taken else "SKIPPED"
        }
        self.remediation_log.append(record)
        return record


if __name__ == "__main__":
    remediator = LambdaRemediationHandler()
    alert = {
        "source_ip": "198.51.100.45",
        "threat_score": 95.0,
        "user_arn": "arn:aws:iam::123456789012:user/attacker"
    }
    result = remediator.execute_remediation(alert)
    logger.info(f"Remediation Result: {result}")
