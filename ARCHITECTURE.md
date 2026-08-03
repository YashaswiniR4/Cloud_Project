# Enterprise Architecture & System Design Specification
## AI-Driven Autonomous Cloud Threat Intelligence Platform

### 1. High-Level Enterprise Architecture (Zero Trust & Decoupled)

```
+---------------------------------------------------------------------------------------------------+
|                                 ATTACK SURFACE & INGESTION LAYER                                  |
|                                                                                                   |
|  Attacker / External Probe  -->  Public Subnet (VPC 10.0.0.0/16)                                  |
|                                   |-- Honeypot Trap Host (SSH:2222, HTTP:80)                      |
|                                   |-- Egress Restricted via Egress Security Group Firewall        |
+-----------------------------------|---------------------------------------------------------------+
                                    | Continuous Syslog / Audit Telemetry
                                    v
+---------------------------------------------------------------------------------------------------+
|                               DECOUPLED EVENT-DRIVEN LOG PIPELINE                                 |
|                                                                                                   |
|  AWS CloudTrail  +  AWS GuardDuty  +  Honeypot Collector Agent                                    |
|                                   |                                                               |
|                                   v                                                               |
|                        [ Amazon Kinesis Data Firehose ]                                           |
|                                   |                                                               |
|             +---------------------+---------------------+                                         |
|             |                                           |                                         |
|             v                                           v                                         |
|  [ S3 WORM Audit Bucket ]                      [ Amazon SQS Queue ]                               |
|  (AES-256 KMS Encryption)                      (Event Buffering & Backpressure)                   |
+---------------------------------------------------------|-----------------------------------------+
                                                          | Worker Ingestion Stream
                                                          v
+---------------------------------------------------------------------------------------------------+
|                              ANALYTICS, ML & EXPLAINABLE AI LAYER                                 |
|                                                                                                   |
|  - Preprocessing & Feature Vectorization Engine                                                   |
|  - Isolation Forest Model (Unsupervised Zero-Day Anomaly Detection)                               |
|  - XGBoost Classifier (Multi-Class Attack Taxonomy)                                               |
|  - SHAP Explainer Engine (Model Interpretability & Feature Attribution)                           |
+---------------------------------------------------------|-----------------------------------------+
                                                          | Threat Score & Risk Insight
                                                          v
+---------------------------------------------------------------------------------------------------+
|                           THREAT INTELLIGENCE & REMEDIATION ORCHESTRATION                         |
|                                                                                                   |
|  - External Threat Intel Aggregator (AbuseIPDB & VirusTotal REST APIs)                            |
|  - Incident Response Controller (AWS Lambda Serverless Function)                                  |
|  - AWS WAF & Security Group Auto-Blocker Engine                                                   |
|  - AWS SNS Real-time Security Notification Publisher (Email / Webhooks)                           |
+---------------------------------------------------------|-----------------------------------------+
                                                          | REST APIs & WebSockets
                                                          v
+---------------------------------------------------------------------------------------------------+
|                              SECURITY OPERATIONS DASHBOARD LAYER                                  |
|                                                                                                   |
|  - FastAPI Async REST Gateway (JWT Authentication & RBAC Enforced)                                |
|  - PostgreSQL Database (Private Subnet - Encrypted Storage)                                       |
|  - React + Tailwind CSS Real-Time Analyst Operations Console                                      |
+---------------------------------------------------------------------------------------------------+
```

---

### 2. Network Topology & Zero Trust Micro-Segmentation

```
+---------------------------------------------------------------------------------------------------+
|                                  VPC: 10.0.0.0/16 (HoneypotVPC)                                   |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Public Subnet (10.0.1.0/24) - Isolation Boundary A                                         |  |
|  |   - Honeypot Instance (t2.micro)                                                            |  |
|  |   - Inbound: Ports 22, 80, 2222 Allowed                                                      |  |
|  |   - Outbound: STRICTLY Restricted to Kinesis/CloudWatch Enpoints ONLY (NO VPC Internal Access) |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Private App Subnet (10.0.2.0/24) - Isolation Boundary B                                    |  |
|  |   - FastAPI Backend Container / Application Workloads                                       |  |
|  |   - SQS Worker Nodes & Machine Learning Pipeline                                            |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Private Database Subnet (10.0.3.0/24) - Isolation Boundary C                                 |  |
|  |   - PostgreSQL Storage Engine (Encrypted RDS / Container volume)                             |  |
|  |   - Inbound: ALLOWED ONLY from Boundary B (FastAPI Backend SG)                               |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

### 3. Data & Security Flow Sequence

1. **Ingestion & Buffering**: Attacker activities hit the public honeypot traps. Logs stream into Amazon SQS via Kinesis Firehose, preventing data loss during traffic spikes.
2. **Feature Vectorization**: SQS worker processes standardizes logs into numerical feature matrices.
3. **ML & XAI Analysis**: Dual-stage inference: Isolation Forest flags anomalies; XGBoost classifies attack taxonomy; SHAP computes feature importance.
4. **Threat Enrichment**: Attacker source IP reputation requested asynchronously from AbuseIPDB API.
5. **Autonomous Mitigation**: If combined threat score exceeds threshold (>80), AWS Lambda dynamically pushes a block rule to AWS WAF / Security Group and publishes an SNS notification.
6. **SOC Presentation**: Dashboard queries FastAPI REST endpoints to render live heatmaps, waterfall XAI charts, and incident timelines.
