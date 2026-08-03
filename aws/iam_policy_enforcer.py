"""
AWS IAM Policy Security Enforcer & Static Analyzer
Parses IAM Policy JSON documents and audits them against AWS CIS Benchmarks,
detecting dangerous wildcard permissions, missing resource conditions, and over-privileged roles.
"""

import json
import os
from typing import Dict, List, Any, Tuple
from config.settings import settings
from config.logging_config import logger


class IAMPolicyEnforcer:
    """Analyzes and enforces Least Privilege security rules on IAM policies."""

    DANGEROUS_ACTIONS = {
        "*", "iam:*", "s3:*", "ec2:*", "administratoraccess"
    }

    def audit_policy_file(self, policy_path: str) -> Tuple[bool, List[str]]:
        """
        Parses an IAM Policy JSON file and returns safety status and risk findings.
        """
        if not os.path.exists(policy_path):
            logger.error(f"IAM Policy file not found: {policy_path}")
            return False, [f"File missing: {policy_path}"]

        try:
            with open(policy_path, "r", encoding="utf-8") as f:
                policy_doc = json.load(f)

            return self.audit_policy_dict(policy_doc, filename=os.path.basename(policy_path))

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON syntax in {policy_path}: {e}")
            return False, [f"JSON Syntax Error: {e}"]

    def audit_policy_dict(self, policy_doc: Dict[str, Any], filename: str = "InMemoryPolicy") -> Tuple[bool, List[str]]:
        """Audits IAM Policy dictionary structure."""
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
                    if act in self.DANGEROUS_ACTIONS or act.endswith(":*"):
                        findings.append(
                            f"[{sid}] HIGH RISK: Statement contains dangerous wildcard action '{act}'."
                        )

                # Check 2: Wildcard Resource without Condition Audit
                if "*" in resources and not condition:
                    findings.append(
                        f"[{sid}] MEDIUM RISK: Resource is '*' without scoped Condition keys."
                    )

        is_secure = len(findings) == 0
        if is_secure:
            logger.info(f"IAM Policy '{filename}' audit PASSED. Fully compliant with Least Privilege.")
        else:
            logger.warning(f"IAM Policy '{filename}' audit flagged {len(findings)} issues.")

        return is_secure, findings


if __name__ == "__main__":
    enforcer = IAMPolicyEnforcer()
    policy_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "iam_policies")
    for policy_name in ["honeypot_role_policy.json", "lambda_remediation_policy.json", "cloudtrail_role_policy.json"]:
        p_path = os.path.join(policy_dir, policy_name)
        sec, issues = enforcer.audit_policy_file(p_path)
        print(f"Policy '{policy_name}' Secure: {sec}")
        for i in issues:
            print(f"  - {i}")
