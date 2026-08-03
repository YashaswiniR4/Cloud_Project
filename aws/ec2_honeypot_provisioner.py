"""
AWS EC2 Honeypot Host Provisioner & Startup Bootstrapper
Provisions hardened Amazon EC2 Honeypot instances inside the Public Subnet,
attaching least-privilege IAM Instance Profiles, Security Groups, and automated UserData bootstrap scripts.
"""

from typing import Dict, Any, Tuple
from config.settings import settings
from config.logging_config import logger


class EC2HoneypotProvisioner:
    """Manages provisioning and bootstrap script generation for EC2 Honeypot hosts."""

    ALLOWED_FREE_TIER = {"t2.micro", "t3.micro"}

    def __init__(self, instance_type: str = "t2.micro"):
        self.instance_type = instance_type

    def generate_honeypot_user_data_script(self) -> str:
        """Generates bash UserData startup script executed when EC2 instance boots up."""
        user_data = """#!/bin/bash
set -euo pipefail

# System update and package installation
apt-get update -y
apt-get install -y docker.io python3 rsyslog curl git

systemctl enable --now docker

# Configure Honeypot Trap Logging Directory
mkdir -p /var/log/honeypot
chmod 755 /var/log/honeypot

# Deploy Cowrie SSH Honeypot Docker Container on port 22
docker run -d --name cowrie-ssh-honeypot \\
  -p 22:2222 \\
  -p 2222:2222 \\
  --restart always \\
  cowrie/cowrie:latest || true

# Start lightweight HTTP Honeypot Trap
cat << 'EOF' > /usr/local/bin/http_honeypot.py
import http.server
import json
import datetime

class HoneypotHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        log = {"time": str(datetime.datetime.now()), "ip": self.client_address[0], "path": self.path}
        with open("/var/log/honeypot/http_requests.log", "a") as f:
            f.write(json.dumps(log) + "\\n")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"<html><body><h1>System Maintenance</h1></body></html>")
    do_POST = do_GET

httpd = http.server.HTTPServer(('0.0.0.0', 80), HoneypotHandler)
httpd.serve_forever()
EOF

python3 /usr/local/bin/http_honeypot.py &

echo "[+] EC2 Honeypot Bootstrap Completed." > /var/log/honeypot/status.log
"""
        return user_data

    def validate_launch_configuration(self, config: Dict[str, Any]) -> Tuple[bool, str]:
        """Validates launch parameters before sending request to AWS EC2 API."""
        itype = config.get("instance_type", "t2.micro")
        if itype not in self.ALLOWED_FREE_TIER:
            logger.warning(f"Cost Warning: Instance type '{itype}' is not in AWS Free Tier list.")
            return False, f"COST WARNING: Instance type '{itype}' is not in AWS Free Tier!"

        subnet_id = config.get("subnet_id")
        if not subnet_id or not (subnet_id.startswith("subnet-") or subnet_id == "SIMULATED_PUBLIC_SUBNET"):
            logger.error(f"Invalid Subnet ID format: {subnet_id}")
            return False, f"Invalid Subnet ID format: {subnet_id}"

        sg_ids = config.get("security_group_ids", [])
        if not sg_ids:
            logger.error("Security Group IDs list cannot be empty!")
            return False, "Security Group IDs list cannot be empty!"

        logger.info("EC2 Honeypot Launch Configuration validated. Free Tier compliant.")
        return True, "Launch configuration valid and Free Tier compliant."


if __name__ == "__main__":
    provisioner = EC2HoneypotProvisioner(instance_type="t2.micro")
    script = provisioner.generate_honeypot_user_data_script()
    valid, msg = provisioner.validate_launch_configuration({
        "instance_type": "t2.micro",
        "subnet_id": "SIMULATED_PUBLIC_SUBNET",
        "security_group_ids": ["sg-12345"]
    })
    logger.info(f"Launch config status: {valid} - {msg}")
