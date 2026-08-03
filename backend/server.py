"""
Autonomous Threat Intelligence Platform - REST API Backend Server Wrapper
Exposes FastAPI application via uvicorn for production & development compatibility,
while maintaining backwards compatibility for legacy handler references.
"""

import uvicorn
from config.settings import settings
from config.logging_config import logger
from backend.main import app


class ThreatIntelRESTHandler:
    """Legacy REST handler wrapper for backwards compatibility."""
    pass


def run_server(port: int = None):
    server_port = port or settings.PORT
    logger.info(f"Starting FastAPI Security Operations Center Backend on port {server_port}...")
    uvicorn.run(app, host="0.0.0.0", port=server_port)


if __name__ == "__main__":
    run_server()
