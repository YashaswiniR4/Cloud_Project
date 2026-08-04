# AI-Driven Autonomous Cloud Threat Intelligence Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/)
[![AWS Architecture](https://img.shields.io/badge/AWS-Well--Architected-orange)](https://aws.amazon.com/)
[![Security Standard](https://img.shields.io/badge/NIST-800--207%20Zero%20Trust-blue)](https://nist.gov/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)

An enterprise-grade, real-time autonomous security operations platform built following the **AWS Well-Architected Framework**, **Zero Trust Architecture (NIST SP 800-207)**, and **MITRE ATT&CK Cloud Matrix**.

---

## 🏛️ Platform Architecture & End-to-End Workflow

```text
                  +-----------------------------------+
                  |   Public Internet / Attacker IPs  |
                  +-----------------+-----------------+
                                    |
                                    v
     +------------------------------+------------------------------+
     |                    Deception & Ingestion                    |
     |  +------------------------+      +-----------------------+  |
     |  | Cowrie SSH Honeypot    |      | HTTP Web Honeypot     |  |
     |  | (Port 2222)            |      | (Port 80)             |  |
     |  +-----------+------------+      +-----------+-----------+  |
     +--------------|-------------------------------|--------------+
                    v                               v
     +--------------+-------------------------------+--------------+
     |                 Cloud Telemetry & Log Ingestor              |
     |                 (AWS CloudTrail & Syslogs)                  |
     +------------------------------+------------------------------+
                                    |
                                    v
     +------------------------------+------------------------------+
     |             AI / Machine Learning Threat Pipeline           |
     |  +------------------------+      +-----------------------+  |
     |  | Feature Extraction     |      | Multi-Class Threat    |  |
     |  | Vectorizer             |      | Classifier            |  |
     |  +-----------+------------+      +-----------+-----------+  |
     |  | Unsupervised Anomaly   |      | Explainable AI (XAI)  |  |
     |  | (Zero-Day Detector)    |      | SHAP Feature Attribution|
     |  +------------------------+      +-----------------------+  |
     +------------------------------+------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------+-------------------+       +-------------------+-----------+
| Autonomous Cloud Remediation  |       | Immutable Audit Storage       |
| AWS Lambda + SG IP Blocking   |       | S3 WORM Object Lock & KMS SSE |
+-------------------------------+       +-------------------------------+
            |                                               |
            +-----------------------+-----------------------+
                                    |
                                    v
                 +------------------+------------------+
                 | React SOC Dashboard (Vite + Tailwind|
                 | Live Metrics, Charts & Interactive  |
                 | Attack Simulation Console)          |
                 +-------------------------------------+
```

---

## 🛠️ Key Capabilities & Subsystems

1. **Decoupled Telemetry Ingestion Pipeline**: Secure ingestion, normalization, and validation of AWS CloudTrail JSON events, SSH brute-force attempts, and web application exploit probes.
2. **Adaptive Deception Engine**: Containerized Cowrie SSH and HTTP honeypot traps designed to capture real-time attacker payloads without risking internal cloud infrastructure.
3. **AI / ML Threat Detection Pipeline**:
   - **Feature Vectorizer**: Extracts payload entropy, keyword frequencies, failed auth flags, and privilege escalation indicators.
   - **Multi-Class Threat Classifier**: Detects `BRUTE_FORCE`, `SQL_INJECTION`, `IAM_PRIVILEGE_ESCALATION`, and `RECON_EXPLOIT`.
   - **Zero-Day Anomaly Detection**: Out-of-distribution score estimation for unseen zero-day attack vectors.
   - **Explainable AI (XAI)**: SHAP-driven feature attribution giving SOC analysts full visibility into machine learning decisions.
4. **Immutable S3 WORM Audit Vault**: Compliance-ready S3 Object Lock storage with AWS KMS customer-managed key encryption and SHA-256 integrity verification.
5. **Autonomous Serverless Containment**: AWS Lambda handler executing dynamic Security Group IP revocation and compromised IAM access key deactivation.
6. **React SOC Operations Dashboard**: Modern dark-themed dashboard built with React 18, Vite, Tailwind CSS, Recharts, and Axios featuring real-time metrics, interactive simulation console, and XAI explainability panels.

---

## 📁 Enterprise Repository Layout

```text
.
├── aws/                        # Cloud Infrastructure, WORM Vault & Serverless Containment
│   ├── cloudtrail_pipeline.py
│   ├── s3_worm_vault.py
│   └── lambda_remediation.py
├── backend/                    # FastAPI Microservices & Deception Traps
│   ├── main.py
│   ├── server.py
│   ├── api/
│   │   └── router.py
│   ├── schemas/
│   ├── services/
│   ├── threat_intel.py
│   ├── alerting.py
│   └── honeypots/
│       ├── ssh_honeypot.py
│       └── http_honeypot.py
├── ml/                         # Machine Learning & Explainable AI Pipeline
│   ├── feature_extractor.py
│   ├── threat_classifier.py
│   ├── anomaly_detector.py
│   └── xai_explainability.py
├── frontend/                   # Modern React SOC Operations Console
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── cloudformation/             # AWS CloudFormation Infrastructure Templates
│   └── honeypot_stack.json
├── tests/                      # Complete Automated Test Suite (38 Tests)
│   ├── test_end_to_end_integration.py
│   └── ...
├── Dockerfile                  # Production container configuration
├── docker-compose.yml          # Multi-container orchestration
├── requirements.txt            # Python dependencies
└── README.md                   # System Architecture Specification
```

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Clone the repository and prepare environment variables:
```bash
cp .env.example .env
```

### 2. Run the FastAPI Backend Server
Start the backend service:
```bash
python backend/server.py
```
*The REST API will start listening on `http://localhost:8000`. Access interactive Swagger docs at `http://localhost:8000/docs`.*

### 3. Launch the React SOC Dashboard
In a separate terminal, start the React + Vite development server:
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173`.

---

## 🧪 Testing & Quality Assurance

Run all 38 unit, subsystem, and end-to-end integration tests:
```bash
python -m unittest discover -s tests
```

Build the React frontend production bundle:
```bash
cd frontend
npm run build
```

---

## 🐳 Docker Deployment

Build and run using Docker Compose:
```bash
docker-compose up --build -d
```
Verify system health:
```bash
curl http://localhost:8000/health
```

---

## 🔐 Authentication System & Zero Trust Access Control

The platform features an enterprise-grade **JWT Authentication & RBAC System** protecting all SOC dashboard endpoints and APIs:

### 1. Key Authentication Features
- **Bcrypt Password Hashing**: Passwords stored securely in PostgreSQL using salt-hashed bcrypt algorithm.
- **Signed JWT Tokens**: Short-lived access tokens signed using HMAC SHA-256 (`HS256`) with configurable expiration (`ACCESS_TOKEN_EXPIRE_MINUTES`).
- **Dependency Guard (`get_current_user`)**: Reusable FastAPI dependency ensuring unauthenticated requests receive `HTTP 401 Unauthorized`.
- **Axios Request Interceptor**: Frontend automatically injects `Authorization: Bearer <token>` into all REST requests.
- **Route Guarding (`ProtectedRoute`)**: React Router protects SOC telemetry pages and redirects unauthenticated users to `/login`.

### 2. Authentication API Specification
| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Public | Register new analyst with unique `username`, `email`, and `password`. |
| `/auth/login` | `POST` | Public | Authenticate credentials and receive JWT `access_token`. |
| `/auth/me` | `GET` | Protected | Retrieve profile details for current authenticated analyst. |
| `/auth/logout` | `POST` | Protected | Logout analyst session and clear local token cache. |

---

## 📜 Security Standards & Compliance

- **NIST SP 800-207**: Zero Trust access control model enforced across API microservices.
- **S3 WORM Audit Immutability**: Cryptographic SHA-256 integrity checks preventing log tampering.
- **OWASP Top 10 API Security**: CORS middleware, Pydantic input validation, bcrypt password hashing, and JWT token protection.

