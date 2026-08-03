"""
Pydantic Request and Response Schemas for Telemetry and Simulation
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional


class CloudTrailRecordSchema(BaseModel):
    eventID: Optional[str] = Field(None, description="CloudTrail Event ID")
    eventName: str = Field(..., description="AWS API Event Name (e.g. AttachUserPolicy)")
    eventTime: Optional[str] = Field(None, description="ISO Timestamp")
    eventSource: Optional[str] = Field("iam.amazonaws.com", description="AWS Service Source")
    awsRegion: Optional[str] = Field("us-east-1", description="AWS Region")
    sourceIPAddress: Optional[str] = Field("198.51.100.45", description="Source IPv4 Address")
    userIdentity: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User Identity context")
    errorCode: Optional[str] = Field(None, description="AWS Error Code (e.g. AccessDenied)")


class CloudTrailBatchPayloadSchema(BaseModel):
    Records: List[CloudTrailRecordSchema] = Field(..., description="Batch of CloudTrail event records")


class SSHSimulationSchema(BaseModel):
    source_ip: str = Field("198.51.100.45", description="Attacker IPv4 Address")
    username: str = Field("admin", description="Target SSH Username")
    password: str = Field("password123", description="Attempted Password")


class HTTPSimulationSchema(BaseModel):
    source_ip: str = Field("203.0.113.88", description="Attacker IPv4 Address")
    path: str = Field("/admin", description="Target HTTP Path")
    method: str = Field("GET", description="HTTP Method")
    payload: str = Field("UNION SELECT * FROM users", description="Web attack payload string")
