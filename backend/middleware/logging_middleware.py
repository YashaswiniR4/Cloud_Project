"""
FastAPI Request Logging & Processing Time Middleware
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from config.logging_config import logger


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        logger.info(f"API Request Received: {request.method} {request.url.path}")

        try:
            response = await call_next(request)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.info(f"API Response: {request.method} {request.url.path} - Status {response.status_code} ({duration_ms}ms)")
            response.headers["X-Process-Time-Ms"] = str(duration_ms)
            return response
        except Exception as err:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            logger.error(f"API Request Exception: {request.method} {request.url.path} - Error: {err} ({duration_ms}ms)")
            raise err
