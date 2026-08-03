"""
Adaptive HTTP Honeypot Deception Server
Simulates vulnerable web endpoints (/admin, /wp-login.php, /.env) to capture web exploit payloads.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone


class HTTPHoneypotEngine:
    def __init__(self, port: int = 8080):
        self.port = port
        self.is_active = False
        self.captured_logs: List[Dict[str, Any]] = []

    def start_honeypot(self) -> Dict[str, Any]:
        """Starts HTTP deception web server listener."""
        self.is_active = True
        return {
            "status": "RUNNING",
            "service": "HTTP_HONEYPOT",
            "port": self.port,
            "simulated_routes": ["/admin", "/wp-login.php", "/api/v1/debug", "/.env"]
        }

    def handle_request(self, source_ip: str, path: str, method: str = "GET", headers: Dict[str, str] = None, payload: str = "") -> Dict[str, Any]:
        """Processes request to honeypot trap, logs threat vector."""
        if not self.is_active:
            raise RuntimeError("HTTP Honeypot engine is offline.")

        headers = headers or {}
        timestamp = datetime.now(timezone.utc).isoformat()
        threat_type = "WEB_PROBE"
        threat_score = 40.0

        if "' OR '1'='1" in payload or "UNION SELECT" in payload.upper():
            threat_type = "SQL_INJECTION"
            threat_score = 95.0
        elif ".env" in path or "config" in path:
            threat_type = "RECON_CONFIG_EXPOSURE"
            threat_score = 80.0
        elif "cmd=" in path or "exec" in payload:
            threat_type = "REMOTE_CODE_EXECUTION"
            threat_score = 98.0

        log_entry = {
            "timestamp": timestamp,
            "source_ip": source_ip,
            "path": path,
            "method": method,
            "user_agent": headers.get("User-Agent", "Unknown"),
            "payload": payload,
            "threat_type": threat_type,
            "threat_score": threat_score
        }
        self.captured_logs.append(log_entry)
        return {
            "http_status": 200 if path == "/" else 404,
            "response_body": "<html><body>Access Denied</body></html>",
            "telemetry_recorded": log_entry
        }

    def get_captured_telemetry(self) -> List[Dict[str, Any]]:
        """Returns all recorded HTTP attack logs."""
        return self.captured_logs


if __name__ == "__main__":
    http_trap = HTTPHoneypotEngine()
    print(http_trap.start_honeypot())
    res = http_trap.handle_request("203.0.113.88", "/admin?cmd=cat%20/etc/passwd", "GET")
    print("Handled request:", res)
