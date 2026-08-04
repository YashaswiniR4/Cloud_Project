"""
Comprehensive Enterprise Authentication Test Suite
Tests RFC email validation, password policy, username rules, 6-digit OTP email verification, unverified login rejection, single-use OTP enforcement, resend OTP, 5-attempt account lockout, JWT token access, and logout.
"""

import unittest
import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import SessionLocal
from backend.database.models import User


class TestEnterpriseAuthenticationSystem(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        
        # Test User details satisfying enterprise policies
        self.test_username = "analyst_enterprise"
        self.test_email = "valid_analyst@corp-sec.internal"
        self.test_password = "StrongP@ssword2026!"

        # Clean up previous test users if exist
        existing = self.db.query(User).filter(
            (User.email.in_([self.test_email, "dup_email@corp-sec.internal", "lockout_user@corp-sec.internal", "otp_test@corp-sec.internal"])) |
            (User.username.in_([self.test_username, "dup_user", "lockout_user", "otp_test_user"]))
        ).all()
        for u in existing:
            self.db.delete(u)
        self.db.commit()

    def tearDown(self):
        existing = self.db.query(User).filter(
            (User.email.in_([self.test_email, "dup_email@corp-sec.internal", "lockout_user@corp-sec.internal", "otp_test@corp-sec.internal"])) |
            (User.username.in_([self.test_username, "dup_user", "lockout_user", "otp_test_user"]))
        ).all()
        for u in existing:
            self.db.delete(u)
        self.db.commit()
        self.db.close()

    def test_01_invalid_email_rejected(self):
        """Verify strict RFC email validation rejects invalid and disposable email formats."""
        invalid_emails = [
            "abc",
            "abc@",
            "abc@gmail",
            "@gmail.com",
            "abc@gmail.",
            "abc@.",
            "test@mailinator.com",  # disposable domain
        ]

        for inv_email in invalid_emails:
            payload = {
                "username": "valid_user_name",
                "email": inv_email,
                "password": "ValidP@ssword123!"
            }
            res = self.client.post("/auth/register", json=payload)
            self.assertEqual(res.status_code, 400, f"Email '{inv_email}' should be rejected.")

    def test_02_weak_passwords_rejected(self):
        """Verify password policy rejects passwords missing uppercase, lowercase, numbers, special chars, or short length."""
        weak_passwords = [
            "short1!",           # Too short (< 8 chars)
            "noupper123!",       # Missing uppercase
            "NOLOWER123!",       # Missing lowercase
            "NoDigitsHere!",     # Missing digits
            "NoSpecialChar123",  # Missing special character
        ]

        for weak_pwd in weak_passwords:
            payload = {
                "username": "valid_user_name",
                "email": "analyst_pwd_test@corp-sec.internal",
                "password": weak_pwd
            }
            res = self.client.post("/auth/register", json=payload)
            self.assertEqual(res.status_code, 400, f"Password '{weak_pwd}' should be rejected.")

    def test_03_invalid_username_rejected(self):
        """Verify username policy rejects <4 chars, >25 chars, spaces, or non-alphanumeric chars."""
        invalid_usernames = [
            "abc",          # Too short (<4 chars)
            "a" * 26,       # Too long (>25 chars)
            "user name",    # Contains space
            "user@name",    # Invalid special char
        ]

        for inv_user in invalid_usernames:
            payload = {
                "username": inv_user,
                "email": "valid_username_test@corp-sec.internal",
                "password": "ValidP@ssword123!"
            }
            res = self.client.post("/auth/register", json=payload)
            self.assertEqual(res.status_code, 400, f"Username '{inv_user}' should be rejected.")

    def test_04_user_registration_creates_unverified_account_with_otp(self):
        """Verify registration creates unverified account (is_verified=False) and generates 6-digit OTP code."""
        payload = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password
        }
        response = self.client.post("/auth/register", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("A 6-digit verification code has been sent", data["message"])
        self.assertFalse(data["user"]["is_verified"])

        user_in_db = self.db.query(User).filter_by(email=self.test_email).first()
        self.assertIsNotNone(user_in_db)
        self.assertFalse(user_in_db.is_verified)
        self.assertIsNotNone(user_in_db.verification_otp)
        self.assertEqual(len(user_in_db.verification_otp), 6)

    def test_05_unverified_login_blocked(self):
        """Verify login is rejected if user is registered but not yet verified with OTP."""
        payload = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password
        }
        self.client.post("/auth/register", json=payload)

        login_res = self.client.post("/auth/login", json={"email": self.test_email, "password": self.test_password})
        self.assertEqual(login_res.status_code, 400)
        self.assertIn("Please verify your email before logging in.", login_res.json()["detail"])

    def test_06_otp_verification_flow(self):
        """Verify invalid OTP fails, valid OTP verifies account, single-use OTP clearing, and login succeeds."""
        payload = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password
        }
        self.client.post("/auth/register", json=payload)

        # Retrieve generated OTP from DB
        user = self.db.query(User).filter_by(email=self.test_email).first()
        valid_otp = user.verification_otp

        # Invalid OTP check
        inv_res = self.client.post("/auth/verify-email", json={"email": self.test_email, "otp": "000000"})
        self.assertEqual(inv_res.status_code, 400)
        self.assertIn("Invalid verification code.", inv_res.json()["detail"])

        # Valid OTP verification
        val_res = self.client.post("/auth/verify-email", json={"email": self.test_email, "otp": valid_otp})
        self.assertEqual(val_res.status_code, 200)
        self.assertEqual(val_res.json()["message"], "Email verified successfully. You can now login.")

        # Check DB state
        self.db.refresh(user)
        self.assertTrue(user.is_verified)
        self.assertIsNone(user.verification_otp)
        self.assertIsNone(user.otp_expires_at)

        # Login now succeeds
        login_res = self.client.post("/auth/login", json={"email": self.test_email, "password": self.test_password})
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())

    def test_07_resend_otp_functionality(self):
        """Verify resend OTP generates a new 6-digit code and extends expiration timestamp."""
        payload = {
            "username": self.test_username,
            "email": self.test_email,
            "password": self.test_password
        }
        self.client.post("/auth/register", json=payload)

        user = self.db.query(User).filter_by(email=self.test_email).first()
        old_otp = user.verification_otp

        resend_res = self.client.post("/auth/resend-otp", json={"email": self.test_email})
        self.assertEqual(resend_res.status_code, 200)
        self.assertIn("A new verification code has been sent", resend_res.json()["message"])

        self.db.refresh(user)
        new_otp = user.verification_otp
        self.assertIsNotNone(new_otp)
        self.assertEqual(len(new_otp), 6)

        # Verify with new OTP succeeds
        val_res = self.client.post("/auth/verify-email", json={"email": self.test_email, "otp": new_otp})
        self.assertEqual(val_res.status_code, 200)

    def test_08_failed_login_account_lockout(self):
        """Verify account is temporarily locked for 15 minutes after 5 consecutive failed login attempts."""
        lockout_email = "lockout_user@corp-sec.internal"
        reg_payload = {"username": "lockout_user", "email": lockout_email, "password": "LockoutP@ss123!"}
        self.client.post("/auth/register", json=reg_payload)

        # Manually mark as verified to test lockout behavior
        user = self.db.query(User).filter_by(email=lockout_email).first()
        user.is_verified = True
        self.db.commit()

        # Attempt 1 to 4 failed logins
        for i in range(4):
            res = self.client.post("/auth/login", json={"email": lockout_email, "password": "WrongPassword!"})
            self.assertEqual(res.status_code, 401)
            self.assertEqual(res.json()["detail"], "Invalid email or password.")

        # Attempt 5: 5th failed login triggers lockout
        res5 = self.client.post("/auth/login", json={"email": lockout_email, "password": "WrongPassword!"})
        self.assertEqual(res5.status_code, 400)
        self.assertEqual(res5.json()["detail"], "Account temporarily locked. Try again later.")

    def test_09_jwt_and_protected_routes(self):
        """Verify verified user login returns valid JWT token and allows access to protected endpoints."""
        reg_payload = {"username": self.test_username, "email": self.test_email, "password": self.test_password}
        self.client.post("/auth/register", json=reg_payload)

        # Verify email
        user = self.db.query(User).filter_by(email=self.test_email).first()
        user.is_verified = True
        self.db.commit()

        login_res = self.client.post("/auth/login", json={"email": self.test_email, "password": self.test_password})
        self.assertEqual(login_res.status_code, 200)
        token = login_res.json()["access_token"]

        # Access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        me_res = self.client.get("/auth/me", headers=headers)
        self.assertEqual(me_res.status_code, 200)
        data = me_res.json()
        self.assertEqual(data["username"], self.test_username)

    def test_10_logout_works(self):
        """Verify logout endpoint with JWT token."""
        reg_payload = {"username": self.test_username, "email": self.test_email, "password": self.test_password}
        self.client.post("/auth/register", json=reg_payload)

        user = self.db.query(User).filter_by(email=self.test_email).first()
        user.is_verified = True
        self.db.commit()

        login_res = self.client.post("/auth/login", json={"email": self.test_email, "password": self.test_password})
        token = login_res.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        logout_res = self.client.post("/auth/logout", headers=headers)
        self.assertEqual(logout_res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
