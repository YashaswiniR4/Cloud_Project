"""
Adaptive SSH Honeypot Listener Engine
Simulates an SSH service trap to record unauthorized brute-force attempts and login payloads.
"""

from typing import Dict, Any, List
from datetime import datetime, timezone
from config.settings import settings
from config.logging_config import logger


class SSHHoneypotEngine:
    def __init__(self, port: int = None):
        self.port = port if port is not None else settings.SSH_HONEYPOT_PORT
        self.is_active = False
        self.captured_logs: List[Dict[str, Any]] = []

    def start_honeypot(self) -> Dict[str, Any]:
        """Starts SSH deception trap listener."""
        self.is_active = True
        logger.info(f"SSH Honeypot Trap Engine Started on port {self.port}")
        return {
            "status": "RUNNING",
            "service": "SSH_HONEYPOT",
            "port": self.port,
            "banner": "OpenSSH_8.9p1 Ubuntu-3ubuntu0.1"
        }

    def simulate_attack_attempt(self, source_ip: str, username: str, password_attempt: str) -> Dict[str, Any]:
        """Logs an incoming SSH brute-force attempt."""
        if not self.is_active:
            logger.error("SSH Honeypot attack attempt received while engine was offline.")
            raise RuntimeError("SSH Honeypot engine is offline.")

        timestamp = datetime.now(timezone.utc).isoformat()
        log_entry = {
            "timestamp": timestamp,
            "source_ip": source_ip,
            "username": username,
            "password": password_attempt,
            "attack_type": "SSH_BRUTE_FORCE",
            "threat_score": 90.0
        }
        self.captured_logs.append(log_entry)
        logger.warning(f"SSH Brute Force Captured: User '{username}' from IP {source_ip}")
        return log_entry

    def get_captured_telemetry(self) -> List[Dict[str, Any]]:
        """Returns all captured SSH exploit telemetry."""
        return self.captured_logs

    def stop_honeypot(self):
        """Stops SSH trap."""
        self.is_active = False
        logger.info("SSH Honeypot Trap Engine Stopped.")


if __name__ == "__main__":
    ssh_trap = SSHHoneypotEngine()
    logger.info(f"Start SSH Honeypot: {ssh_trap.start_honeypot()}")
