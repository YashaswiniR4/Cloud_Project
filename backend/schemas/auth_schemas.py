"""
Pydantic Schemas for Authentication Request & Response Data Contracts
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserRegisterSchema(BaseModel):
    username: str = Field(..., description="Unique username")
    email: str = Field(..., description="Unique RFC compliant email address")
    password: str = Field(..., description="User password satisfying security policy")


class UserLoginSchema(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponseSchema(BaseModel):
    id: str
    username: str
    email: str
    role: str
    is_verified: bool = False

    class Config:
        from_attributes = True


class TokenResponseSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponseSchema


class RegisterResponseSchema(BaseModel):
    message: str = "Registration successful. A 6-digit verification code has been sent to your email."
    user: UserResponseSchema


class VerifyEmailSchema(BaseModel):
    email: str = Field(..., description="Target user email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP verification code")


class ResendOTPSchema(BaseModel):
    email: str = Field(..., description="Target user email address")


class ForgotPasswordSchema(BaseModel):
    email: str = Field(..., description="Registered user email address")


class ResetPasswordSchema(BaseModel):
    email: str = Field(..., description="Registered user email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit reset OTP code")
    new_password: str = Field(..., description="New password satisfying complexity policy")
    confirm_password: str = Field(..., description="Confirm new password")


