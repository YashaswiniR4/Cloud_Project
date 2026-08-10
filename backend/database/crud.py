"""
CRUD Database Operations for SOC Operations
"""

from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.database.models import (
    User, Event, Alert, ThreatIntelligence, HoneypotLog, MLPrediction, RemediationAction, AuditLog
)


from datetime import datetime, timedelta, timezone


# --- Users ---
def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email.ilike(email.strip())).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username.ilike(username.strip())).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def create_user(
    db: Session,
    username: str,
    email: str,
    password_hash: str,
    role: str = "Security Analyst",
    is_verified: bool = False,
    verification_otp: Optional[str] = None,
    otp_expires_at: Optional[datetime] = None
) -> User:
    db_user = User(
        username=username.strip(),
        email=email.strip().lower(),
        password_hash=password_hash,
        role=role,
        is_verified=is_verified,
        verification_otp=verification_otp,
        otp_expires_at=otp_expires_at,
        failed_login_attempts=0,
        locked_until=None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def verify_user_otp(db: Session, user: User) -> User:
    """Marks user as verified and clears single-use OTP fields."""
    user.is_verified = True
    user.verification_otp = None
    user.otp_expires_at = None
    db.commit()
    db.refresh(user)
    return user


def update_user_otp(db: Session, user: User, otp_code: str, expires_at: datetime) -> User:
    """Updates user verification OTP and 5-minute expiration timestamp."""
    user.verification_otp = otp_code
    user.otp_expires_at = expires_at
    db.commit()
    db.refresh(user)
    return user



def is_account_locked(db: Session, user: User) -> bool:
    """Checks if a user account is currently locked due to failed login attempts."""
    if user.locked_until:
        # Normalize timezone awareness
        now_utc = datetime.now(timezone.utc)
        locked_until_tz = user.locked_until
        if locked_until_tz.tzinfo is None:
            locked_until_tz = locked_until_tz.replace(tzinfo=timezone.utc)
        
        if locked_until_tz > now_utc:
            return True
        else:
            # Lock duration has expired - auto unlock
            user.failed_login_attempts = 0
            user.locked_until = None
            db.commit()
            return False
    return False


def increment_failed_login(db: Session, user: User) -> bool:
    """
    Increments failed login counter. If it reaches 5, locks account for 15 minutes.
    Returns True if account is now locked.
    """
    user.failed_login_attempts = getattr(user, 'failed_login_attempts', 0) + 1
    if user.failed_login_attempts >= 5:
        user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        db.commit()
        return True
    db.commit()
    return False


def reset_failed_login(db: Session, user: User):
    """Resets failed login counter upon successful authentication."""
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()



# --- Events ---
def create_event(db: Session, event_data: Dict[str, Any]) -> Event:

    event_id = event_data.get("event_id", f"evt-{event_data.get('eventID', 'gen')}")
    existing = db.query(Event).filter(Event.event_id == event_id).first()
    if existing:
        return existing

    db_event = Event(
        event_id=event_id,
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
    alert_id = alert_data.get("alert_id", f"alt-{uuid_gen()}")
    existing = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if existing:
        return existing

    db_alert = Alert(
        alert_id=alert_id,
        severity=alert_data.get("severity", "HIGH"),
        event_name=alert_data.get("event_name", "SECURITY_INCIDENT"),
        source_ip=alert_data.get("source_ip", "0.0.0.0"),
        user_id=alert_data.get("user_id"),
        user_email=alert_data.get("user_email"),
        user_arn=alert_data.get("user_arn"),
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


def get_all_remediation_actions(db: Session, deduplicate: bool = True) -> List[Dict[str, Any]]:
    all_rems = db.query(RemediationAction).order_by(RemediationAction.created_at.desc()).all()
    if not deduplicate:
        return [
            {
                "target_identifier": r.target_identifier,
                "action_type": r.action_type,
                "status": r.status,
                "actions_taken": r.actions_taken if (r.actions_taken and len(r.actions_taken) > 0) else [f"Revoked ingress and added deny rule for IP {r.target_identifier} in SG sg-0a1b2c3d4e5f6789a"],
                "timestamp": r.created_at.isoformat(),
                "execution_count": 1
            } for r in all_rems
        ]
    
    # Deduplicate strictly by target_identifier
    target_map = {}
    for r in all_rems:
        target = r.target_identifier or "Attacker IP"
        actions = r.actions_taken if (r.actions_taken and len(r.actions_taken) > 0) else [f"Revoked ingress and added deny rule for IP {target} in SG sg-0a1b2c3d4e5f6789a"]
        
        if target not in target_map:
            target_map[target] = {
                "target_identifier": target,
                "action_type": r.action_type or "SECURITY_GROUP_ISOLATION",
                "status": "EXECUTED",
                "actions_taken": actions,
                "timestamp": r.created_at.isoformat(),
                "execution_count": 1
            }
        else:
            target_map[target]["execution_count"] += 1
            if actions and not target_map[target]["actions_taken"]:
                target_map[target]["actions_taken"] = actions

    return list(target_map.values())


def delete_all_remediation_actions(db: Session):
    db.query(RemediationAction).delete()
    db.commit()


# --- Audit Logs ---
def create_audit_log(db: Session, log_id: str, bucket: str, sha256_hash: str) -> AuditLog:
    existing = db.query(AuditLog).filter(AuditLog.log_id == log_id).first()
    if existing:
        return existing

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
