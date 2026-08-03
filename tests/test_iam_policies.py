"""
Unit tests for Module 4: IAM Policies & Least Privilege Enforcer
"""

import unittest
import os
import sys
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from aws.iam_policy_enforcer import IAMPolicyEnforcer


class TestModule4IAMPolicies(unittest.TestCase):
    def setUp(self):
        self.enforcer = IAMPolicyEnforcer()
        self.policy_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'aws', 'iam_policies'))

    def test_honeypot_policy_least_privilege(self):
        policy_path = os.path.join(self.policy_dir, 'honeypot_role_policy.json')
        is_secure, findings = self.enforcer.audit_policy_file(policy_path)
        self.assertTrue(is_secure, f"Honeypot policy flagged findings: {findings}")

        with open(policy_path, 'r') as f:
            data = json.load(f)
        for stmt in data["Statement"]:
            self.assertIn("Rationale", stmt, "Statement missing permission rationale explanation.")

    def test_lambda_remediation_policy_least_privilege(self):
        policy_path = os.path.join(self.policy_dir, 'lambda_remediation_policy.json')
        is_secure, findings = self.enforcer.audit_policy_file(policy_path)
        self.assertTrue(is_secure, f"Lambda remediation policy flagged findings: {findings}")

        with open(policy_path, 'r') as f:
            data = json.load(f)
        for stmt in data["Statement"]:
            self.assertIn("Rationale", stmt, "Statement missing permission rationale explanation.")

    def test_cloudtrail_policy_least_privilege(self):
        policy_path = os.path.join(self.policy_dir, 'cloudtrail_role_policy.json')
        is_secure, findings = self.enforcer.audit_policy_file(policy_path)
        self.assertTrue(is_secure, f"CloudTrail policy flagged findings: {findings}")

    def test_enforcer_detects_dangerous_wildcard_actions(self):
        insecure_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "DangerousAdmin",
                    "Effect": "Allow",
                    "Action": "s3:*",
                    "Resource": "*"
                }
            ]
        }
        is_secure, findings = self.enforcer.audit_policy_dict(insecure_policy)
        self.assertFalse(is_secure)
        self.assertGreater(len(findings), 0)
        self.assertIn("HIGH RISK", findings[0])


if __name__ == "__main__":
    unittest.main()
