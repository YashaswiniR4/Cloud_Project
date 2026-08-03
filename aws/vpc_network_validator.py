"""
AWS VPC Network Infrastructure & Zero Trust Security Group Validator
=====================================================================
This module validates Cloud Networking topology, computes CIDR subnet allocations,
checks Zero Trust security group isolation rules, and verifies Network ACL (NACL)
configurations prior to CloudFormation deployment.

Author: Senior Cloud Security Architect
Project: AI-Driven Autonomous Cloud Threat Intelligence Platform
"""

import ipaddress
import json
import logging
import os
import sys
from typing import Dict, List, Any, Tuple

# Configure enterprise logging standard
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("VPCNetworkValidator")


class VPCNetworkValidator:
    """Validates VPC IP CIDR blocks, subnet micro-segmentation, and Security Group boundaries."""

    def __init__(self, vpc_cidr: str = "10.0.0.0/16"):
        """
        Initialize the VPC Network Validator.

        :param vpc_cidr: Primary VPC CIDR block (Default: 10.0.0.0/16)
        """
        self.vpc_network = ipaddress.ip_network(vpc_cidr)
        self.subnets: Dict[str, ipaddress.IPv4Network] = {}
        logger.info(f"Initialized VPC Validator for network: {self.vpc_network}")

    def add_subnet(self, name: str, cidr: str) -> bool:
        """
        Adds a subnet to the network topology and verifies it is contained within the VPC.

        :param name: Subnet identifier name
        :param cidr: Subnet IPv4 CIDR string
        :return: True if valid and non-overlapping, False otherwise.
        """
        try:
            subnet_net = ipaddress.ip_network(cidr)
            if not subnet_net.subnet_of(self.vpc_network):
                logger.error(f"Subnet {name} ({cidr}) is NOT within VPC CIDR ({self.vpc_network})")
                return False

            # Check overlap against existing subnets
            for existing_name, existing_net in self.subnets.items():
                if subnet_net.overlaps(existing_net):
                    logger.error(f"Subnet {name} ({cidr}) OVERLAPS with existing subnet {existing_name} ({existing_net})")
                    return False

            self.subnets[name] = subnet_net
            logger.info(f"Successfully added subnet [{name}]: {cidr} ({subnet_net.num_addresses} IP addresses)")
            return True
        except ValueError as e:
            logger.error(f"Invalid CIDR format for {name}: {e}")
            return False

    def validate_zero_trust_rules(self, security_groups: List[Dict[str, Any]]) -> List[str]:
        """
        Audits Security Group rules against Zero Trust security principles.

        :param security_groups: List of security group rule definitions
        :return: List of security violation warning strings.
        """
        violations = []
        for sg in security_groups:
            sg_name = sg.get("name", "UnknownSG")
            ingress_rules = sg.get("ingress", [])

            for rule in ingress_rules:
                port = rule.get("port")
                source = rule.get("source")

                # Critical Rule 1: Database (Port 5432) must NEVER be exposed to 0.0.0.0/0
                if port == 5432 and source == "0.0.0.0/0":
                    violations.append(
                        f"CRITICAL VIOLATION in [{sg_name}]: PostgreSQL Port 5432 is exposed to global internet 0.0.0.0/0!"
                    )

                # Critical Rule 2: Honeypot must not share security group with backend app
                if port in [2222, 80] and "backend" in sg_name.lower():
                    violations.append(
                        f"WARNING in [{sg_name}]: Honeypot port {port} detected in backend Security Group!"
                    )

        if not violations:
            logger.info("Zero Trust Security Group Audit: PASSED (No critical isolation breaches).")
        else:
            for v in violations:
                logger.warning(v)

        return violations

    def validate_cloudformation_networking(self, cf_template_path: str) -> bool:
        """
        Inspects CloudFormation template YAML to ensure all networking components exist.

        :param cf_template_path: Path to CloudFormation YAML file
        :return: True if all required VPC resources exist.
        """
        if not os.path.exists(cf_template_path):
            logger.error(f"CloudFormation file not found: {cf_template_path}")
            return False

        try:
            with open(cf_template_path, "r", encoding="utf-8") as f:
                content = f.read()

            required_resources = [
                "HoneypotVPC",
                "HoneypotPublicSubnet",
                "PrivateAppSubnet",
                "PrivateDBSubnet",
                "InternetGateway",
                "PublicRouteTable",
                "PrivateRouteTable",
                "HoneypotSecurityGroup",
                "BackendSecurityGroup",
                "DatabaseSecurityGroup",
                "PublicSubnetNACL",
                "PrivateSubnetNACL"
            ]

            missing = [r for r in required_resources if r not in content]

            if missing:
                logger.error(f"CloudFormation template is missing network resources: {missing}")
                return False

            logger.info(f"CloudFormation VPC Architecture Verification PASSED. All {len(required_resources)} resources present.")
            return True
        except Exception as e:
            logger.error(f"Error parsing CloudFormation YAML: {e}")
            return False


def run_module_3_network_check() -> None:
    """Main execution entry point for Module 3 VPC Networking Validation."""
    print("==================================================")
    print("  MODULE 3: AWS VPC NETWORK & SECURITY AUDITOR    ")
    print("==================================================")

    # Step 1: Initialize VPC Subnet Calculator
    validator = VPCNetworkValidator(vpc_cidr="10.0.0.0/16")

    # Step 2: Define Subnet Micro-Segmentation
    subnet_a = validator.add_subnet("PublicHoneypotSubnet", "10.0.1.0/24")
    subnet_b = validator.add_subnet("PrivateAppSubnet", "10.0.2.0/24")
    subnet_c = validator.add_subnet("PrivateDBSubnet", "10.0.3.0/24")

    # Step 3: Zero Trust Security Group Audit
    sample_sgs = [
        {
            "name": "HoneypotSecurityGroup",
            "ingress": [
                {"port": 22, "source": "0.0.0.0/0"},
                {"port": 80, "source": "0.0.0.0/0"},
                {"port": 2222, "source": "0.0.0.0/0"}
            ]
        },
        {
            "name": "BackendSecurityGroup",
            "ingress": [
                {"port": 8000, "source": "10.0.1.0/24"}
            ]
        },
        {
            "name": "DatabaseSecurityGroup",
            "ingress": [
                {"port": 5432, "source": "10.0.2.0/24"}
            ]
        }
    ]
    violations = validator.validate_zero_trust_rules(sample_sgs)

    # Step 4: Validate CloudFormation Networking Architecture
    cf_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "cloudformation_template.yaml"
    )
    cf_network_valid = validator.validate_cloudformation_networking(cf_path)

    # Step 5: Summary Output
    print("\n[VPC Network Diagnostics Summary]:")
    print(f" - Subnet Allocation Valid: {subnet_a and subnet_b and subnet_c}")
    print(f" - Zero Trust SG Audit Violations: {len(violations)}")
    print(f" - CloudFormation Network Blueprint Valid: {cf_network_valid}")
    print("\n[✓] Module 3 VPC Networking & Zero Trust Verification Complete.")


if __name__ == "__main__":
    run_module_3_network_check()
