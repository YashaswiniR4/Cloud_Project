"""
S3 WORM Vault & Audit Storage Security Manager
Provides Write Once Read Many (WORM) bucket compliance, KMS encryption enforcement,
and audit log immutability verification for Cloud Threat Telemetry.
"""

import json
import hashlib
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from config.settings import settings
from config.logging_config import logger


class S3WORMVaultManager:
    def __init__(self, bucket_name: Optional[str] = None, kms_key_arn: Optional[str] = None):
        self.bucket_name = bucket_name or settings.S3_WORM_BUCKET_NAME
        self.kms_key_arn = kms_key_arn or settings.KMS_KEY_ARN
        self.object_store: Dict[str, Dict[str, Any]] = {}
        self.default_retention_days = 365
        logger.info(f"Initialized S3 WORM Vault Manager for bucket: {self.bucket_name}")

    @property
    def audit_logs(self) -> List[Dict[str, Any]]:
        """Returns list of all locked audit log records in WORM storage."""
        return list(self.object_store.values())

    def get_bucket_policy(self) -> Dict[str, Any]:
        """Returns strict S3 bucket policy enforcing TLS 1.3 and KMS SSE."""
        return {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "DenyUnencryptedTransport",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:*",
                    "Resource": [
                        f"arn:aws:s3:::{self.bucket_name}",
                        f"arn:aws:s3:::{self.bucket_name}/*"
                    ],
                    "Condition": {
                        "Bool": {"aws:SecureTransport": "false"}
                    }
                },
                {
                    "Sid": "DenyIncorrectEncryptionHeader",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "s3:PutObject",
                    "Resource": f"arn:aws:s3:::{self.bucket_name}/*",
                    "Condition": {
                        "StringNotEquals": {
                            "s3:x-amz-server-side-encryption": "aws:kms"
                        }
                    }
                },
                {
                    "Sid": "EnforceObjectLockWORM",
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": ["s3:DeleteObject", "s3:DeleteObjectVersion"],
                    "Resource": f"arn:aws:s3:::{self.bucket_name}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:object-lock-legal-hold": "OFF"
                        }
                    }
                }
            ]
        }

    def put_immutable_log(self, key: str, log_payload: Dict[str, Any], retention_days: Optional[int] = None) -> Dict[str, Any]:
        """Stores a log payload in WORM storage mode with cryptographic SHA-256 digest & lock timer."""
        if key in self.object_store:
            logger.error(f"WORM Policy Violation: Object '{key}' modification attempt blocked.")
            raise PermissionError(f"WORM Policy Violation: Object '{key}' already exists and is locked against modifications.")

        ret_days = retention_days if retention_days is not None else self.default_retention_days
        raw_bytes = json.dumps(log_payload, sort_keys=True).encode('utf-8')
        sha256_hash = hashlib.sha256(raw_bytes).hexdigest()
        timestamp = datetime.now(timezone.utc).isoformat()

        record = {
            "key": key,
            "content": log_payload,
            "sha256": sha256_hash,
            "created_at": timestamp,
            "retention_days": ret_days,
            "kms_key_arn": self.kms_key_arn,
            "sse_algorithm": "aws:kms",
            "legal_hold": "ON",
            "version_id": f"v1-{int(time.time() * 1000)}"
        }
        self.object_store[key] = record
        logger.info(f"Immutable WORM Log Stored: key='{key}', SHA256='{sha256_hash[:10]}...'")
        return {
            "status": "SUCCESS",
            "key": key,
            "sha256": sha256_hash,
            "version_id": record["version_id"],
            "legal_hold": "ON"
        }

    def verify_object_integrity(self, key: str) -> Dict[str, Any]:
        """Validates that stored object has not been tampered with."""
        if key not in self.object_store:
            logger.warning(f"Integrity check failed: Key '{key}' not found.")
            return {"valid": False, "reason": "Object not found"}

        obj = self.object_store[key]
        raw_bytes = json.dumps(obj["content"], sort_keys=True).encode('utf-8')
        recalculated_hash = hashlib.sha256(raw_bytes).hexdigest()

        is_valid = (recalculated_hash == obj["sha256"])
        logger.info(f"Integrity Verification for '{key}': valid={is_valid}")
        return {
            "key": key,
            "valid": is_valid,
            "expected_sha256": obj["sha256"],
            "calculated_sha256": recalculated_hash,
            "legal_hold": obj["legal_hold"],
            "kms_encrypted": obj["sse_algorithm"] == "aws:kms"
        }

    def attempt_delete_object(self, key: str) -> Dict[str, Any]:
        """Attempts deletion - should fail under WORM policy."""
        if key in self.object_store:
            if self.object_store[key]["legal_hold"] == "ON":
                logger.warning(f"Prevented unauthorized deletion attempt on WORM object: '{key}'")
                return {
                    "deleted": False,
                    "reason": "AccessDenied: S3 Object Lock Compliance Legal Hold Active (WORM Mode Enforced)"
                }
            del self.object_store[key]
            return {"deleted": True, "reason": "Object deleted"}
        return {"deleted": False, "reason": "Object not found"}


if __name__ == "__main__":
    vault = S3WORMVaultManager()
    logger.info("Testing S3 WORM Vault Manager...")
    res = vault.put_immutable_log("cloudtrail/2026/08/03/log1.json", {"event": "UnauthorizedS3Access", "ip": "192.168.1.100"})
    logger.info(f"Log stored: {res}")
