"""
FastAPI APIRouter definitions for SOC Operations Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List

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


def get_threat_service() -> ThreatOperationsService:
    """Dependency Injection provider for Threat Operations Service."""
    return threat_ops_service


api_router = APIRouter()


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


@api_router.get("/logs", summary="Retrieve Ingested Security Logs")
def get_logs(service: ThreatOperationsService = Depends(get_threat_service)):
    """Retrieves all normalized telemetry security events."""
    return {
        "total_logs": len(service.all_threat_logs),
        "logs": service.all_threat_logs
    }


@api_router.get("/alerts", summary="Retrieve Dispatched Security Alerts")
def get_alerts(service: ThreatOperationsService = Depends(get_threat_service)):
    """Retrieves all dispatched SNS/SOC alert notifications."""
    return {
        "total_alerts": len(service.dispatched_alerts),
        "alerts": service.dispatched_alerts
    }


@api_router.get("/threats", summary="Retrieve Active Threat Intel Feeds")
def get_threats(service: ThreatOperationsService = Depends(get_threat_service)):
    """Retrieves detected security threats and high-risk events."""
    high_risk = [e for e in service.all_threat_logs if e.get("is_high_risk", False) or e.get("threat_score", 0) > 70]
    return {
        "total_threats": len(high_risk),
        "threats": high_risk
    }


@api_router.get("/metrics", response_model=MetricsResponseSchema, summary="Retrieve Real-time System Metrics")
def get_metrics(service: ThreatOperationsService = Depends(get_threat_service)):
    """Calculates real-time SOC metrics and threat counts."""
    return service.get_metrics()


@api_router.get("/dashboard", response_model=DashboardOverviewSchema, summary="Retrieve SOC Dashboard Overview")
def get_dashboard(service: ThreatOperationsService = Depends(get_threat_service)):
    """Returns complete SOC dashboard telemetry payload."""
    return service.get_dashboard_summary()


@api_router.post("/simulate/cloudtrail", status_code=status.HTTP_201_CREATED, summary="Simulate CloudTrail Log Batch Ingestion")
def simulate_cloudtrail(payload: CloudTrailBatchPayloadSchema, service: ThreatOperationsService = Depends(get_threat_service)):
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
def simulate_ssh_attack(payload: SSHSimulationSchema, service: ThreatOperationsService = Depends(get_threat_service)):
    """Simulates an SSH brute-force attack against Cowrie honeypot trap."""
    telemetry = service.simulate_ssh_attack(payload.source_ip, payload.username, payload.password)
    return {
        "status": "CAPTURED",
        "telemetry": telemetry
    }


@api_router.post("/simulate/http-attack", summary="Simulate HTTP Honeypot Exploit Request")
def simulate_http_attack(payload: HTTPSimulationSchema, service: ThreatOperationsService = Depends(get_threat_service)):
    """Simulates a web application exploit probe against HTTP honeypot trap."""
    result = service.simulate_http_attack(payload.source_ip, payload.path, payload.method, payload.payload)
    return {
        "status": "CAPTURED",
        "result": result
    }
