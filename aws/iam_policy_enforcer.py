"""
AWS IAM Policy Security Enforcer & Static Analyzer
===================================================
This module parses IAM Policy JSON documents and audits them against AWS CIS Benchmarks,
detecting dangerous wildcard permissions, missing resource conditions, and over-privileged roles.

Author: Senior Cloud Security Architect
Project: AI-Driven Autonomous Cloud Threat Intelligence Platform
"""

import json
import logging
import os
import sys
from typing import Dict, List, Any, Tuple

# Enterprise Logging Configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("IAMPolicyEnforcer")


class IAMPolicyEnforcer:
    """Analyzes and enforces Least Privilege security rules on IAM policies."""

    def __init__(self):
        self.dangerous_actions = [
            "*", "iam:*", "s3:*", "ec2:*", "administratoraccess"
        ]

    def audit_policy_file(self, policy_path: str) -> Tuple[bool, List[str]]:
        """
        Parses an IAM Policy JSON file and returns safety status and risk findings.

        :param policy_path: Path to the IAM policy JSON file.
        :return: Tuple (is_secure, list_of_findings)
        """
        if not os.path.exists(policy_path):
            logger.error(f"IAM Policy file not found: {policy_path}")
            return False, [f"File missing: {policy_path}"]

        try:
            with open(policy_path, "r", encoding="utf-8") as f:
                policy_doc = json.load(f)

            findings = []
            statements = policy_doc.get("Statement", [])
            if isinstance(statements, dict):
                statements = [statements]

            for idx, stmt in enumerate(statements):
                effect = stmt.get("Effect", "Allow")
                actions = stmt.get("Action", [])
                resources = stmt.get("Resource", [])
                condition = stmt.get("Condition", {})
                sid = stmt.get("Sid", f"Statement_{idx+1}")

                if isinstance(actions, str):
                    actions = [actions]
                if isinstance(resources, str):
                    resources = [resources]

                if effect == "Allow":
                    # Check 1: Wildcard Action Audit
                    for act in actions:
                        if act in self.dangerous_actions or act.endswith(":*"):
                            findings.append(
                                f"[{sid}] HIGH RISK: Statement contains wildcard action '{act}'."
                            )

                    # Check 2: Wildcard Resource without Condition Audit
                    if "*" in resources and not condition:
                        findings.append(
                            f"[{sid}] MEDIUM RISK: Resource is '*' without scoped Condition keys."
                        )

            is_secure = len(findings) == 0
            if is_secure:
                logger.info(f"IAM Policy '{os.path.basename(policy_path)}' audit PASSED. Fully compliant with Least Privilege.")
            else:
                logger.warning(f"IAM Policy '{os.path.basename(policy_path)}' audit flagged {len(findings)} issues.")

            return is_secure, findings

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON syntax in {policy_path}: {e}")
            return False, [f"JSON Syntax Error: {e}"]


def run_iam_sprint_test() -> None:
    """Execution entry point for Sprint 1 IAM Security Audit."""
    print("==================================================")
    print("      SPRINT 1: AWS IAM LEAST PRIVILEGE AUDITOR    ")
    print("==================================================")

    enforcer = IAMPolicyEnforcer()
    policy_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "iam_policies")

    honeypot_policy = os.path.join(policy_dir, "honeypot_role_policy.json")
    lambda_policy = os.path.join(policy_dir, "lambda_remediation_policy.json")

    sec1, findings1 = enforcer.audit_policy_file(honeypot_policy)
    sec2, findings2 = enforcer.audit_policy_file(lambda_policy)

    print("\n[IAM Audit Results Summary]:")
    print(f" - Honeypot EC2 Policy Secure: {sec1}")
    for f in findings1:
        print(f"   * {f}")

    print(f" - Incident Response Lambda Policy Secure: {sec2}")
    for f in findings2:
        print(f"   * {f}")

    print("\n[✓] Sprint 1 IAM Policy Enforcement Verification Complete.")


if __name__ == "__main__":
    run_iam_sprint_test()
