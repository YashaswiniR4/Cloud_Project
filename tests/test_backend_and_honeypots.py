"""
Unit & Integration tests for Sprint 3: REST Backend & Adaptive Honeypot Engines
"""

import unittest
import json
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.honeypots.ssh_honeypot import SSHHoneypotEngine
from backend.honeypots.http_honeypot import HTTPHoneypotEngine
from backend.server import ThreatIntelRESTHandler


class TestSprint3BackendAndHoneypots(unittest.TestCase):
    def test_ssh_honeypot_deception(self):
        ssh_trap = SSHHoneypotEngine(port=2222)
        res = ssh_trap.start_honeypot()
        self.assertEqual(res["status"], "RUNNING")
        self.assertTrue(ssh_trap.is_active)

        entry = ssh_trap.simulate_attack_attempt("198.51.100.50", "root", "toor")
        self.assertEqual(entry["attack_type"], "SSH_BRUTE_FORCE")
        self.assertEqual(entry["threat_score"], 90.0)
        self.assertEqual(len(ssh_trap.get_captured_telemetry()), 1)

    def test_http_honeypot_deception(self):
        http_trap = HTTPHoneypotEngine(port=8080)
        http_trap.start_honeypot()

        # SQLi attack probe
        res = http_trap.handle_request("203.0.113.99", "/login", "POST", payload="' OR '1'='1")
        telemetry = res["telemetry_recorded"]
        self.assertEqual(telemetry["threat_type"], "SQL_INJECTION")
        self.assertEqual(telemetry["threat_score"], 95.0)

        # Config probe
        res_env = http_trap.handle_request("203.0.113.99", "/.env", "GET")
        telemetry_env = res_env["telemetry_recorded"]
        self.assertEqual(telemetry_env["threat_type"], "RECON_CONFIG_EXPOSURE")


if __name__ == "__main__":
    unittest.main()
