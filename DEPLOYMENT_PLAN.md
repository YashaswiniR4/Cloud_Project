# SentinelAI - Production Deployment Plan

This document outlines the complete analysis of the current architecture and provides a step-by-step production deployment strategy for the **SentinelAI Autonomous Cloud Threat Intelligence & SOC Platform**.

---

## A. Current Architecture Overview

```
                                  INTERNET
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         Corporate Employee Portal           SOC Analyst Console
             (Public Access)                 (Restricted Access)
           frontend-portal:5173               frontend-soc:5174
                    │                                 │
                    └────────────────┬────────────────┘
                                     ▼
                          FastAPI Backend Core
                          backend.main:app:8000
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
  Supabase PostgreSQL      Machine Learning Pipeline    AWS Integration Services
 (Production DB Engine)    (Isolation Forest + SHAP)    (CloudTrail, S3 WORM, SNS, Lambda)
```

### Component Details
1. **Corporate Employee Portal (`frontend-portal/`)**: Built with React 18, Vite, Tailwind CSS, Lucide Icons, and Recharts. Handles user registration, 6-digit email OTP verification, file uploads, employee activity logging, forgot password flow, and interactive attack simulations.
2. **SOC Analyst Command Center (`frontend-soc/`)**: Independent React 18/Vite application featuring 13 security modules (Overview, CloudTrail Logs, Threat Intel, Alerts, ML Predictions, Honeypots, Incident Investigation, UBA, Threat Hunting, Attack Simulation Lab, Remediation, Audit Logs, Settings).
3. **FastAPI Backend Core (`backend/`)**: Async Python REST API providing JWT authentication, SQLAlchemy ORM database models, rate limiting, UBA behavior profiling, threat scoring, and automated alert dispatching.
4. **Database Engine**: Primary target is Supabase PostgreSQL (`postgresql://...`) with connection pooling and automated schema initialization (`init_db()`). Fallback to local SQLite (`threat_intel.db`) if PostgreSQL is unavailable.
5. **Machine Learning Pipeline (`ml/`)**: Trains and evaluates `IsolationForest` (zero-day anomaly detection) and `RandomForestClassifier` with `SHAP` (SHapley Additive exPlanations) for explainable threat scoring (0–100).
6. **Telemetry & Honeypot Engine**: HTTP Web Shell (`:8080`) and SSH (`:2222`) decoy honeypot traps, CloudTrail ingestion pipeline, and S3 WORM audit vault manager.

---

## B. Target Production Deployment Architecture

```
                                  INTERNET
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
           Vercel / Netlify                  Vercel / Netlify
       (Corporate Portal SPA)               (SOC Console SPA)
    https://portal.yourdomain.com       https://soc.yourdomain.com
                    │                                 │
                    └────────────────┬────────────────┘
                                     ▼ HTTPS (CORS Restricted)
                        Render / Railway / AWS App Runner
                         (FastAPI Python Container)
                        https://api.yourdomain.com
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
  Supabase Managed Database   In-Memory ML Model Pipeline   AWS Managed Cloud Services
 (PostgreSQL + Pooler 5432)   (Scikit-Learn + SHAP Engine) (CloudTrail, S3, SNS, Lambda)
```

---

## C. Hosting Recommendations

| Component | Recommended Host | Free/Low-Cost Tier | Key Advantages |
| :--- | :--- | :--- | :--- |
| **Corporate Portal (`frontend-portal`)** | **Vercel** or **Netlify** | Free Tier Available | Instant global CDN, automatic SSL/TLS, environment variable management |
| **SOC Console (`frontend-soc`)** | **Vercel** or **Netlify** | Free Tier Available | Isolated deployment, path/IP restricted access support, fast SPA routing |
| **FastAPI Backend (`backend`)** | **Render**, **Railway**, or **AWS App Runner** | Render Free Web Service / Railway | Native Docker/Python support, automatic SSL, background worker support |
| **Database** | **Supabase PostgreSQL** | Free Tier (500MB DB) | Fully managed PostgreSQL, connection pooler (Transaction/Session mode) |
| **Storage & Audit Vault** | **AWS S3 Bucket** | Free Tier (5GB S3) | Immutable WORM bucket policy support (`Object Lock` enabled) |

---

## D. Production Environment Variables Directory

### 1. Backend (`.env.production`)

