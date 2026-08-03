# Module 1: Cloud Computing Fundamentals & Threat Architecture

## 🎯 Learning Objectives
By completing this module, you will:
1. Understand core Cloud Computing deployment models (Public, Private, Hybrid, Multi-cloud) and service models (IaaS, PaaS, SaaS).
2. Grasp the **Shared Responsibility Model** in AWS and how cloud security responsibilities are divided between AWS and the client.
3. Understand Cloud Threat Modeling: How attackers target cloud infrastructures (Public S3 Buckets, Exposed SSH Ports, Over-privileged IAM Roles, Compromised API Keys).
4. Learn the MITRE ATT&CK Framework for Cloud (Initial Access, Execution, Persistence, Privilege Escalation, Exfiltration).
5. Build and execute a foundational **Python Cloud Security Event Simulator** to generate and parse structured JSON telemetry logs.

---

## 📚 Prerequisites
- Basic Python syntax (Dictionaries, Lists, Functions, `json` module).
- Conceptual understanding of client-server network communication.

---

## 🧠 Comprehensive Theory

### 1. What is Cloud Computing?
Cloud computing is the on-demand delivery of compute power, database storage, applications, and other IT resources through a cloud services platform via the Internet with pay-as-you-go pricing.

#### The 3 Core Cloud Service Models:
1. **Infrastructure as a Service (IaaS)**: Gives you high flexibility and management control over your IT resources. Example: AWS EC2 (Virtual Machines), Virtual Private Cloud (VPC). You manage the OS, software, and data.
2. **Platform as a Service (PaaS)**: Removes the need for you to manage the underlying infrastructure (like OS patching or hardware allocation) so you can focus on application deployment. Example: AWS Elastic Beanstalk, Heroku.
3. **Software as a Service (SaaS)**: Provides you with a completed product that is run and operated by the service provider. Example: Google Workspace, Microsoft 365.

---

### 2. AWS Shared Responsibility Model
Security and Compliance is a shared responsibility between AWS and the customer:
- **AWS is responsible for "Security OF the Cloud"**: Protecting the physical infrastructure, data centers, hardware, hypervisors, and core networking that run all of the services offered in the AWS Cloud.
- **Customer is responsible for "Security IN the Cloud"**: Managing operating system updates/patches, network firewall configuration (Security Groups), Identity & Access Management (IAM permissions), client/server encryption, and application data security.

> **Why this project exists**: Many cloud breaches happen NOT because AWS was hacked, but because customers improperly configure their cloud resources (e.g., exposing database ports, weak passwords, leaky S3 buckets). Our platform monitors customer cloud telemetry to automatically detect and respond to these threats.

---

### 3. MITRE ATT&CK Matrix for Cloud
Threat actors use well-defined tactics to compromise cloud environments:
- **Initial Access**: Brute-forcing open SSH ports on honeypots, exploiting public web applications, stealing leaked API credentials.
- **Execution**: Running unauthorized cryptominers or malware scripts on EC2 instances.
- **Privilege Escalation**: Exploiting weak IAM policies to elevate access from a low-level service to `AdministratorAccess`.
- **Exfiltration**: Copying sensitive data out of internal databases or private S3 buckets to an external IP address.
- **Defense Evasion**: Disabling AWS CloudTrail logging to erase attack traces.

---

## 🏗️ System Architecture Flow (Module 1 Scope)

```
+--------------------------+       +------------------------------------+
| Cloud Attack Simulator   | ----> | Cloud Security Log Parser Engine  |
| (Simulates Malicious    |       | (Parses CloudTrail, Syslog,        |
| SSH, S3, IAM Events)     |       | & Honeypot Raw Json Logs)          |
+--------------------------+       +------------------------------------+
                                                     |
                                                     v
                                   +------------------------------------+
                                   | JSON Telemetry Stream Storage      |
                                   | (logs/cloud_events.json)           |
                                   +------------------------------------+
```

---

## 🛠️ Code Implementation & Hands-on Simulation
We build `ml/cloud_telemetry_simulator.py` to act as our telemetry log generator and security parser engine.

---

## ❓ Quiz & Knowledge Check
1. **Under the AWS Shared Responsibility Model, who is responsible for configuring Security Group firewall rules?**
   - *Answer*: The Customer ("Security IN the cloud").
2. **What Cloud Service model does AWS EC2 fall under?**
   - *Answer*: Infrastructure as a Service (IaaS).
3. **What is the primary danger of leaving an S3 bucket configured with Public Read permissions?**
   - *Answer*: Data exfiltration and confidential data exposure.

---

## 🎓 Interview & Viva Questions
**Q1: Explain the Shared Responsibility Model to a non-technical manager.**
*Answer*: Imagine renting an apartment. The landlord (AWS) is responsible for the roof, physical doors, and building foundation (Security OF the cloud). But as the tenant (Customer), you are responsible for locking your door, setting alarm codes, and choosing who you let inside (Security IN the cloud).

**Q2: What is MITRE ATT&CK for Cloud?**
*Answer*: MITRE ATT&CK is a globally accessible knowledge base of adversary tactics and techniques based on real-world observations. In cloud security, it helps us categorize attack behaviors like credential dumping, IAM privilege escalation, and CloudTrail logging bypass.
