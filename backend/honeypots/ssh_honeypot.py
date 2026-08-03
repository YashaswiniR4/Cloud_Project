"""
Adaptive SSH Honeypot Listener Engine
Simulates an SSH service trap to record unauthorized brute-force attempts and login payloads.
"""

import time
from typing import Dict, Any, List
from datetime import datetime, timezone


class SSHHoneypotEngine:
    def __init__(self, port: int = 2222):
        self.port = port
        self.is_active = False
        self.captured_logs: List[Dict[str, Any]] = []

    def start_honeypot(self) -> Dict[str, Any]:
        """Starts SSH deception trap listener."""
        self.is_active = True
        return {
            "status": "RUNNING",
            "service": "SSH_HONEYPOT",
            "port": self.port,
            "banner": "OpenSSH_8.9p1 Ubuntu-3ubuntu0.1"
        }

    def simulate_attack_attempt(self, source_ip: str, username: str, password_attempt: str) -> Dict[str, Any]:
        """Logs an incoming SSH brute-force attempt."""
        if not self.is_active:
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
        return log_entry

    def get_captured_telemetry(self) -> List[Dict[str, Any]]:
        """Returns all captured SSH exploit telemetry."""
        return self.captured_logs

    def stop_honeypot(self):
        """Stops SSH trap."""
        self.is_active = False


if __name__ == "__main__":
    ssh_trap = SSHHoneypotEngine()
    print(ssh_trap.start_honeypot())
    entry = ssh_trap.simulate_attack_attempt("198.51.100.22", "root", "admin123")
    print("Captured ssh attack:", entry)
