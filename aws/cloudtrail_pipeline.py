"""
AWS CloudTrail → S3 Telemetry Ingestion Pipeline
Production-ready telemetry pipeline that ingests raw CloudTrail logs (compressed/uncompressed),
validates and filters malformed records, normalizes event structures, stores logs in S3 WORM Vault,
and persists clean datasets for downstream Machine Learning models.
"""

import json
import gzip
import os
import io
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone

from config.settings import settings
from config.logging_config import logger
from aws.s3_worm_vault import S3WORMVaultManager


class CloudTrailTelemetryPipeline:
    """Production Telemetry Ingestion Pipeline for AWS CloudTrail."""

    HIGH_RISK_EVENTS = {
        "StopLogging",
        "DeleteTrail",
        "CreateKeyPair",
        "AuthorizeSecurityGroupIngress",
        "RevokeSecurityGroupIngress",
        "AttachUserPolicy",
        "PutBucketPolicy",
        "ModifyInstanceAttribute",
        "CreateAccessKey"
    }

    REQUIRED_FIELDS = ["eventName"]

    def __init__(self, output_store_path: Optional[str] = None):
        self.worm_vault = S3WORMVaultManager()
        self.output_store_path = output_store_path or os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "ml", "normalized_events.json")
        )
        self.total_ingested = 0
        self.total_filtered_malformed = 0
        self.total_high_risk = 0
        logger.info(f"Initialized CloudTrail Telemetry Pipeline. Target ML Store: {self.output_store_path}")

    def validate_record(self, record: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Validates record schema and rejects malformed events."""
        if not isinstance(record, dict):
            return False, "Record must be a JSON dictionary."

        for field in self.REQUIRED_FIELDS:
            if field not in record or not record[field]:
                return False, f"Missing required field: '{field}'"

        # Validate IP format basic sanity check if present
        source_ip = record.get("sourceIPAddress", "")
        if source_ip and not isinstance(source_ip, str):
            return False, "Invalid sourceIPAddress type."

        return True, None

    def normalize_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Normalizes raw CloudTrail JSON record into standardized schema."""
        event_name = record.get("eventName", "Unknown")
        user_identity = record.get("userIdentity", {})
        source_ip = record.get("sourceIPAddress", "0.0.0.0")
        event_time = record.get("eventTime", datetime.now(timezone.utc).isoformat())
        error_code = record.get("errorCode", None)

        is_high_risk = (event_name in self.HIGH_RISK_EVENTS) or (error_code == "AccessDenied")
        severity = "HIGH" if event_name in self.HIGH_RISK_EVENTS else ("MEDIUM" if error_code == "AccessDenied" else "LOW")
        threat_score = 85.0 if severity == "HIGH" else (50.0 if severity == "MEDIUM" else 10.0)

        user_arn = user_identity.get("arn", user_identity.get("principalId", "anonymous")) if isinstance(user_identity, dict) else "anonymous"
        user_type = user_identity.get("type", "Unknown") if isinstance(user_identity, dict) else "Unknown"

        normalized = {
            "event_id": record.get("eventID", f"evt-{hash(event_time + source_ip + event_name)}"),
            "event_name": event_name,
            "event_source": record.get("eventSource", "unknown.amazonaws.com"),
            "event_time": event_time,
            "source_ip": source_ip,
            "user_arn": user_arn,
            "user_type": user_type,
            "error_code": error_code,
            "is_high_risk": is_high_risk,
            "severity": severity,
            "threat_score": threat_score,
            "aws_region": record.get("awsRegion", "us-east-1"),
            "raw_payload": record
        }
        return normalized

    def ingest_raw_payload(self, raw_input: Any) -> List[Dict[str, Any]]:
        """
        Accepts raw dictionary, JSON string, or gzip byte payload,
        decompresses if necessary, parses, validates, and normalizes events.
        """
        data = None
        if isinstance(raw_input, dict):
            data = raw_input
        elif isinstance(raw_input, str):
            try:
                data = json.loads(raw_input)
            except json.JSONDecodeError as err:
                logger.error(f"Malformed JSON payload string: {err}")
                self.total_filtered_malformed += 1
                return []
        elif isinstance(raw_input, bytes):
            try:
                if raw_input.startswith(b'\x1f\x8b'):
                    with gzip.GzipFile(fileobj=io.BytesIO(raw_input), mode='rb') as gz:
                        decompressed = gz.read().decode('utf-8')
                        data = json.loads(decompressed)
                else:
                    data = json.loads(raw_input.decode('utf-8'))
            except Exception as err:
                logger.error(f"Failed to decompress or parse binary log payload: {err}")
                self.total_filtered_malformed += 1
                return []
        else:
            logger.error(f"Unsupported payload input type: {type(raw_input)}")
            self.total_filtered_malformed += 1
            return []

        records = data.get("Records", []) if isinstance(data, dict) else []
        normalized_list = []

        for rec in records:
            valid, reason = self.validate_record(rec)
            if not valid:
                logger.warning(f"Filtered malformed CloudTrail record: {reason}")
                self.total_filtered_malformed += 1
                continue

            normalized = self.normalize_record(rec)
            normalized_list.append(normalized)
            self.total_ingested += 1

            if normalized["is_high_risk"]:
                self.total_high_risk += 1
                logger.warning(f"HIGH RISK TELEMETRY: {normalized['event_name']} from IP {normalized['source_ip']}")
                self.worm_vault.put_immutable_log(f"cloudtrail/{normalized['event_id']}.json", normalized)

        self._persist_normalized_records(normalized_list)

        logger.info(f"Pipeline Ingested: {len(normalized_list)} valid events ({self.total_filtered_malformed} malformed filtered).")
        return normalized_list

    def _persist_normalized_records(self, records: List[Dict[str, Any]]):
        """Appends clean normalized records to local dataset file for ML ingestion."""
        if not records:
            return

        existing = []
        if os.path.exists(self.output_store_path):
            try:
                with open(self.output_store_path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
            except Exception:
                existing = []

        existing.extend(records)

        os.makedirs(os.path.dirname(self.output_store_path), exist_ok=True)
        with open(self.output_store_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2)


if __name__ == "__main__":
    pipeline = CloudTrailTelemetryPipeline()
    sample = {
        "Records": [
            {
                "eventID": "ct-001",
                "eventName": "AttachUserPolicy",
                "eventTime": "2026-08-03T18:00:00Z",
                "eventSource": "iam.amazonaws.com",
                "sourceIPAddress": "198.51.100.45",
                "userIdentity": {"type": "IAMUser", "arn": "arn:aws:iam::123:user/attacker"}
            }
        ]
    }
    result = pipeline.ingest_raw_payload(sample)
    logger.info(f"Pipeline output count: {len(result)}")
