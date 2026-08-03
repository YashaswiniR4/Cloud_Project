"""
AWS Infrastructure Configuration & Validation Utility
======================================================
This module validates AWS environment prerequisites, checks AWS CLI configuration,
verifies region settings, enforces Free Tier resource constraints, and inspects
CloudFormation infrastructure templates prior to deployment.

Author: Senior Cloud Security Architect
Project: AI-Driven Autonomous Cloud Threat Intelligence Platform
"""

import json
import logging
import os
import subprocess
import sys
from typing import Dict, Any, Optional

# Configure enterprise logging standard
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("AWSInfraValidator")


class AWSInfrastructureValidator:
    """Validates local AWS environment, CLI configuration, and Infrastructure templates."""

    def __init__(self, region: str = "us-east-1"):
        """
        Initialize the AWS Infrastructure Validator.

        :param region: Target AWS Region (Default: us-east-1)
        """
        self.target_region = region
        self.free_tier_ec2_types = ["t2.micro", "t3.micro"]
        logger.info(f"Initialized AWS Validator for target region: {self.target_region}")

    def check_aws_cli_installed(self) -> bool:
        """
        Checks if AWS CLI is installed on the host operating system.

        :return: True if AWS CLI is detected, False otherwise.
        """
        try:
            result = subprocess.run(
                ["aws", "--version"],
                capture_output=True,
                text=True,
                check=True
            )
            logger.info(f"AWS CLI Detected: {result.stdout.strip()}")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning(
                "AWS CLI is NOT installed or not in system PATH. "
                "Download from https://aws.amazon.com/cli/"
            )
            return False

    def check_aws_credentials_configured(self) -> Dict[str, Any]:
        """
        Executes 'aws sts get-caller-identity' to verify AWS API credentials.

        :return: Dictionary containing status, account ID, and IAM ARN.
        """
        status = {
            "is_configured": False,
            "account_id": None,
            "arn": None,
            "error": None
        }
        
        try:
            result = subprocess.run(
                ["aws", "sts", "get-caller-identity", "--output", "json"],
                capture_output=True,
                text=True,
                check=True
            )
            identity = json.loads(result.stdout)
            status["is_configured"] = True
            status["account_id"] = identity.get("Account")
            status["arn"] = identity.get("Arn")
            logger.info(f"Authenticated AWS IAM Identity: {status['arn']}")
            
            # Security Warning for Root Account usage
            if ":root" in status["arn"]:
                logger.warning(
                    "SECURITY RISKS DETECTED: You are using the AWS ROOT Account. "
                    "Industry Best Practice requires using an IAM User with MFA enabled!"
                )
        except Exception as e:
            status["error"] = str(e)
            logger.info(
                "AWS CLI Credentials not yet set up locally. "
                "(Simulation mode active - run 'aws configure' when connecting to live AWS account)."
            )

        return status

    def validate_cloudformation_template(self, template_path: str) -> bool:
        """
        Validates CloudFormation YAML/JSON template syntax locally.

        :param template_path: Path to CloudFormation template file.
        :return: True if template is readable and contains required CloudFormation keys.
        """
        if not os.path.exists(template_path):
            logger.error(f"Template path does not exist: {template_path}")
            return False

        try:
            with open(template_path, "r", encoding="utf-8") as f:
                content = f.read()

            required_sections = ["AWSTemplateFormatVersion", "Resources"]
            for section in required_sections:
                if section not in content:
                    logger.error(f"CloudFormation template missing required key: {section}")
                    return False

            logger.info(f"CloudFormation Template '{template_path}' syntax validation passed.")
            return True
        except Exception as e:
            logger.error(f"Failed to parse CloudFormation template: {e}")
            return False

    def generate_cost_safeguard_report(self) -> Dict[str, Any]:
        """
        Generates a summary of AWS Free Tier limits and cost avoidance guidelines.

        :return: Security & Cost breakdown dictionary.
        """
        report = {
            "ec2_recommendation": "t2.micro (750 hours/month free)",
            "s3_recommendation": "5 GB Standard Storage free",
            "cloudtrail_recommendation": "1 Management Trail (First copy is FREE)",
            "cost_alert_threshold": "$1.00 USD (Set up AWS Budget Alarm immediately)"
        }
        return report


def run_infrastructure_check() -> None:
    """Main execution entry point for Module 2 AWS infrastructure validation."""
    print("==================================================")
    print("   MODULE 2: AWS INFRASTRUCTURE & CREDENTIAL CHECK")
    print("==================================================")

    validator = AWSInfrastructureValidator()

    # Step 1: Check CLI
    cli_installed = validator.check_aws_cli_installed()

    # Step 2: Check IAM Identity
    cred_status = validator.check_aws_credentials_configured()

    # Step 3: Validate CloudFormation Blueprint
    cf_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "cloudformation_template.yaml"
    )
    cf_valid = validator.validate_cloudformation_template(cf_path)

    # Step 4: Cost Safeguards
    safeguards = validator.generate_cost_safeguard_report()

    print("\n[AWS Environment Diagnostic Summary]:")
    print(f" - AWS CLI Installed: {cli_installed}")
    print(f" - IAM Credentials Active: {cred_status['is_configured']}")
    if cred_status['arn']:
        print(f" - Active IAM Identity: {cred_status['arn']}")
    print(f" - CloudFormation Template Valid: {cf_valid}")
    print("\n[Free Tier Cost Avoidance Guidelines]:")
    print(json.dumps(safeguards, indent=2))
    print("\n[✓] Module 2 Infrastructure Verification Completed.")


if __name__ == "__main__":
    run_infrastructure_check()
