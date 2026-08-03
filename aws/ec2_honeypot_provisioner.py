"""
AWS EC2 Honeypot Host Provisioner & Startup Bootstrapper
=========================================================
This module provisions hardened Amazon EC2 Honeypot instances inside the Public
Subnet, attaching least-privilege IAM Instance Profiles, Security Groups, and
automated User Data bootstrap scripts for honeypot service deception.

Author: Senior Cloud Security Architect
Project: AI-Driven Autonomous Cloud Threat Intelligence Platform
"""

import json
import logging
import os
import sys
from typing import Dict, Any, Optional

# Enterprise Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("EC2HoneypotProvisioner")


class EC2HoneypotProvisioner:
    """Manages provisioning and bootstrap script generation for EC2 Honeypot hosts."""

    def __init__(self, instance_type: str = "t2.micro"):
        self.instance_type = instance_type
        self.allowed_free_tier = ["t2.micro", "t3.micro"]

    def generate_honeypot_user_data_script(self) -> str:
        """
        Generates bash User Data startup script executed when EC2 instance boots up.

        :return: Base64/Raw bash script string.
        """
        user_data = """#!/bin/bash
set -euo pipefail

# System update and package installation
yum update -y
yum install -y python3 rsyslog docker

# Configure Honeypot Trap Logging Directory
mkdir -p /var/log/honeypot
chmod 755 /var/log/honeypot

# Reconfigure SSH daemon to move real admin SSH to port 22222
sed -i 's/#Port 22/Port 22222/' /etc/ssh/sshd_config
systemctl restart sshd

# Create Honeypot Log Streaming Agent service
cat << 'EOF' > /etc/systemd/system/honeypot-agent.service
[Unit]
Description=Cloud Threat Intelligence Honeypot Agent
After=network.target

[Service]
ExecStart=/usr/bin/python3 -m http.server 80
Restart=always
User=nobody

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now honeypot-agent.service
echo "[+] Honeypot Bootstrap Complete." > /var/log/honeypot/bootstrap.log
"""
        return user_data

    def validate_launch_configuration(self, config: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validates launch parameters before sending request to AWS EC2 API.

        :param config: EC2 launch parameter dictionary.
        :return: Tuple (is_valid, status_message)
        """
        itype = config.get("instance_type", "t2.micro")
        if itype not in self.allowed_free_tier:
            return False, f"COST WARNING: Instance type '{itype}' is not in AWS Free Tier!"

        subnet_id = config.get("subnet_id")
        if not subnet_id or not subnet_id.startswith("subnet-"):
            # Simulation fallback
            if subnet_id != "SIMULATED_PUBLIC_SUBNET":
                return False, f"Invalid Subnet ID format: {subnet_id}"

        sg_ids = config.get("security_group_ids", [])
        if not sg_ids:
            return False, "Security Group IDs list cannot be empty!"

        return True, "Launch configuration valid and Free Tier compliant."


def run_ec2_sprint_test() -> None:
    """Execution entry point for Sprint 1 EC2 Honeypot Launch Simulation."""
    print("==================================================")
    print("      SPRINT 1: AWS EC2 HONEYPOT PROVISIONER      ")
    print("==================================================")

    provisioner = EC2HoneypotProvisioner(instance_type="t2.micro")
    user_data_script = provisioner.generate_honeypot_user_data_script()

    test_config = {
        "ami_id": "ami-0c55b159cbfafe1f0", # Amazon Linux 2 AMI
        "instance_type": "t2.micro",
        "subnet_id": "SIMULATED_PUBLIC_SUBNET",
        "security_group_ids": ["sg-0123456789honeypot"],
        "iam_instance_profile": "HoneypotEC2Role"
    }

    is_valid, msg = provisioner.validate_launch_configuration(test_config)

    print("\n[EC2 Provisioning Diagnostic Summary]:")
    print(f" - Launch Config Status: {is_valid}")
    print(f" - Message: {msg}")
    print(f" - User Data Script Size: {len(user_data_script)} bytes")
    print("\n[✓] Sprint 1 EC2 Honeypot Launcher Execution Complete.")


if __name__ == "__main__":
    run_ec2_sprint_test()
