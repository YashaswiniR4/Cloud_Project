"""
FastAPI APIRouter definitions for SOC Operations & Employee Portal Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import Dict, Any, List, Optional
import hashlib
from datetime import datetime, timezone

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
from ml.threat_classifier import CyberThreatClassifier

from backend.auth.security import get_current_user
from backend.api.auth import auth_router
from backend.database import crud
from backend.database.models import User, IncidentTimeline, UserBehaviorProfile, EmployeeDocument, Event
from backend.database.database import get_db
from sqlalchemy.orm import Session


def get_threat_service() -> ThreatOperationsService:
    """Dependency Injection provider for Threat Operations Service."""
    return threat_ops_service


api_router = APIRouter()

# Include Authentication Router (/auth/register, /auth/login, /auth/me, /auth/logout)
api_router.include_router(auth_router)

classifier = CyberThreatClassifier()


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
    user_email = payload.get("user_email") or f"{user_id.lower()}@sentinelai.com"
    country = payload.get("country", "India")
    city = payload.get("city", "Bengaluru")
    device = payload.get("device", "Windows Chrome")

    result = service.log_portal_activity(
        event_name=event_name,
        source_ip=source_ip,
        user_id=user_id,
        user_email=user_email,
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
    user_email: str = Form(None),
    source_ip: str = Form("198.51.100.101"),
    db: Session = Depends(get_db),
    service: ThreatOperationsService = Depends(get_threat_service)
):
    """
    Receives uploaded corporate file, computes SHA256 hash, scans for malware & attack signatures via ML model,
    saves clean files to employee document database, and dispatches alerts for malicious payloads.
    """
    contents = await file.read()
    file_hash = hashlib.sha256(contents).hexdigest()
    filename = file.filename

    # ML Classifier payload & malware detection
    attack_label, confidence = classifier.classify_payload_content(filename, contents)
    is_malicious = attack_label != "BENIGN"
    scan_status = attack_label if is_malicious else "CLEAN"

    effective_email = user_email or f"{user_id.lower()}@sentinelai.com"

    if is_malicious:
        # Route high-risk threat event to SOC engine with exact ML attack classification
        service.log_portal_activity(
            event_name=attack_label,
            source_ip=source_ip,
            user_id=user_id,
            user_email=effective_email,
            payload={
                "filename": filename,
                "file_size": len(contents),
                "file_hash": file_hash,
                "scan_status": scan_status,
                "confidence": confidence
            }
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Upload Rejected: Malicious pattern [{attack_label}] detected in file '{filename}'. Threat reported to SOC."
        )

    # Benign file: Save record to EmployeeDocument DB table
    db_user = db.query(User).filter((User.username == user_id) | (User.email == effective_email)).first()
    db_user_id = db_user.id if db_user else user_id

    doc_record = EmployeeDocument(
        user_id=db_user_id,
        filename=filename,
        file_size_bytes=len(contents),
        file_hash=file_hash,
        is_malicious=False,
        scan_result="CLEAN",
        uploaded_at=datetime.now(timezone.utc)
    )
    db.add(doc_record)
    db.commit()

    # Log normal background telemetry event (Low Threat Score: 10.0, Severity: LOW - No alert dispatched)
    service.log_portal_activity(
        event_name="BENIGN_DOCUMENT_UPLOAD",
        source_ip=source_ip,
        user_id=user_id,
        user_email=effective_email,
        payload={
            "filename": filename,
            "file_size": len(contents),
            "file_hash": file_hash,
            "scan_status": "CLEAN"
        }
    )

    return {
        "status": "SUCCESS",
        "message": "Document uploaded successfully and scanned clean.",
        "filename": filename,
        "file_hash": file_hash,
        "scan_status": "CLEAN"
    }


@api_router.get("/portal/documents", summary="Retrieve Uploaded Employee Documents")
def get_user_documents(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves all clean uploaded corporate documents for display in employee repository."""
    query = db.query(EmployeeDocument).filter(EmployeeDocument.is_malicious == False)
    if user_id:
        db_user = db.query(User).filter(User.username == user_id).first()
        if db_user:
            query = query.filter(EmployeeDocument.user_id == db_user.id)
    
    docs = query.order_by(EmployeeDocument.uploaded_at.desc()).all()
    return {
        "total_documents": len(docs),
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "file_size_kb": round(doc.file_size_bytes / 1024, 2),
                "file_hash": doc.file_hash,
                "scan_result": doc.scan_result,
                "uploaded_at": doc.uploaded_at.isoformat()
            } for doc in docs
        ]
    }


