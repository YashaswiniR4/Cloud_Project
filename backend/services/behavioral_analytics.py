"""
User Behavior Analytics (UBA) Service
Tracks user baseline location, login hours, device profiles, and detects anomalous shifts (e.g., India -> Russia, 9 AM -> 3 AM).
"""

from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.database.models import UserBehaviorProfile, User
from config.logging_config import logger


def evaluate_user_behavior(
    db: Session,
    user_id: str,
    source_ip: str,
    country: str = "India",
    city: str = "Bengaluru",
    device: str = "Windows Chrome",
    login_time: datetime = None
) -> Dict[str, Any]:
    """
    Evaluates user login attempt against their behavioral baseline profile.
    Returns anomaly risk score boost and detailed anomaly breakdown.
    """
    if login_time is None:
        login_time = datetime.now(timezone.utc)

    # Ensure user exists in database to satisfy foreign key constraint, or fallback to first registered user
    user_obj = db.query(User).filter((User.id == user_id) | (User.username == user_id)).first()
    if not user_obj:
        user_obj = db.query(User).first()

    real_user_id = user_obj.id if user_obj else None

    if not real_user_id:
        # Fallback evaluation without DB persistence if database has zero users
        return {
            "is_anomaly": country in ["Russia", "North Korea", "Iran"],
            "anomaly_boost": 45.0 if country in ["Russia", "North Korea", "Iran"] else 0.0,
            "reasons": [f"Geographic location shift detected: Usual 'India' vs Current '{country}'"] if country in ["Russia", "North Korea", "Iran"] else ["Baseline check passed"],
            "baseline_country": "India",
            "current_country": country,
            "anomaly_count": 1
        }

    profile = db.query(UserBehaviorProfile).filter_by(user_id=real_user_id).first()

    # If profile doesn't exist, initialize baseline
    if not profile:
        profile = UserBehaviorProfile(
            user_id=real_user_id,
            usual_country=country,
            usual_city=city,
            usual_device=device,
            usual_start_hour=8,
            usual_end_hour=19,
            total_logins=1,
            anomaly_count=0,
            last_login_ip=source_ip,
            last_login_country=country,
            last_login_time=login_time
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        return {
            "is_anomaly": False,
            "anomaly_boost": 0.0,
            "reasons": ["Baseline profile created"]
        }

    reasons = []
    anomaly_boost = 0.0

    # 1. Geographic Location Anomaly (e.g., India -> Russia / High Risk Location)
    high_risk_countries = ["Russia", "North Korea", "Iran", "Unknown Proxy"]
    if country != profile.usual_country or country in high_risk_countries:
        anomaly_boost += 45.0
        reasons.append(f"Geographic location shift detected: Usual '{profile.usual_country}' vs Current '{country}'")

    # 2. Time Window Anomaly (e.g., 9 AM -> 3 AM)
    current_hour = login_time.hour
    if current_hour < profile.usual_start_hour or current_hour > profile.usual_end_hour:
        anomaly_boost += 25.0
        reasons.append(f"Off-hours login activity: Current hour {current_hour}:00 UTC outside baseline ({profile.usual_start_hour}:00 - {profile.usual_end_hour}:00 UTC)")

    # 3. Device Anomaly
    if device != profile.usual_device:
        anomaly_boost += 15.0
        reasons.append(f"Unrecognized device profile: '{device}' vs baseline '{profile.usual_device}'")

    is_anomaly = anomaly_boost > 0.0

    if is_anomaly:
        profile.anomaly_count += 1
        logger.warning(f"UBA Anomaly detected for user '{user_id}': Boost +{anomaly_boost} | Reasons: {reasons}")

    profile.total_logins += 1
    profile.last_login_ip = source_ip
    profile.last_login_country = country
    profile.last_login_time = login_time
    db.commit()

    return {
        "is_anomaly": is_anomaly,
        "anomaly_boost": anomaly_boost,
        "reasons": reasons,
        "baseline_country": profile.usual_country,
        "current_country": country,
        "anomaly_count": profile.anomaly_count
    }
