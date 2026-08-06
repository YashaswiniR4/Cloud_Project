"""
FastAPI APIRouter definitions for SOC Operations & Employee Portal Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Dict, Any, List, Optional
import hashlib

from backend.schemas.telemetry_schemas import (
    CloudTrailBatchPayloadSchema,
    SSHSimulationSchema,
    HTTPSimulationSchema
)
from backend.schemas.dashboard_schemas import (
    HealthResponseSchema,
    MetricsResponseSchema,
    DashboardOverviewSchema
)
from backend.services.threat_service import threat_ops_service, ThreatOperationsService

from backend.auth.security import get_current_user
from backend.api.auth import auth_router
from backend.database.models import User, IncidentTimeline, UserBehaviorProfile
from backend.database.database import get_db
from sqlalchemy.orm import Session


def get_threat_service() -> ThreatOperationsService:
    """Dependency Injection provider for Threat Operations Service."""
    return threat_ops_service


api_router = APIRouter()

# Include Authentication Router (/auth/register, /auth/login, /auth/me, /auth/logout)
api_router.include_router(auth_router)


@api_router.get("/health", response_model=HealthResponseSchema, summary="System Health Check")
def health_check(service: ThreatOperationsService = Depends(get_threat_service)):
    """Returns platform operational status and individual subsystem status."""
    return {
        "status": "HEALTHY",
        "system": "AI-Driven Autonomous Cloud Threat Intelligence Platform",
        "version": "1.0.0",
        "services": {
            "s3_worm_vault": "ACTIVE",
            "cloudtrail_pipeline": "ACTIVE",
            "ssh_honeypot": "RUNNING" if service.ssh_honeypot.is_active else "OFFLINE",
            "http_honeypot": "RUNNING" if service.http_honeypot.is_active else "OFFLINE",
            "ml_classifier": "READY",
            "anomaly_detector": "READY"
        }
    }


# ==========================================
# EMPLOYEE PORTAL ACTIVITY & UPLOAD API
# ==========================================

@api_router.post("/portal/activity", summary="Log Corporate Employee Portal Activity Event")
def log_portal_activity(
    payload: Dict[str, Any],
    service: ThreatOperationsService = Depends(get_threat_service)
):
    """
    Ingests events from Corporate Employee Portal (login, failed login, profile update, API probe),
    applies UBA behavioral analysis, scores threats via ML, and dispatches real-time alerts.
    """
    event_name = payload.get("event_name", "EMPLOYEE_ACTION")
    source_ip = payload.get("source_ip", "198.51.100.101")
    user_id = payload.get("user_id", "employee-user")
    country = payload.get("country", "India")
    city = payload.get("city", "Bengaluru")
    device = payload.get("device", "Windows Chrome")

    result = service.log_portal_activity(
        event_name=event_name,
        source_ip=source_ip,
        user_id=user_id,
        country=country,
        city=city,
        device=device,
        payload=payload
    )

    return {
        "status": "PROCESSED",
        "event": result
    }


@api_router.post("/portal/upload", summary="Scan and Upload Corporate Document")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form("employee-user"),
    source_ip: str = Form("198.51.100.101"),
    service: ThreatOperationsService = Depends(get_threat_service)
):
    """
    Receives uploaded corporate file, computes SHA256 hash, scans for malicious patterns (e.g. .exe, .sh, EICAR),
    and logs threat telemetry to SOC engine.
    """
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    filename = file.filename.lower()

    is_malicious = filename.endswith(".exe") or filename.endswith(".sh") or b"EICAR" in contents or b"eval(" in contents
    scan_status = "MALICIOUS_THREAT_DETECTED" if is_malicious else "CLEAN"

    # Route threat log to telemetry pipeline
    event_name = "MALICIOUS_FILE_UPLOAD_ATTEMPT" if is_malicious else "DOCUMENT_UPLOAD"
    service.log_portal_activity(
        event_name=event_name,
        source_ip=source_ip,
        user_id=user_id,
        payload={
            "filename": file.filename,
            "file_size": len(contents),
            "file_hash": file_hash,
            "scan_status": scan_status
        }
    )

    if is_malicious:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload Rejected: Malicious executable or script detected in file '{file.filename}'. Threat reported to SOC."
        )

    return {
        "status": "SUCCESS",
        "filename": file.filename,
        "file_hash": file_hash,
        "scan_status": scan_status
    }


# ==========================================
# INCIDENT INVESTIGATION & TIMELINE API
# ==========================================

@api_router.get("/incidents", summary="Retrieve Incident Investigation Timelines")
def get_incidents(
    db: Session = Depends(get_db),
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all step-by-step incident investigation timelines."""
    incidents = db.query(IncidentTimeline).order_by(IncidentTimeline.created_at.desc()).all()
    if not incidents:
        # Provide baseline timeline if empty
        return {
            "total_incidents": 1,
            "incidents": [
                {
                    "incident_id": "INC-881920",
                    "title": "Privilege Escalation & Unauthorized Policy Attachment",
                    "severity": "HIGH",
                    "status": "OPEN",
                    "source_ip": "198.51.100.45",
                    "user_arn": "arn:aws:iam::123456789012:user/attacker",
                    "steps": [
                        {"step": 1, "title": "Initial Employee Portal Login", "desc": "User logged in from 198.51.100.45 (India)", "timestamp": "2026-08-06T18:00:00Z"},
                        {"step": 2, "title": "UBA Anomaly Detected", "desc": "Geographic shift: India -> Russia (+45 Risk Boost)", "timestamp": "2026-08-06T18:05:00Z"},
                        {"step": 3, "title": "AttachUserPolicy API Probe", "desc": "Attempted AdministratorAccess policy grant", "timestamp": "2026-08-06T18:06:00Z"},
                        {"step": 4, "title": "XGBoost Threat Scoring", "desc": "XGBoost score assigned: 95/100 (HIGH SEVERITY)", "timestamp": "2026-08-06T18:06:05Z"},
                        {"step": 5, "title": "Lambda Remediation Executed", "desc": "Compromised IAM Keys Disabled & Security Group IP Blocked", "timestamp": "2026-08-06T18:06:10Z"}
                    ]
                }
            ]
        }

    formatted = [
        {
            "incident_id": inc.incident_id,
            "title": inc.title,
            "severity": inc.severity,
            "status": inc.status,
            "source_ip": inc.source_ip,
            "user_arn": inc.user_arn,
            "steps": inc.steps_json
        } for inc in incidents
    ]
    return {
        "total_incidents": len(formatted),
        "incidents": formatted
    }