```env
# Platform Environment
ENV=production
LOG_LEVEL=INFO
PORT=8000

# CORS Allowed Origins (Comma-separated)
ALLOWED_ORIGINS=https://portal.yourdomain.com,https://soc.yourdomain.com

# Database Connection (Supabase PostgreSQL Connection Pooler)
DATABASE_URL=postgresql://postgres.your_supabase_ref:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# JWT Security Configuration (MUST BE A RANDOM 64-CHAR STRING)
JWT_SECRET_KEY=e8f9a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120

# AWS Cloud Credentials & Service ARNs
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
S3_WORM_BUCKET_NAME=threat-intel-worm-audit-vault-prod
KMS_KEY_ARN=arn:aws:kms:us-east-1:123456789012:key/your-prod-kms-key
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:SOCAlertsTopicProd

# Threat Intelligence External APIs
ABUSEIPDB_API_KEY=your_production_abuseipdb_api_key
VIRUSTOTAL_API_KEY=your_production_virustotal_api_key

# Honeypot Configuration
SSH_HONEYPOT_PORT=2222
HTTP_HONEYPOT_PORT=8080

# Production SMTP Email Delivery Settings (SendGrid / AWS SES / Gmail App Password)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM_EMAIL=security@yourdomain.com
SMTP_USE_SSL=false
```

### 2. Frontend Corporate Portal (`frontend-portal/.env.production`)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=SentinelAI Corporate Workspace
```

### 3. Frontend SOC Console (`frontend-soc/.env.production`)

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=Autonomous Cloud SOC Analyst Console
```

---

## E. Frontend Deployment Steps

