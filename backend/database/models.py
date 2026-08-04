"""
SQLAlchemy ORM Database Models for SOC Platform
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


def current_utc_time():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Security Analyst", nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_otp = Column(String(6), nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)




class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(100), unique=True, nullable=False, index=True)
    event_name = Column(String(100), nullable=False, index=True)
    event_time = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)
    event_source = Column(String(100), nullable=False, index=True)
    source_ip = Column(String(45), nullable=False, index=True)
    user_arn = Column(String(255), nullable=True)
    error_code = Column(String(100), nullable=True)
    threat_score = Column(Float, default=0.0, nullable=False, index=True)
    severity = Column(String(20), default="LOW", nullable=False, index=True)
    is_high_risk = Column(Boolean, default=False, nullable=False)
    raw_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)

    ml_predictions = relationship("MLPrediction", back_populates="event", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    alert_id = Column(String(100), unique=True, nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)
    severity = Column(String(20), nullable=False, index=True)
    event_name = Column(String(100), nullable=False)
    source_ip = Column(String(45), nullable=False, index=True)
    threat_score = Column(Float, nullable=False)
    sns_topic_arn = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="DELIVERED", nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)


class ThreatIntelligence(Base):
    __tablename__ = "threat_intelligence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    source_ip = Column(String(45), unique=True, nullable=False, index=True)
    reputation_score = Column(Float, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    isp = Column(String(100), nullable=True)
    total_attacks = Column(Integer, default=1, nullable=False)
    last_seen = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)


class HoneypotLog(Base):
    __tablename__ = "honeypot_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    honeypot_type = Column(String(20), nullable=False, index=True)  # SSH / HTTP
    source_ip = Column(String(45), nullable=False, index=True)
    target_user_or_path = Column(String(255), nullable=False)
    payload_or_password = Column(Text, nullable=True)
    threat_score = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)


class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(36), ForeignKey("events.id", ondelete="CASCADE"), nullable=True)
    prediction_label = Column(String(100), nullable=False, index=True)
    anomaly_score = Column(Float, nullable=False)
    is_zero_day = Column(Boolean, default=False, nullable=False, index=True)
    shap_explanation = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)

    event = relationship("Event", back_populates="ml_predictions")


class RemediationAction(Base):
    __tablename__ = "remediation_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    action_type = Column(String(100), nullable=False, index=True)
    target_identifier = Column(String(255), nullable=False, index=True)
    status = Column(String(50), default="EXECUTED", nullable=False)
    timestamp = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)
    actions_taken = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    log_id = Column(String(100), unique=True, nullable=False, index=True)
    vault_bucket = Column(String(100), nullable=False)
    sha256_hash = Column(String(64), nullable=False)
    is_locked = Column(Boolean, default=True, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)
    created_at = Column(DateTime(timezone=True), default=current_utc_time, nullable=False)


# Indexing
Index("idx_events_ip_time", Event.source_ip, Event.event_time)
Index("idx_alerts_severity_time", Alert.severity, Alert.timestamp)
Index("idx_honeypot_ip_type", HoneypotLog.source_ip, HoneypotLog.honeypot_type)
