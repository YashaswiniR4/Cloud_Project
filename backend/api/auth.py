"""
FastAPI Authentication Endpoints (/auth/register, /auth/login, /auth/me, /auth/logout, /auth/verify-email, /auth/resend-otp)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from backend.database.database import get_db
from backend.database import crud
from backend.database.models import User
from backend.services.threat_service import threat_ops_service
from config.logging_config import logger
from datetime import datetime, timedelta, timezone

from backend.schemas.auth_schemas import (
    UserRegisterSchema,
    UserLoginSchema,
    UserResponseSchema,
    TokenResponseSchema,
    RegisterResponseSchema,
    VerifyEmailSchema,
    ResendOTPSchema,
    ForgotPasswordSchema,
    ResetPasswordSchema
)
from backend.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from backend.auth.validation import (
    validate_email_address,
    validate_username_policy,
    validate_password_policy
)
from backend.auth.email_service import (
    generate_otp_code,
    send_verification_otp_email,
    send_password_reset_email
)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register", response_model=RegisterResponseSchema, status_code=status.HTTP_201_CREATED, summary="User Registration")
def register(payload: UserRegisterSchema, db: Session = Depends(get_db)):
    """
    Register a new user analyst account.
    Validates email format, username policy, password complexity, and uniqueness.
    Generates a 6-digit OTP verification code valid for 5 minutes and dispatches real email via SMTP.
    """
    # Validate policies
    clean_username = validate_username_policy(payload.username)
    clean_email = validate_email_address(payload.email)
    clean_password = validate_password_policy(payload.password)

    # Check duplicate email
    existing_email = crud.get_user_by_email(db, clean_email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered."
        )

    # Check duplicate username
    existing_username = crud.get_user_by_username(db, clean_username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken."
        )

    # Hash password with bcrypt
    hashed_pwd = hash_password(clean_password)

    # Generate 6-digit OTP code (expires in 5 minutes)
    otp_code = generate_otp_code()
    otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    # Send verification email via SMTP first
    email_result = send_verification_otp_email(clean_email, otp_code)
    if not email_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: Could not deliver verification email. Details: {email_result['error']}"
        )

    # Store unverified user in database
    new_user = crud.create_user(
        db=db,
        username=clean_username,
        email=clean_email,
        password_hash=hashed_pwd,
        role="Security Analyst",
        is_verified=False,
        verification_otp=otp_code,
        otp_expires_at=otp_expires_at
    )

    return {
        "message": "Registration successful. A 6-digit verification code has been sent to your email.",
        "user": UserResponseSchema.model_validate(new_user)
    }


@auth_router.post("/verify-email", summary="Verify OTP Email Code")
def verify_email(payload: VerifyEmailSchema, db: Session = Depends(get_db)):
    """
    Validates 6-digit OTP code.
    Activates user account upon successful verification.
    """
    clean_email = payload.email.strip().lower()
    user = crud.get_user_by_email(db, clean_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account not found."
        )

    if user.is_verified:
        return {"message": "Email is already verified. Please login."}

    # Check OTP code match
    if not user.verification_otp or user.verification_otp != payload.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # Check expiration (5 minutes)
    now_utc = datetime.now(timezone.utc)
    expires_at_tz = user.otp_expires_at
    if expires_at_tz and expires_at_tz.tzinfo is None:
        expires_at_tz = expires_at_tz.replace(tzinfo=timezone.utc)

    if not expires_at_tz or expires_at_tz < now_utc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new code."
        )

    # Mark user as verified and clear OTP code (single-use)
    crud.verify_user_otp(db, user)

    return {"message": "Email verified successfully. You can now login."}


@auth_router.post("/resend-otp", summary="Resend 6-Digit Verification Code")
def resend_otp(payload: ResendOTPSchema, db: Session = Depends(get_db)):
    """
    Generates a new 6-digit OTP verification code valid for 5 minutes.
    """
    clean_email = payload.email.strip().lower()
    user = crud.get_user_by_email(db, clean_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account not found."
        )

    if user.is_verified:
        return {"message": "Email is already verified."}

    new_otp = generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    email_result = send_verification_otp_email(user.email, new_otp)
    if not email_result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resend verification OTP email. Details: {email_result['error']}"
        )

    crud.update_user_otp(db, user, new_otp, expires_at)

    return {"message": "A new verification code has been sent to your email."}


@auth_router.post("/login", response_model=TokenResponseSchema, summary="User Login")
def login(payload: UserLoginSchema, db: Session = Depends(get_db)):
    """
    Authenticate user with email and password.
    Requires is_verified == True and enforces account lockout after 5 failed attempts.
    """
    clean_email = payload.email.strip().lower()
    user = crud.get_user_by_email(db, clean_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Check if account is locked due to failed attempts
    if crud.is_account_locked(db, user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account temporarily locked. Try again later."
        )

    # Verify password
    if not verify_password(payload.password, user.password_hash):
        is_locked = crud.increment_failed_login(db, user)
        if is_locked:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account temporarily locked. Try again later."
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # REQUIRE EMAIL VERIFICATION (is_verified == True)
    if not getattr(user, 'is_verified', True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please verify your email before logging in."
        )

    # Reset failed login counter on successful password match
    crud.reset_failed_login(db, user)

    # Create JWT token payload
    token_data = {
        "sub": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponseSchema.model_validate(user)
    }


@auth_router.get("/me", response_model=UserResponseSchema, summary="Get Current Authenticated User")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Protected endpoint returning profile details of the logged-in user.
    """
    return UserResponseSchema.model_validate(current_user)


