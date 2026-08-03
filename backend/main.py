"""
FastAPI Enterprise Application Entry Point - Security Operations Center Backend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config.settings import settings
from config.logging_config import logger
from backend.middleware.logging_middleware import LoggingMiddleware
from backend.api.router import api_router

app = FastAPI(
    title="AI-Driven Autonomous Cloud Threat Intelligence Platform API",
    description="Enterprise REST API for real-time CloudTrail ingestion, ML threat classification, honeypot traps, and SOC alerting.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
app.add_middleware(LoggingMiddleware)

# Include API Router
app.include_router(api_router)


@app.on_event("startup")
def startup_event():
    logger.info("FastAPI Security Operations Center Backend Started Successfully.")


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
