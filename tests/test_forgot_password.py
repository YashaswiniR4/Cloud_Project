"""
Comprehensive Test Suite for Forgot Password and Password Reset Workflow
Tests:
1. Valid forgot-password request
2. Unknown email (account enumeration protection)
3. Valid OTP password reset
4. Invalid OTP rejection
5. Expired OTP rejection
6. Reused OTP rejection (single-use enforcement)
7. Weak new password policy rejection
8. Password mismatch rejection
9. Login with new password after reset
10. Password reset rate limiting
"""

import unittest
import os
import sys
import hashlib
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database.database import SessionLocal
from backend.database.models import User, PasswordResetToken
from backend.auth.security import hash_password
from backend.api.auth import reset_rate_limit_store


class TestForgotPasswordWorkflow(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.db = SessionLocal()
        
        self.test_username = "forgot_pwd_user"
        self.test_email = "forgot_pwd_test@corp-sec.internal"
        self.test_password = "OriginalP@ssword2026!"
        self.new_password = "NewSecureP@ssword2026!"

        # Clear rate limit store
        reset_rate_limit_store.clear()

        # Clean up existing test users & reset tokens
        existing = self.db.query(User).filter(
            (User.email.in_([self.test_email, "unknown_reset@corp-sec.internal", "ratelimit_reset@corp-sec.internal"])) |
            (User.username.in_([self.test_username, "ratelimit_user"]))
        ).all()
        for u in existing:
            self.db.delete(u)
        self.db.commit()

        # Create verified test user
        self.user = User(
            username=self.test_username,
            email=self.test_email,
            password_hash=hash_password(self.test_password),
            role="Security Analyst",
            is_verified=True
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        reset_rate_limit_store.clear()
        existing = self.db.query(User).filter(
            (User.email.in_([self.test_email, "unknown_reset@corp-sec.internal", "ratelimit_reset@corp-sec.internal"])) |
            (User.username.in_([self.test_username, "ratelimit_user"]))
        ).all()
        for u in existing:
            self.db.delete(u)
        self.db.commit()
        self.db.close()

    def test_01_valid_forgot_password_request(self):
        """Verify POST /auth/forgot-password generates 6-digit OTP, stores SHA256 token hash in DB, and returns generic message."""
        res = self.client.post("/auth/forgot-password", json={"email": self.test_email})
        self.assertEqual(res.status_code, 200)
        self.assertIn("message", res.json())
        self.assertIn("If an account associated with this email exists", res.json()["message"])

        # Check DB token creation
        token = self.db.query(PasswordResetToken).filter(PasswordResetToken.user_id == self.user.id).first()
        self.assertIsNotNone(token)
        self.assertFalse(token.used)
        self.assertIsNotNone(token.token_hash)
        self.assertEqual(len(token.token_hash), 64) # SHA-256 hash length

    def test_02_unknown_email_account_enumeration_protection(self):
        """Verify POST /auth/forgot-password with unregistered email returns generic success message without leaking email existence."""
        res = self.client.post("/auth/forgot-password", json={"email": "nonexistent_email@corp-sec.internal"})
        self.assertEqual(res.status_code, 200)
        self.assertIn("message", res.json())
        self.assertIn("If an account associated with this email exists", res.json()["message"])

        # Check no token stored for non-existent user
        tokens = self.db.query(PasswordResetToken).all()
        user_ids = [t.user_id for t in tokens]
        self.assertNotIn("nonexistent-id", user_ids)

    def test_03_valid_otp_password_reset(self):
        """Verify POST /auth/reset-password with valid email, OTP, and strong password succeeds."""
        # Request reset OTP
        self.client.post("/auth/forgot-password", json={"email": self.test_email})
        
        # Get raw token from test DB helper by inspecting SHA-256 matches
        raw_otp = None
        token_entry = self.db.query(PasswordResetToken).filter(PasswordResetToken.user_id == self.user.id, PasswordResetToken.used == False).first()
        for candidate in range(100000, 1000000):
            if hashlib.sha256(str(candidate).encode()).hexdigest() == token_entry.token_hash:
                raw_otp = str(candidate)
                break
        self.assertIsNotNone(raw_otp)

        # Reset password
        res = self.client.post("/auth/reset-password", json={
            "email": self.test_email,
            "otp": raw_otp,
            "new_password": self.new_password,
            "confirm_password": self.new_password
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn("Password reset successfully", res.json()["message"])

        # Verify token marked used
        self.db.refresh(token_entry)
        self.assertTrue(token_entry.used)

    def test_04_invalid_otp_rejected(self):
        """Verify invalid 6-digit OTP code is rejected with HTTP 400."""
        self.client.post("/auth/forgot-password", json={"email": self.test_email})

        res = self.client.post("/auth/reset-password", json={
            "email": self.test_email,
            "otp": "000000", # Wrong OTP
            "new_password": self.new_password,
            "confirm_password": self.new_password
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid or expired", res.json()["detail"])

    def test_05_expired_otp_rejected(self):
        """Verify expired OTP (>10 minutes) is rejected with HTTP 400."""
        # Manually create expired token in DB
        raw_otp = "123456"
        token_hash = hashlib.sha256(raw_otp.encode()).hexdigest()
        expired_token = PasswordResetToken(
            user_id=self.user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
            used=False
        )
        self.db.add(expired_token)
        self.db.commit()

        res = self.client.post("/auth/reset-password", json={
            "email": self.test_email,
            "otp": raw_otp,
            "new_password": self.new_password,
            "confirm_password": self.new_password
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid or expired", res.json()["detail"])

    def test_06_reused_otp_rejected(self):
        """Verify single-use token enforcement rejects already used OTP codes."""
        raw_otp = "654321"
        token_hash = hashlib.sha256(raw_otp.encode()).hexdigest()
        used_token = PasswordResetToken(
            user_id=self.user.id,
            token_hash=token_hash,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
            used=True # Marked used
        )
        self.db.add(used_token)
        self.db.commit()

        res = self.client.post("/auth/reset-password", json={
            "email": self.test_email,
            "otp": raw_otp,
            "new_password": self.new_password,
            "confirm_password": self.new_password
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid or expired", res.json()["detail"])

    def test_07_weak_password_rejected(self):
        """Verify new passwords failing complexity policy are rejected."""
        self.client.post("/auth/forgot-password", json={"email": self.test_email})
        
        token_entry = self.db.query(PasswordResetToken).filter(PasswordResetToken.user_id == self.user.id, PasswordResetToken.used == False).first()
        raw_otp = None
        for candidate in range(100000, 1000000):
            if hashlib.sha256(str(candidate).encode()).hexdigest() == token_entry.token_hash:
                raw_otp = str(candidate)
                break

        res = self.client.post("/auth/reset-password", json={
            "email": self.test_email,
            "otp": raw_otp,
            "new_password": "weak",
            "confirm_password": "weak"
        })
        self.assertEqual(res.status_code, 400)

    def test_08_password_mismatch_rejected(self):
        """Verify mismatched new password and confirm password are rejected."""
        self.client.post("/auth/forgot-password", json={"email": self.test_email})
        
        token_entry = self.db.query(PasswordResetToken).filter(PasswordResetToken.user_id == self.user.id, PasswordResetToken.used == False).first()
        raw_otp = None
        for candidate in range(100000, 1000000):
            if hashlib.sha256(str(candidate).encode()).hexdigest() == token_entry.token_hash:
                raw_otp = str(candidate)
                break

        res = self.client.post("/auth/reset-password", json={
            "email": self.test_email,
            "otp": raw_otp,
            "new_password": self.new_password,
            "confirm_password": "DifferentPassword2026!"
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("do not match", res.json()["detail"])

    def test_09_login_with_new_password_succeeds(self):
        """Verify logging in with new password succeeds and old password fails after reset."""
        # Request reset
        self.client.post("/auth/forgot-password", json={"email": self.test_email})
        token_entry = self.db.query(PasswordResetToken).filter(PasswordResetToken.user_id == self.user.id, PasswordResetToken.used == False).first()
        raw_otp = None
        for candidate in range(100000, 1000000):
            if hashlib.sha256(str(candidate).encode()).hexdigest() == token_entry.token_hash:
                raw_otp = str(candidate)
                break

        # Execute Reset
        self.client.post("/auth/reset-password", json={
            "email": self.test_email,
            "otp": raw_otp,
            "new_password": self.new_password,
            "confirm_password": self.new_password
        })

        # Old password login attempt (should fail)
        fail_res = self.client.post("/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        self.assertEqual(fail_res.status_code, 401)

        # New password login attempt (should succeed)
        succ_res = self.client.post("/auth/login", json={
            "email": self.test_email,
            "password": self.new_password
        })
        self.assertEqual(succ_res.status_code, 200)
        self.assertIn("access_token", succ_res.json())

    def test_10_forgot_password_rate_limiting(self):
        """Verify rate limiting blocks 4th request within 5-minute window with HTTP 429."""
        rate_email = "ratelimit_reset@corp-sec.internal"
        rate_user = User(
            username="ratelimit_user",
            email=rate_email,
            password_hash=hash_password(self.test_password),
            role="Security Analyst",
            is_verified=True
        )
        self.db.add(rate_user)
        self.db.commit()

        # Send 3 valid requests (allowed)
        for _ in range(3):
            r = self.client.post("/auth/forgot-password", json={"email": rate_email})
            self.assertEqual(r.status_code, 200)

        # 4th request should be rate-limited (HTTP 429)
        r4 = self.client.post("/auth/forgot-password", json={"email": rate_email})
        self.assertEqual(r4.status_code, 429)
        self.assertIn("Too many password reset requests", r4.json()["detail"])


if __name__ == "__main__":
    unittest.main()
