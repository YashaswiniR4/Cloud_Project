"""
Enterprise Validation Module: Strict RFC Email Validation, Password Policy, and Username Policy
"""

import re
from fastapi import HTTPException, status

# Common disposable email domain blacklist
DISPOSABLE_DOMAINS = {
    "mailinator.com", "tempmail.com", "10minutemail.com", "guerrillamail.com",
    "dispostable.com", "trashmail.com", "yopmail.com", "sharklasers.com",
    "getairmail.com", "temp-mail.org", "throwawaymail.com", "maildrop.cc"
}

# Strict RFC-compliant email regex pattern
EMAIL_REGEX = re.compile(
    r"^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
)

# Username regex pattern (alphanumeric + underscore, 4-25 chars)
USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{4,25}$")


def validate_email_address(email: str) -> str:
    """
    Validates email format against strict RFC rules and checks against disposable email domains.
    """
    email_clean = email.strip()

    if not email_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required."
        )

    # Basic structural check
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format. Please enter a valid RFC-compliant email address."
        )

    # Check double dots or leading/trailing dots in domain
    parts = email_clean.split("@")
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address format."
        )

    local_part, domain_part = parts[0], parts[1]

    if ".." in local_part or ".." in domain_part:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address: consecutive dots are not allowed."
        )

    if domain_part.startswith(".") or domain_part.endswith("."):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email address domain structure."
        )

    # TLD validation: domain must contain at least one dot and a TLD of length 2+
    domain_tokens = domain_part.split(".")
    if len(domain_tokens) < 2 or len(domain_tokens[-1]) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email domain TLD."
        )

    # Disposable domain check
    if domain_part.lower() in DISPOSABLE_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Disposable email addresses are not permitted."
        )

    return email_clean.lower()


def validate_username_policy(username: str) -> str:
    """
    Validates username policy: 4-25 chars, alphanumeric + underscore, no spaces.
    """
    username_clean = username.strip()

    if " " in username_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must not contain spaces."
        )

    if len(username_clean) < 4 or len(username_clean) > 25:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 4 and 25 characters long."
        )

    if not USERNAME_REGEX.match(username_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, and underscores."
        )

    return username_clean


def validate_password_policy(password: str) -> str:
    """
    Validates password policy:
    - Minimum 8 characters, maximum 64 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < 8 or len(password) > 64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be between 8 and 64 characters long."
        )

    if not re.search(r"[A-Z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter."
        )

    if not re.search(r"[a-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter."
        )

    if not re.search(r"\d", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one digit."
        )

    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character."
        )

    return password
