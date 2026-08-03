# Principal Architecture Review & Enterprise Security Hardening Report

> **Project Title**: AI-Driven Autonomous Cloud Threat Intelligence Platform  
> **Author**: Principal Cloud Security Architect & Mentor  
> **Milestone**: Architecture Review (v0.3.0)  
> **Target Audience**: Final Year Evaluation Panel, Enterprise Security Audits, Placement Technical Interviews

---

## 🏛️ 1. Executive Summary & Audit Findings

As Principal Cloud Security Architect, I conducted a full structural evaluation of the initial baseline developed in **Module 1** and **Module 2**. While the initial scripts established basic log generation and CloudFormation IaC deployment, a enterprise architecture review identified critical areas for hardening before scale.

### Key Audit Findings & Architectural Weaknesses Identified:

| Category | Finding in Initial Baseline | Enterprise Security Risk | Proposed Architectural Resolution |
|---|---|---|---|
| **Network Egress** | Honeypot Security Group had unrestricted `0.0.0.0/0` outbound egress. | A compromised honeypot could be repurposed as a botnet relay or pivot internally. | Enforce Zero Trust micro-segmentation with egress rules restricted ONLY to CloudWatch/Kinesis VPC endpoints. |
| **Log Pipeline** | Direct file system log parsing (`cloud_telemetry_simulator.py`). | Monolithic coupling; log loss during high-volume DDoS traffic spikes. | Introduce an event-driven decoupled pipeline using **Amazon Kinesis Data Firehose** + **Amazon SQS Queue**. |
| **Log Immutability** | Default S3 bucket SSE-S3 encryption without version lock. | Threat actor with compromised credentials could erase audit trail logs. | Enforce **S3 Object Lock (WORM - Write Once Read Many)** and **AWS KMS Customer Managed Keys (CMK)**. |
| **API Security** | Direct backend access without explicit API Gateway boundary. | Potential OWASP API vulnerability (Broken Object Level Authorization). | Introduce FastAPI API Gateway with **JWT Auth**, **Role-Based Access Control (RBAC)**, and **Rate Limiting**. |

---

## 🛡️ 2. Alignment with Security & Architectural Frameworks

### A. AWS Well-Architected Framework (5 Pillars)
1. **Security**: Identity management via IAM Least Privilege, KMS encryption at rest, TLS 1.3 in transit, and Zero Trust micro-segmentation.
2. **Reliability**: Asynchronous log buffering via Amazon SQS; if the ML worker container reboots, logs remain safely queued in SQS.
3. **Operational Excellence**: 100% parameterised Infrastructure as Code via CloudFormation, with structured JSON logging and OpenTelemetry trace metadata.
4. **Performance Efficiency**: Machine learning inference decoupled onto worker services; asynchronous FastAPI endpoints prevent UI freezing.
5. **Cost Optimization**: Auto-scaling resources, utilizing AWS Free Tier `t2.micro` instances and S3 Intelligent-Tiering.

---

### B. Zero Trust Security Model (NIST SP 800-207)
The core philosophy of Zero Trust is **"Never Trust, Always Verify"**.
- **Micro-Segmentation**: Divided VPC into 3 non-overlapping security tiers:
  - `Public Subnet (10.0.1.0/24)`: Honeypot Deception Traps.
  - `Private App Subnet (10.0.2.0/24)`: ML Analytics & FastAPI Microservices.
  - `Private DB Subnet (10.0.3.0/24)`: PostgreSQL Database.
- **Explicit Access Rules**: Subnet C (Database) accepts connections ONLY from Subnet B (Backend SG). Honeypot Subnet A is physically barred from accessing Subnets B or C.

---

### C. MITRE ATT&CK Cloud Matrix Integration
Our platform maps telemetry directly against MITRE ATT&CK tactics:
- **T1078 (Valid Accounts)**: Flagged when low-privilege IAM users execute administrative actions.
- **T1110 (Brute Force)**: Captured by Adaptive SSH Honeypot (Port 2222).
- **T1530 (Data from Cloud Storage)**: Detected when S3 bucket policies are modified to allow public access.
- **T1562 (Impair Defenses)**: Triggered if CloudTrail logging is disabled.

---

### D. OWASP API Security Top 10 Safeguards
- **API1:2023 Broken Object Level Authorization**: Mitigated via strict JWT claim validation.
- **API4:2023 Unrestricted Resource Consumption**: Enforced via FastAPI rate-limiting middleware (`SlowAPI`).
- **API8:2023 Security Misconfiguration**: Automated via CloudFormation static analysis.

---

## 🔄 3. Rationale for Service Replacements & Module Flow

### A. Service Replacements
1. **Replaced Direct File Logging with Decoupled SQS/Kinesis Queue**:
   - *Why*: Synchronous file writes cannot handle thousands of logs per second during an active attack. SQS provides distributed backpressure and durability.
2. **Added AWS WAF (Web Application Firewall)**:
   - *Why*: AWS Security Groups operate at Layer 4 (IP/Port). AWS WAF operates at Layer 7 (HTTP/HTTPS), enabling automated blocking of SQL Injection, Cross-Site Scripting (XSS), and malicious user agents.

### B. Module Sequence Rationale
- **Module 3 (Cloud Networking & Firewalls)** comes immediately next because establishing Zero Trust subnet micro-segmentation must occur *before* deploying compute hosts (Module 5) or database microservices (Module 9).

---

## 🌟 4. Key Highlights to Impress External Examiners & Interviewers
When demonstrating this project to final-year project reviewers or placement interviewers, highlight these key design points:
1. *"We did not simply build a basic web app; we architected a decoupled, event-driven cloud security ingestion pipeline using SQS and Kinesis Firehose."*
2. *"Our infrastructure implements Zero Trust micro-segmentation, ensuring that a compromised honeypot cannot pivot into internal database subnets."*
3. *"We integrated Explainable AI (SHAP), providing SOC analysts with transparent feature attributions explaining WHY the Machine Learning model flagged an event as malicious."*
4. *"Our automated response engine operates serverlessly via AWS Lambda and AWS WAF, dynamically banning threat actor IPs in real-time."*