### 1. Code Preparation
Replace hardcoded `http://localhost:8000` in both API service files with dynamic environment variables:
* [`frontend-portal/src/services/api.js`](file:///c:/Users/yasha/OneDrive/Desktop/Project/frontend-portal/src/services/api.js):
  ```javascript
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  ```
* [`frontend-soc/src/services/api.js`](file:///c:/Users/yasha/OneDrive/Desktop/Project/frontend-soc/src/services/api.js):
  ```javascript
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  ```

### 2. Deploying Corporate Portal to Vercel
1. Install Vercel CLI or connect GitHub repository:
   ```bash
   cd frontend-portal
   npm install
   npm run build
   ```
2. In Vercel Project Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_API_BASE_URL` = `https://api.yourdomain.com`

### 3. Deploying SOC Command Center to Vercel
1. Deploy `frontend-soc` as a separate Vercel project:
   ```bash
   cd frontend-soc
   npm install
   npm run build
   ```
2. In Vercel Project Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_API_BASE_URL` = `https://api.yourdomain.com`

---

## F. Backend Deployment Steps

### 1. Production Web Server Setup
Use Gunicorn with Uvicorn worker threads for asynchronous production traffic:

`Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2 and compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "backend.main:app", "--bind", "0.0.0.0:8000"]
```

### 2. Deploying to Render / Railway / AWS App Runner
1. Connect repository `YashaswiniR4/Cloud_Project`.
2. Select **Docker** environment or Python 3.11 build runtime.
3. Configure Build Command: `pip install -r requirements.txt`.
4. Configure Start Command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:$PORT`.
5. Attach environment variables from Section D1.

---

## G. Database Configuration (Supabase PostgreSQL)

1. **Supabase Setup**:
   - Create a project on [Supabase](https://supabase.com).
   - Retrieve connection string under **Project Settings -> Database -> Connection String -> URI**.
   - Use port `6543` (Connection Pooler in Transaction Mode for serverless/container deployments).

2. **Automatic Schema Migration**:
   The backend automatically verifies and creates required tables and columns on startup (`init_db()` in [`backend/database/database.py`](file:///c:/Users/yasha/OneDrive/Desktop/Project/backend/database/database.py)):
   - `users`
   - `events`
   - `alerts`
   - `threat_intelligence`
   - `honeypot_logs`
   - `ml_predictions`
   - `remediation_actions`
   - `audit_logs`
   - `password_reset_tokens`
   - `user_behavior_profiles`
   - `employee_documents`
   - `incident_timelines`

---

## H. AWS Configuration & Service Matrix

### AWS Implementation Matrix

| AWS Component | Status in Codebase | Fallback Mode | Production Requirement |
| :--- | :--- | :--- | :--- |
| **AWS S3 WORM Audit Vault** | Fully Implemented via `boto3` + S3 WORM Manager | Local SHA-256 Vault Simulation | Create S3 bucket with **Object Lock** enabled |
| **AWS CloudTrail Ingestion** | Ingestion & Telemetry Pipeline Implemented | Local Sample Telemetry Generator | Configure CloudTrail S3 Bucket Notification |
| **AWS Lambda Remediation** | Handlers & Payload Specs Implemented (`boto3`) | Internal SG & Access Key Revocation Simulator | Attach IAM Policy `lambda_remediation_policy.json` |
| **AWS SNS Alert Dispatcher** | SNS Client Implemented (`boto3`) | Console & Audio Alarm Dispatcher | Create SNS Topic `SOCAlertsTopic` & Subscribe Email |
| **AWS KMS Log Encryption** | Key Specification Implemented | SHA-256 Digest Simulation | Provision AWS KMS Customer Managed Key |

### Deploying Without AWS Credentials
> [!NOTE]
> The platform is engineered with seamless fallback handlers. If `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` are omitted, all components automatically fall back to local simulation mode without throwing runtime errors.

---

## I. Production CORS Configuration

Update [`backend/main.py`](file:///c:/Users/yasha/OneDrive/Desktop/Project/backend/main.py) to replace wildcard origins with explicit environment-driven origins:

```python
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
)
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

---

## J. Authentication & Email Configuration

1. **JWT Secret Security**:
   - Generate a strong random key: `python -c "import secrets; print(secrets.token_hex(32))"`.
   - Set `JWT_SECRET_KEY` in production environment variables.

2. **Password Security Policy**:
   - Enforced by [`backend/auth/validation.py`](file:///c:/Users/yasha/OneDrive/Desktop/Project/backend/auth/validation.py): Minimum 8 characters, 1 uppercase, 1 lowercase, 1 digit, 1 special character.
   - Hashed using `bcrypt` (work factor 12).

3. **Forgot Password Flow Security**:
   - Cryptographically secure 6-digit OTP codes.
   - Hashed using SHA-256 before storing in `password_reset_tokens`.
   - Single-use enforcement (`used = True`).
   - 10-minute expiration.
   - Sliding-window rate limiter: Maximum 3 requests per 5-minute window per email/IP.

4. **Production SMTP Email Services**:
   - Configure SendGrid, AWS SES, or Gmail App Password in `.env.production`.
   - Ensure `SMTP_USE_SSL=false` with port `587` (TLS) or `SMTP_USE_SSL=true` with port `465` (SSL).

---

## K. Production Security Checklist

- [ ] **Secrets Removal**: Ensure `.env` is listed in `.gitignore` and no API keys/passwords are committed to GitHub.
- [ ] **JWT Secret Key**: Change default `JWT_SECRET_KEY` from fallback string to a random 64-character hex string.
- [ ] **Disable Test Override**: Set `TESTING=false` and `ENV=production` so mock email logs are disabled and real SMTP/security dispatches occur.
- [ ] **Strict CORS Policy**: Replace `allow_origins=["*"]` with explicit domain origins (`portal` and `soc`).
- [ ] **Database Connection Pooling**: Use Supabase port `6543` (Transaction Pooler) to avoid connection exhaustion under high traffic.
- [ ] **Rate Limiting**: Verify sliding window rate limiting is active on `/auth/forgot-password`, `/auth/login`, and `/auth/register`.
- [ ] **HTTPS/TLS Enforced**: Ensure all frontend and backend endpoints use `https://`.
- [ ] **API Documentation Security**: Disable `/docs` and `/redoc` in production by setting `docs_url=None` if API spec should remain private.

---

## L. Testing & Verification Checklist

- [ ] Run full backend automated test suite before deployment:
  ```bash
  python -c "import os; os.environ['DATABASE_URL']='sqlite:///./test.db'; os.environ['TESTING']='true'; import unittest; unittest.main(module=None, argv=['', 'discover', '-s', 'tests'])"
  ```
  *(Verify 58/58 tests pass).*
- [ ] Test frontend production builds locally:
  ```bash
  cd frontend-portal && npm run build
  cd ../frontend-soc && npm run build
  ```
- [ ] Verify health check endpoint: `GET https://api.yourdomain.com/health` returns status `HEALTHY`.
- [ ] Test end-to-end employee registration, email OTP verification, and login.
- [ ] Test Forgot Password OTP generation and password reset on both portals.
- [ ] Verify live alert dispatches on SOC Console (`/alerts`) upon security events.

---

## M. Rollback Plan

If issues occur during production deployment:

1. **Frontend Rollback**:
   - In Vercel / Netlify dashboard, locate previous successful deployment build and click **Promote to Production** (instant rollback in < 5 seconds).

2. **Backend Rollback**:
   - In Render / Railway / AWS App Runner, redeploy the previous git commit hash (`18898ae`).

3. **Database Rollback**:
   - Supabase automatically maintains daily WAL (Write-Ahead Logging) backups.
   - Point to a Point-in-Time Recovery (PITR) snapshot if schema corruption occurs.
