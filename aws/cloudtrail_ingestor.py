"""
AWS CloudTrail Ingestor & Security Event Extractor
Parses raw AWS CloudTrail telemetry, filters high-risk API operations,
and normalizes records into threat intelligence feeds.
"""

import json
from typing import Dict, Any, List
from datetime import datetime, timezone
from config.logging_config import logger


class CloudTrailIngestor:
    HIGH_RISK_EVENTS = {
        "StopLogging",
        "DeleteTrail",
        "CreateKeyPair",
        "AuthorizeSecurityGroupIngress",
        "AttachUserPolicy",
        "PutBucketPolicy",
        "ModifyInstanceAttribute",
        "CreateAccessKey"
    }

    def __init__(self):
        self.ingested_count = 0
        self.high_risk_count = 0
        logger.info("Initialized CloudTrail Telemetry Ingestor Engine.")

    def parse_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Parses individual CloudTrail record and calculates threat indicator score."""
        event_name = record.get("eventName", "Unknown")
        user_identity = record.get("userIdentity", {})
        source_ip = record.get("sourceIPAddress", "0.0.0.0")
        event_time = record.get("eventTime", datetime.now(timezone.utc).isoformat())
        error_code = record.get("errorCode", None)

        is_high_risk = event_name in self.HIGH_RISK_EVENTS or error_code == "AccessDenied"
        severity = "HIGH" if event_name in self.HIGH_RISK_EVENTS else ("MEDIUM" if error_code == "AccessDenied" else "LOW")
        threat_score = 85.0 if severity == "HIGH" else (50.0 if severity == "MEDIUM" else 10.0)

        normalized_event = {
            "event_id": record.get("eventID", "evt-gen-" + str(hash(event_time + source_ip))),
            "event_name": event_name,
            "event_source": record.get("eventSource", "unknown.amazonaws.com"),
            "event_time": event_time,
            "source_ip": source_ip,
            "user_arn": user_identity.get("arn", user_identity.get("principalId", "anonymous")),
            "user_type": user_identity.get("type", "Unknown"),
            "error_code": error_code,
            "is_high_risk": is_high_risk,
            "severity": severity,
            "threat_score": threat_score,
            "aws_region": record.get("awsRegion", "us-east-1")
        }
        return normalized_event

    def ingest_log_batch(self, cloudtrail_json_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Processes a batch of CloudTrail records."""
        records = cloudtrail_json_data.get("Records", [])
        parsed_records = []
        for rec in records:
            parsed = self.parse_record(rec)
            parsed_records.append(parsed)
            self.ingested_count += 1
            if parsed["is_high_risk"]:
                self.high_risk_count += 1
                logger.warning(f"High-Risk CloudTrail Event Ingested: {parsed['event_name']} from IP {parsed['source_ip']}")

        logger.info(f"Ingested batch of {len(parsed_records)} CloudTrail logs ({self.high_risk_count} total high risk).")
        return parsed_records

    def filter_high_risk_events(self, parsed_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filters high-severity threats for immediate alert dispatch."""
        return [e for e in parsed_events if e["is_high_risk"]]


if __name__ == "__main__":
    sample_cloudtrail_batch = {
        "Records": [
            {
                "eventID": "1111-2222-3333",
                "eventTime": "2026-08-03T12:00:00Z",
                "eventSource": "iam.amazonaws.com",
                "eventName": "AttachUserPolicy",
                "awsRegion": "us-east-1",
                "sourceIPAddress": "198.51.100.45",
                "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123456789012:user/attacker"}
            }
        ]
    }
    ingestor = CloudTrailIngestor()
    events = ingestor.ingest_log_batch(sample_cloudtrail_batch)
    logger.info(f"Ingested {len(events)} events.")