@auth_router.post("/logout", summary="User Logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Logout endpoint for security auditing. Token cleanup occurs client-side.
    """
    return {
        "message": "Successfully logged out",
        "username": current_user.username
    }


# Rate limiter for password reset requests
reset_rate_limit_store = {}

def check_reset_rate_limit(key: str, max_requests: int = 3, window_seconds: int = 300):
    now = datetime.now(timezone.utc).timestamp()
    timestamps = reset_rate_limit_store.get(key, [])
    timestamps = [t for t in timestamps if now - t < window_seconds]
    if len(timestamps) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please wait a few minutes before trying again."
        )
    timestamps.append(now)
    reset_rate_limit_store[key] = timestamps


@auth_router.post("/forgot-password", summary="Request Password Reset OTP Code")
def forgot_password(payload: ForgotPasswordSchema, request: Request, db: Session = Depends(get_db)):
    """
    Initiates password reset flow.
    Generates a 6-digit OTP code (expires in 10 minutes), stores SHA-256 hash in database,
    and sends code via email. Returns generic response to prevent account enumeration.
    Dispatches a security alert to the SOC Analyst Command Center.
    """
    try:
        clean_email = validate_email_address(payload.email)
    except HTTPException:
        return {"message": "If an account associated with this email exists, a password reset code has been sent."}

    check_reset_rate_limit(clean_email, max_requests=3, window_seconds=300)

    user = crud.get_user_by_email(db, clean_email)
    if user:
        otp_code = generate_otp_code()
        crud.create_password_reset_token(db, user.id, otp_code, expires_in_minutes=10)
        send_password_reset_email(user.email, otp_code)

        try:
            client_ip = request.client.host if (request and request.client) else "127.0.0.1"
            threat_ops_service.log_portal_activity(
                event_name="PASSWORD_RESET_REQUESTED",
                source_ip=client_ip,
                user_id=user.username,
                user_email=user.email,
                payload={"email": user.email, "action": "Forgot Password OTP Generation", "status": "PENDING"}
            )
        except Exception as e:
            logger.warning(f"Failed to dispatch SOC alert for password reset request: {e}")

    return {"message": "If an account associated with this email exists, a password reset code has been sent."}


@auth_router.post("/reset-password", summary="Reset Password with OTP Code")
def reset_password(payload: ResetPasswordSchema, request: Request, db: Session = Depends(get_db)):
    """
    Resets user password using valid, unexpired, single-use 6-digit OTP code.
    Enforces password complexity policy and updates hashed password in database.
    Dispatches a security alert to the SOC Analyst Command Center.
    """
    clean_email = payload.email.strip().lower()
    
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirm password do not match."
        )

    clean_new_pwd = validate_password_policy(payload.new_password)

    user = crud.get_user_by_email(db, clean_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset code."
        )

    token_obj = crud.get_valid_password_reset_token(db, user.id, payload.otp)
    if not token_obj:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset code."
        )

    hashed_pwd = hash_password(clean_new_pwd)
    crud.update_user_password(db, user, hashed_pwd)
    crud.mark_password_reset_token_used(db, token_obj)

    try:
        client_ip = request.client.host if (request and request.client) else "127.0.0.1"
        threat_ops_service.log_portal_activity(
            event_name="PASSWORD_RESET_COMPLETED",
            source_ip=client_ip,
            user_id=user.username,
            user_email=user.email,
            payload={"email": user.email, "action": "Password Reset Execution", "status": "SUCCESSFUL"}
        )
    except Exception as e:
        logger.warning(f"Failed to dispatch SOC alert for password reset completion: {e}")

    return {"message": "Password reset successfully. Please log in with your new password."}
