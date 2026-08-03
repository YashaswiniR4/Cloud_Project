"""
AWS CloudTrail Ingestor & Security Event Extractor
Parses raw AWS CloudTrail telemetry, filters high-risk API operations,
and normalizes records into threat intelligence feeds.
"""

from typing import Dict, Any, List
from aws.cloudtrail_pipeline import CloudTrailTelemetryPipeline
from config.logging_config import logger


class CloudTrailIngestor:
    def __init__(self):
        self.pipeline = CloudTrailTelemetryPipeline()
        self.ingested_count = 0
        self.high_risk_count = 0
        logger.info("Initialized CloudTrail Telemetry Ingestor Engine.")

    def parse_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Parses individual CloudTrail record and calculates threat indicator score."""
        return self.pipeline.normalize_record(record)

    def ingest_log_batch(self, cloudtrail_json_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Processes a batch of CloudTrail records."""
        events = self.pipeline.ingest_raw_payload(cloudtrail_json_data)
        self.ingested_count = self.pipeline.total_ingested
        self.high_risk_count = self.pipeline.total_high_risk
        return events

    def filter_high_risk_events(self, parsed_events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filters high-severity threats for immediate alert dispatch."""
        return [e for e in parsed_events if e.get("is_high_risk", False)]


if __name__ == "__main__":
    sample = {
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
    events = ingestor.ingest_log_batch(sample)
    logger.info(f"Ingested {len(events)} events.")