@api_router.get("/portal/activity-history", summary="Retrieve Personal Portal Activity History")
def get_user_activity_history(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves recent personal portal activities for display under Activity History tab."""
    query = db.query(Event).filter(Event.event_source == "corporate.employee.portal")
    events = query.order_by(Event.created_at.desc()).limit(20).all()
    
    return {
        "total_activities": len(events),
        "activities": [
            {
                "id": ev.event_id,
                "event": ev.event_name,
                "ip": ev.source_ip,
                "user_id": ev.raw_payload.get("user_id") if isinstance(ev.raw_payload, dict) else "User",
                "time": ev.event_time,
                "status": "Blocked" if ev.is_high_risk else "Completed"
            } for ev in events
        ]
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
        return {
            "total_incidents": 1,
            "incidents": [
                {
                    "incident_id": "INC-881920",
                    "title": "Privilege Escalation & Unauthorized Policy Attachment",
                    "severity": "HIGH",
                    "status": "OPEN",
                    "source_ip": "198.51.100.45",
                    "user_arn": "arn:aws:iam::123456789012:user/Attacker_Admin_Probe",
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
    """Retrieves automated incident response remediation logs."""
    remediations = service.get_dashboard_summary()["remediation_actions"]
    return {
        "total_remediations": len(remediations),
        "remediations": remediations
    }


@api_router.get("/threats", summary="Retrieve Threat Intelligence Feed Data")
def get_threats(
    db: Session = Depends(get_db),
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves IP reputation scores from Threat Intel Feed."""
    threats = crud.get_all_threat_intel(db)
    return {
        "total_threats": len(threats),
        "threats": [
            {
                "source_ip": t.source_ip,
                "reputation_score": t.reputation_score,
                "category": t.category,
                "isp": t.isp,
                "total_attacks": t.total_attacks,
                "last_seen": t.last_seen.isoformat()
            } for t in threats
        ]
    }


@api_router.get("/metrics", response_model=MetricsResponseSchema, summary="Retrieve SOC Performance Metrics")
def get_metrics(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves aggregated operational metrics for SOC dashboard cards."""
    return service.get_metrics()


@api_router.get("/dashboard", summary="Retrieve Complete SOC Dashboard Dataset")
def get_dashboard(
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Retrieves full telemetry, alerts, honeypots, and remediation status for SOC frontend."""
    return service.get_dashboard_summary()


# ==========================================
# THREAT SIMULATION ENDPOINTS
# ==========================================

@api_router.post("/simulate/cloudtrail", status_code=status.HTTP_201_CREATED, summary="Simulate CloudTrail Telemetry Batch")
def simulate_cloudtrail(
    payload: CloudTrailBatchPayloadSchema,
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Ingests simulated raw CloudTrail log batch into pipeline."""
    res = service.process_cloudtrail_batch(payload.dict())
    return {
        "status": "PROCESSED",
        "ingested_count": res.get("processed_count", 0),
        "processed_count": res.get("processed_count", 0),
        "high_risk_count": res.get("high_risk_count", 0),
        "events": res.get("events", [])
    }


@api_router.post("/simulate/ssh-attack", summary="Simulate SSH Honeypot Brute-Force Attack")
def simulate_ssh_attack(
    payload: SSHSimulationSchema,
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Simulates SSH brute force attack attempt against Cowrie Honeypot."""
    res = service.simulate_ssh_attack(
        source_ip=payload.source_ip,
        username=payload.username,
        password=payload.password
    )
    return {
        "status": "CAPTURED",
        "telemetry": res
    }


@api_router.post("/simulate/http-attack", summary="Simulate Web Exploit Probe")
def simulate_http_attack(
    payload: HTTPSimulationSchema,
    service: ThreatOperationsService = Depends(get_threat_service),
    current_user: User = Depends(get_current_user)
):
    """Simulates HTTP exploit payload probe against Web Deception Trap."""
    res = service.simulate_http_attack(
        source_ip=payload.source_ip,
        path=payload.path,
        method=payload.method,
        payload=payload.payload
    )
    return {
        "status": "CAPTURED",
        "result": res
    }
