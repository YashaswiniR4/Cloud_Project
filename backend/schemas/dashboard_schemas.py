"""
Pydantic Schemas for Health, Metrics, Alerts, Threats, and Dashboard
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


class HealthResponseSchema(BaseModel):
    status: str = "HEALTHY"
    system: str = "AI-Driven Autonomous Cloud Threat Intelligence Platform"
    version: str = "1.0.0"
    services: Dict[str, str]


class MetricsResponseSchema(BaseModel):
    total_ingested_events: int
    high_risk_threats: int
    anomalies_detected: int
    alerts_dispatched: int
    honeypot_attacks_captured: int
    worm_audit_logs_count: int


class DashboardOverviewSchema(BaseModel):
    system_status: str
    metrics: MetricsResponseSchema
    recent_threats: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    honeypot_summary: Dict[str, Any]
