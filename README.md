# AI-Driven Autonomous Cloud Threat Intelligence Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/)
[![AWS Architecture](https://img.shields.io/badge/AWS-Well--Architected-orange)](https://aws.amazon.com/)
[![Security Standard](https://img.shields.io/badge/NIST-800--207%20Zero%20Trust-blue)](https://nist.gov/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

An enterprise-grade, real-time autonomous security operations platform designed following the **AWS Well-Architected Framework**, **Zero Trust Architecture (NIST SP 800-207)**, and **MITRE ATT&CK Cloud Matrix**.

---

## 🏛️ Platform Architecture & Engineering Principles

```
                  +-----------------------------------+
                  |   Public Internet / Attacker IPs  |
                  +-----------------+-----------------+
                                    |
                                    v
     +------------------------------+------------------------------+
     |                    Deception & Ingestion                    |
     |  +------------------------+      +-----------------------+  |
     |  | SSH Honeypot Trap      |      | HTTP Honeypot Trap    |  |
     |  | (Port 2222)            |      | (Port 8080)           |  |
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
     |  | (Zero-Day Detector)    |      | SHAP Feature Importance| |
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
```

---

## 🛠️ Key Capabilities & Subsystems

1. **Decoupled Telemetry & Ingestion**: Secure ingestion and threat scoring of AWS CloudTrail logs, SSH brute-force attempts, and web application exploit probes.
2. **Deception Network (Adaptive Honeypots)**: Isolated SSH and HTTP traps built to capture real-time attacker payloads without exposing internal cloud assets.
3. **AI Threat Pipeline**:
   - **Feature Vectorizer**: Extracts payload entropy, keyword frequencies, failed auth flags, and privilege escalation risks.
   - **Multi-Class Classifier**: Detects `BRUTE_FORCE`, `SQL_INJECTION`, `IAM_PRIVILEGE_ESCALATION`, and `RECON_EXPLOIT`.
   - **Zero-Day Anomaly Detection**: Out-of-distribution score estimation for unseen attack patterns.
   - **Explainable AI (XAI)**: SHAP-equivalent feature attribution for SOC analyst decision support.
4. **Immutable Audit Storage (WORM Vault)**: Compliance-ready S3 Object Lock storage with AWS KMS customer-managed key encryption.
5. **Serverless Autonomous Remediation**: AWS Lambda handler executing dynamic Security Group access revocation and compromised credential isolation.
6. **SOC Operations Dashboard**: HTML5 / CSS3 / Vanilla JS control panel featuring real-time security event feeds, metric counters, and honeypot simulation controls.

---

## 📁 Enterprise Repository Layout

```
├── config/                     # Centralized settings and logging config
│   ├── settings.py
│   └── logging_config.py
├── aws/                        # AWS Infrastructure, WORM Storage & Lambda Remediation
│   ├── s3_worm_vault.py
│   ├── cloudtrail_ingestor.py
│   └── lambda_remediation.py
├── backend/                    # REST API Backend & Honeypots
│   ├── server.py
│   ├── threat_intel.py
│   ├── alerting.py
│   └── honeypots/
│       ├── ssh_honeypot.py
│       └── http_honeypot.py
├── ml/                         # Machine Learning Pipeline
│   ├── feature_extractor.py
│   ├── threat_classifier.py
│   ├── anomaly_detector.py
│   └── xai_explainability.py
├── frontend/                   # SOC Operations Console UI
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/                      # Automated Unit & Integration Test Suite
│   ├── test_s3_and_cloudtrail.py
│   ├── test_backend_and_honeypots.py
│   ├── test_ml_pipeline.py
│   ├── test_anomaly_and_xai.py
│   ├── test_threat_intel_and_remediation.py
│   └── test_master_system_integration.py
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Multi-container service definition
├── requirements.txt            # Python dependencies
└── README.md                   # Enterprise System Specification
```

---

## 🚀 Quick Start Guide

### 1. Environment Setup
Clone the repository and prepare environment variables:
```bash
cp .env.example .env
```

### 2. Run the REST Backend Server
Start the backend microservice:
```bash
python backend/server.py
```
*The server will start listening on `http://localhost:8000`.*

### 3. Launch the SOC Operations Dashboard
Open `frontend/index.html` in any standard web browser or serve it using Python's static file server:
```bash
python -m http.server 3000 --directory frontend
```
Navigate to `http://localhost:3000`.

### 4. Execute Automated Test Suite
To verify end-to-end integration and run all 14 system tests:
```bash
python -m unittest discover -s tests
```

---

## 🐳 Docker Deployment

Build and run using Docker Compose:
```bash
docker-compose up --build -d
```
Verify container health:
```bash
curl http://localhost:8000/health
```

---

## 📜 Compliance & Security Controls

- **NIST SP 800-207**: Zero Trust access control applied across microservices.
- **WORM Audit Immutability**: Cryptographic SHA-256 integrity verification prevents audit tampering.
- **OWASP API Security Top 10**: Enforced CORS headers, input sanitization, and strict request validation.