# ==========================================
# USER BEHAVIOR ANALYTICS (UBA) API
# ==========================================

@api_router.get("/uba/profiles", summary="Retrieve User Behavior Profiles")
def get_uba_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves behavioral baselines and anomaly counts for registered users."""
    profiles = db.query(UserBehaviorProfile).all()
    return {
        "total_profiles": len(profiles),
        "profiles": [
            {
                "user_id": p.user_id,
                "usual_country": p.usual_country,
                "usual_city": p.usual_city,
                "usual_device": p.usual_device,
                "total_logins": p.total_logins,
                "anomaly_count": p.anomaly_count,
                "last_login_ip": p.last_login_ip,
                "last_login_country": p.last_login_country
            } for p in profiles
        ]
    }


# ==========================================
# SOC DASHBOARD API ENDPOINTS
# ==========================================

@api_router.get("/logs", summary="Retrieve Ingested Security Logs")
def get_logs(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all normalized telemetry security events."""
    return {
        "total_logs": len(service.all_threat_logs),
        "logs": service.all_threat_logs
    }


@api_router.get("/alerts", summary="Retrieve Dispatched Security Alerts")
def get_alerts(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all dispatched SNS/SOC alert notifications."""
    return {
        "total_alerts": len(service.dispatched_alerts),
        "alerts": service.dispatched_alerts
    }


@api_router.get("/remediations", summary="Retrieve Automated Lambda Remediation Logs")
def get_remediations(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all automated serverless incident response & remediation logs."""
    return {
        "total_remediations": len(service.remediation_handler.remediation_log),
        "remediations": service.remediation_handler.remediation_log
    }


@api_router.get("/threats", summary="Retrieve Active Threat Intel Feeds")
def get_threats(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves detected security threats and high-risk events."""
    high_risk = [e for e in service.all_threat_logs if e.get("is_high_risk", False) or e.get("severity") == "HIGH" or e.get("threat_score", 0) > 70]
    return {
        "total_threats": len(high_risk),
        "threats": high_risk
    }


@api_router.get("/metrics", response_model=MetricsResponseSchema, summary="Retrieve Real-time System Metrics")
def get_metrics(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Calculates real-time SOC metrics and threat counts."""
    return service.get_metrics()


@api_router.get("/dashboard", response_model=DashboardOverviewSchema, summary="Retrieve SOC Dashboard Overview")
def get_dashboard(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Returns complete SOC dashboard telemetry payload."""
    return service.get_dashboard_summary()


# ==========================================
# ATTACK SIMULATION API ENDPOINTS
# ==========================================

@api_router.post("/simulate/cloudtrail", status_code=status.HTTP_201_CREATED, summary="Simulate CloudTrail Log Batch Ingestion")
def simulate_cloudtrail(
    payload: CloudTrailBatchPayloadSchema,
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Processes CloudTrail log batch, normalizes records, and runs ML threat analysis."""
    dict_payload = payload.model_dump()
    result = service.process_cloudtrail_batch(dict_payload)
    return {
        "status": "PROCESSED",
        "ingested_count": result["processed_count"],
        "high_risk_count": result["high_risk_count"],
        "events": result["events"]
    }


@api_router.post("/simulate/ssh-attack", summary="Simulate SSH Honeypot Brute Force Attempt")
def simulate_ssh_attack(
    payload: SSHSimulationSchema,
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Simulates an SSH brute-force attack against Cowrie honeypot trap."""
    telemetry = service.simulate_ssh_attack(payload.source_ip, payload.username, payload.password)
    return {
        "status": "CAPTURED",
        "telemetry": telemetry
    }


@api_router.post("/simulate/http-attack", summary="Simulate HTTP Honeypot Exploit Request")
def simulate_http_attack(
    payload: HTTPSimulationSchema,
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Simulates a web application exploit probe against HTTP honeypot trap."""
    result = service.simulate_http_attack(payload.source_ip, payload.path, payload.method, payload.payload)
    return {
        "status": "CAPTURED",
        "result": result
    }
