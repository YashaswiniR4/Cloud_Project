"""
Autonomous Threat Intelligence Platform - REST API Backend Server
Provides standard REST endpoints for telemetry ingestion, threat monitoring, and honeypot control.
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from typing import Dict, Any, List

from config.settings import settings
from config.logging_config import logger

from aws.s3_worm_vault import S3WORMVaultManager
from aws.cloudtrail_ingestor import CloudTrailIngestor
from backend.honeypots.ssh_honeypot import SSHHoneypotEngine
from backend.honeypots.http_honeypot import HTTPHoneypotEngine

# Global Shared System State
vault_manager = S3WORMVaultManager()
cloudtrail_ingestor = CloudTrailIngestor()
ssh_honeypot = SSHHoneypotEngine()
http_honeypot = HTTPHoneypotEngine()

# Initialize Honeypots
ssh_honeypot.start_honeypot()
http_honeypot.start_honeypot()

# Sample In-Memory Threat Feed Store
threat_events_store: List[Dict[str, Any]] = []


class ThreatIntelRESTHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Overrides default HTTPServer logging to use system logger."""
        logger.info(f"HTTP Server Request: {self.address_string()} - {format % args}")

    def _send_json_response(self, status_code: int, data: Dict[str, Any]):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path

        if path == "/health":
            self._send_json_response(200, {
                "status": "HEALTHY",
                "system": "Autonomous Cloud Threat Intelligence Platform",
                "version": "1.0.0",
                "services": {
                    "s3_vault": "ACTIVE",
                    "cloudtrail_ingestor": "ACTIVE",
                    "ssh_honeypot": "RUNNING" if ssh_honeypot.is_active else "STOPPED",
                    "http_honeypot": "RUNNING" if http_honeypot.is_active else "STOPPED"
                }
            })
        elif path == "/api/v1/threats":
            self._send_json_response(200, {
                "total_threats": len(threat_events_store),
                "events": threat_events_store
            })
        elif path == "/api/v1/honeypot/status":
            self._send_json_response(200, {
                "ssh_honeypot": {
                    "status": "RUNNING" if ssh_honeypot.is_active else "OFFLINE",
                    "captured_logs_count": len(ssh_honeypot.get_captured_telemetry()),
                    "logs": ssh_honeypot.get_captured_telemetry()
                },
                "http_honeypot": {
                    "status": "RUNNING" if http_honeypot.is_active else "OFFLINE",
                    "captured_logs_count": len(http_honeypot.get_captured_telemetry()),
                    "logs": http_honeypot.get_captured_telemetry()
                }
            })
        else:
            self._send_json_response(404, {"error": "Endpoint not found"})

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            payload = json.loads(body)
        except json.JSONDecodeError as err:
            logger.error(f"Malformed JSON payload in request to {path}: {err}")
            self._send_json_response(400, {"error": "Invalid JSON format"})
            return

        if path == "/api/v1/telemetry":
            parsed_events = cloudtrail_ingestor.ingest_log_batch(payload)
            for event in parsed_events:
                threat_events_store.append(event)
                if event["is_high_risk"]:
                    vault_manager.put_immutable_log(f"audit/{event['event_id']}.json", event)

            self._send_json_response(201, {
                "status": "PROCESSED",
                "ingested_count": len(parsed_events),
                "high_risk_count": len([e for e in parsed_events if e["is_high_risk"]])
            })
        elif path == "/api/v1/honeypot/simulate/ssh":
            ip = payload.get("source_ip", "192.0.2.1")
            user = payload.get("username", "admin")
            pwd = payload.get("password", "password123")
            result = ssh_honeypot.simulate_attack_attempt(ip, user, pwd)
            threat_events_store.append(result)
            self._send_json_response(200, {"status": "CAPTURED", "telemetry": result})
        elif path == "/api/v1/honeypot/simulate/http":
            ip = payload.get("source_ip", "192.0.2.2")
            req_path = payload.get("path", "/admin")
            method = payload.get("method", "GET")
            pay = payload.get("payload", "")
            result = http_honeypot.handle_request(ip, req_path, method, payload=pay)
            threat_events_store.append(result["telemetry_recorded"])
            self._send_json_response(200, {"status": "CAPTURED", "result": result})
        else:
            self._send_json_response(404, {"error": "Endpoint not found"})


def run_server(port: int = None):
    server_port = port or settings.PORT
    server_address = ("", server_port)
    httpd = HTTPServer(server_address, ThreatIntelRESTHandler)
    logger.info(f"Autonomous Threat Intel Backend Server running on port {server_port}...")
    httpd.serve_forever()


if __name__ == "__main__":
    run_server()
