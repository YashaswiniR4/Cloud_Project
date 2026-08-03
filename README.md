# AI-Driven Autonomous Cloud Threat Intelligence Platform

> **Enterprise-Grade Cloud Security Solution featuring Adaptive Honeypots, Machine Learning Anomaly Detection, Explainable AI (SHAP), Automated Incident Response, and Real-Time Security Operations Dashboard.**

---

## 📌 Project Overview
This project is an end-to-end, enterprise-ready **Cloud Threat Intelligence & Incident Response Platform**. Designed in accordance with the **AWS Well-Architected Framework**, **Zero Trust Architecture**, **MITRE ATT&CK Cloud Matrix**, and **OWASP API Security** principles.

It simulates and monitors cloud network infrastructure, captures malicious intrusion attempts using adaptive honeypots, ingests telemetry log streams (CloudTrail, Syslog, Web Server logs) via an event-driven decoupled pipeline (Kinesis/SQS), classifies threats using Machine Learning models, provides model interpretability with SHAP (Explainable AI), enriches threat metrics via external Threat Intelligence feeds (VirusTotal, AbuseIPDB), and executes automated serverless remediation (IP blocking via AWS WAF / Lambda / Security Groups).

---

## 📂 Master Directory Structure
```
Project/
├── backend/            # FastAPI REST backend & security microservices
├── frontend/           # React + Tailwind UI dashboard
├── ml/                 # Telemetry parsers, ML models, SHAP explainers
│   └── cloud_telemetry_simulator.py
├── aws/                # CloudFormation / Terraform templates & Lambda functions
│   ├── iam_policies/                  # Production IAM policies
│   │   ├── honeypot_role_policy.json
│   │   └── lambda_remediation_policy.json
│   ├── aws_infrastructure_config.py
│   ├── cloudformation_template.yaml
│   ├── ec2_honeypot_provisioner.py   # EC2 Honeypot Launcher & UserData Bootstrapper
│   ├── iam_policy_enforcer.py         # IAM Policy Analyzer & Security Validator
│   └── vpc_network_validator.py       # VPC Subnet & Security Group Auditor
├── honeypot/           # Adaptive SSH/HTTP honeypot engines & loggers
├── database/           # PostgreSQL schemas, migrations & seed scripts
├── deployment/         # Docker Compose, Dockerfiles, CI/CD workflows
├── datasets/           # Raw & processed security log datasets
├── logs/               # Telemetry log outputs (cloud_events.json)
├── reports/            # Automated security posture PDF generation templates
├── documentation/      # SRS, Architecture Diagrams, API docs, Viva Q&A
│   ├── architectural_review.md
│   ├── module_01_cloud_fundamentals.md
│   ├── module_02_aws_infrastructure.md
│   └── module_03_cloud_networking.md
├── ARCHITECTURE.md     # Enterprise Architecture Specification
├── CHANGELOG.md        # Version Changelog (v0.5.0)
├── PROJECT_PROGRESS.md # Master Module Progress Matrix
├── REQUIREMENTS.md     # Software Requirements Specification (SRS)
└── README.md
```

---

## 📊 Master Agile Sprint Checklist

- [x] **Sprint 1 (Module 4-5)**: IAM Security Policy Enforcer & EC2 Honeypot Launcher
- [ ] **Sprint 2 (Module 6-8)**: Encrypted S3 WORM Bucket & CloudTrail Audit Ingestion Engine **[NEXT UP]**
- [ ] **Sprint 3 (Module 9-11)**: Python FastAPI Backend & Adaptive Honeypot Engines
- [ ] **Sprint 4 (Module 12-14)**: Security Log Preprocessing & XGBoost Attack Classifier
- [ ] **Sprint 5 (Module 15-17)**: Isolation Forest Zero-Day Anomaly Detector & SHAP Explainable AI
- [ ] **Sprint 6 (Module 18-21)**: Threat Intelligence API Integrations & Serverless Lambda Response
- [ ] **Sprint 7 (Module 22-25)**: Enterprise React Dashboard UI & Docker Containerization
- [ ] **Sprint 8 (Module 26-28)**: System Integration, Security Audit & Final Viva Voce Prep
