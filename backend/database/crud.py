"""
CRUD Database Operations for SOC Operations
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.database.models import (
    User, Event, Alert, ThreatIntelligence, HoneypotLog, MLPrediction, RemediationAction, AuditLog
)


# --- Events ---
def create_event(db: Session, event_data: Dict[str, Any]) -> Event:
    db_event = Event(
        event_id=event_data.get("event_id", f"evt-{event_data.get('eventID', 'gen')}"),
        event_name=event_data.get("event_name", event_data.get("eventName", "Unknown")),
        event_source=event_data.get("event_source", event_data.get("eventSource", "aws")),
        source_ip=event_data.get("source_ip", event_data.get("sourceIPAddress", "0.0.0.0")),
        user_arn=event_data.get("user_arn", event_data.get("userIdentity", {}).get("arn", "")),
        error_code=event_data.get("error_code", event_data.get("errorCode", None)),
        threat_score=event_data.get("threat_score", 0.0),
        severity=event_data.get("severity", "LOW"),
        is_high_risk=event_data.get("is_high_risk", False),
        raw_payload=event_data
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_all_events(db: Session, limit: int = 100) -> List[Event]:
    return db.query(Event).order_by(Event.created_at.desc()).limit(limit).all()


# --- Alerts ---
def create_alert(db: Session, alert_data: Dict[str, Any]) -> Alert:
    db_alert = Alert(
        alert_id=alert_data.get("alert_id", f"alt-{uuid_gen()}"),
        severity=alert_data.get("severity", "HIGH"),
        event_name=alert_data.get("event_name", "SECURITY_INCIDENT"),
        source_ip=alert_data.get("source_ip", "0.0.0.0"),
        threat_score=alert_data.get("threat_score", 0.0),
        sns_topic_arn=alert_data.get("sns_topic_arn", "arn:aws:sns:us-east-1:123456789012:SOCAlertsTopic"),
        message=alert_data.get("message", "Dispatched security alert."),
        status=alert_data.get("status", "DELIVERED")
    )
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


def get_all_alerts(db: Session, limit: int = 100) -> List[Alert]:
    return db.query(Alert).order_by(Alert.created_at.desc()).limit(limit).all()


# --- Threat Intelligence ---
def upsert_threat_intel(db: Session, source_ip: str, reputation: Dict[str, Any]) -> ThreatIntelligence:
    existing = db.query(ThreatIntelligence).filter(ThreatIntelligence.source_ip == source_ip).first()
    if existing:
        existing.reputation_score = reputation.get("threat_score", existing.reputation_score)
        existing.category = reputation.get("category", existing.category)
        existing.total_attacks += 1
        db.commit()
        db.refresh(existing)
        return existing

    new_intel = ThreatIntelligence(
        source_ip=source_ip,
        reputation_score=reputation.get("threat_score", 50.0),
        category=reputation.get("category", "SUSPICIOUS_ACTOR"),
        isp=reputation.get("isp", "Known Botnet Subnet"),
        total_attacks=1
    )
    db.add(new_intel)
    db.commit()
    db.refresh(new_intel)
    return new_intel


def get_all_threat_intel(db: Session) -> List[ThreatIntelligence]:
    return db.query(ThreatIntelligence).order_by(ThreatIntelligence.reputation_score.desc()).all()


# --- Honeypot Logs ---
def create_honeypot_log(db: Session, log_data: Dict[str, Any]) -> HoneypotLog:
    db_log = HoneypotLog(
        honeypot_type=log_data.get("honeypot_type", "SSH"),
        source_ip=log_data.get("source_ip", "0.0.0.0"),
        target_user_or_path=log_data.get("target_user_or_path", "root"),
        payload_or_password=log_data.get("payload_or_password", ""),
        threat_score=log_data.get("threat_score", 90.0)
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


def get_honeypot_logs(db: Session, honeypot_type: Optional[str] = None) -> List[HoneypotLog]:
    query = db.query(HoneypotLog)
    if honeypot_type:
        query = query.filter(HoneypotLog.honeypot_type == honeypot_type)
    return query.order_by(HoneypotLog.created_at.desc()).all()


# --- Remediation Actions ---
def create_remediation_action(db: Session, action_type: str, target: str, actions: List[str]) -> RemediationAction:
    action = RemediationAction(
        action_type=action_type,
        target_identifier=target,
        status="EXECUTED",
        actions_taken=actions
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


def get_all_remediation_actions(db: Session) -> List[RemediationAction]:
    return db.query(RemediationAction).order_by(RemediationAction.created_at.desc()).all()


# --- Audit Logs ---
def create_audit_log(db: Session, log_id: str, bucket: str, sha256_hash: str) -> AuditLog:
    db_audit = AuditLog(
        log_id=log_id,
        vault_bucket=bucket,
        sha256_hash=sha256_hash,
        is_locked=True
    )
    db.add(db_audit)
    db.commit()
    db.refresh(db_audit)
    return db_audit


def get_all_audit_logs(db: Session) -> List[AuditLog]:
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()


def uuid_gen():
    import uuid
    return str(uuid.uuid4())[:8]
