"""
Unit & Integration tests for Module 5: EC2 Honeypot Host & CloudFormation Deployment
"""

import unittest
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from aws.ec2_honeypot_provisioner import EC2HoneypotProvisioner


class TestModule5EC2HoneypotDeployment(unittest.TestCase):
    def setUp(self):
        self.provisioner = EC2HoneypotProvisioner(instance_type="t2.micro")

    def test_user_data_script_generation(self):
        user_data = self.provisioner.generate_honeypot_user_data_script()
        self.assertIn("#!/bin/bash", user_data)
        self.assertIn("docker run", user_data)
        self.assertIn("cowrie/cowrie:latest", user_data)
        self.assertIn("http_honeypot.py", user_data)

    def test_free_tier_validation(self):
        valid_cfg = {
            "instance_type": "t2.micro",
            "subnet_id": "subnet-0123456789abcdef0",
            "security_group_ids": ["sg-0a1b2c3d4e5f6789a"]
        }
        is_valid, msg = self.provisioner.validate_launch_configuration(valid_cfg)
        self.assertTrue(is_valid)

        invalid_type_cfg = {
            "instance_type": "c5.4xlarge",
            "subnet_id": "subnet-0123456789abcdef0",
            "security_group_ids": ["sg-0a1b2c3d4e5f6789a"]
        }
        is_valid_type, msg_type = self.provisioner.validate_launch_configuration(invalid_type_cfg)
        self.assertFalse(is_valid_type)
        self.assertIn("COST WARNING", msg_type)

    def test_cloudformation_template_structure(self):
        cf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'aws', 'cloudformation_template.yaml'))
        self.assertTrue(os.path.exists(cf_path))
        with open(cf_path, 'r', encoding='utf-8') as f:
            cf_content = f.read()

        self.assertIn("EC2HoneypotInstance:", cf_content)
        self.assertIn("HoneypotCloudWatchLogGroup:", cf_content)
        self.assertIn("PlatformCloudTrail:", cf_content)
        self.assertIn("EC2HoneypotRole:", cf_content)
        self.assertIn("CloudTrailDeliveryRole:", cf_content)


if __name__ == "__main__":
    unittest.main()
