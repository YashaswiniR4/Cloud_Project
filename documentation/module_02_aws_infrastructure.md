# Module 2: AWS Core Services & Infrastructure Architecture

## 🎯 1. Objective
Establish an enterprise-grade AWS Cloud Infrastructure Foundation for our Cloud Threat Intelligence Platform. This includes:
- Security hardening for the AWS Root Account and setting up an IAM Admin user with MFA.
- Installing and configuring the AWS Command Line Interface (AWS CLI).
- Designing the Virtual Private Cloud (VPC) network topology, Security Groups, and Subnets.
- Provisioning an encrypted Amazon S3 Audit Bucket for log storage.
- Validating infrastructure blueprints via CloudFormation IaC templates and Python validation scripts.

---

## 🧠 2. Concepts Required

### A. Core AWS Security & Identity
- **Root Account vs. IAM User**: The root account has unrestricted access to all AWS resources and billing. Best practice mandates locking away root credentials and creating an **IAM User** with least-privilege permissions.
- **Multi-Factor Authentication (MFA)**: Adds a second security layer (TOTP authenticator app) to prevent unauthorized account access.

### B. Core AWS Infrastructure Services
- **Amazon VPC (Virtual Private Cloud)**: An isolated virtual network dedicated to your AWS account. You control IP ranges (`10.0.0.0/16`), subnets, route tables, and gateways.
- **Subnets**:
  - *Public Subnet*: Connected to the Internet Gateway; instances receive public IPs (used for honeypot deception traps).
  - *Private Subnet*: Isolated from direct inbound Internet access (used for database and ML backend services).
- **Security Groups vs. Network ACLs (NACLs)**:
  - *Security Group*: Stateful firewall operating at the EC2 instance level. (If inbound traffic is allowed, outbound response is automatically allowed).
  - *NACL*: Stateless firewall operating at the Subnet level.
- **Amazon EC2 (Elastic Compute Cloud)**: Virtual server instances in the cloud. We use `t2.micro` (Free Tier eligible: 1 vCPU, 1 GB RAM).
- **Amazon S3 (Simple Storage Service)**: Object storage service providing 99.999999999% (11 9's) durability. Used for CloudTrail logs.
- **AWS CloudTrail**: Records AWS API actions across your account for security auditing.
- **AWS CloudWatch**: Collects operational metrics, log files, and sets security alarms.

---

## 📂 3. Folder Structure & Files Created
```
Project/
├── aws/
│   ├── aws_infrastructure_config.py     # Local AWS CLI & CloudFormation validator script
│   └── cloudformation_template.yaml     # Production IaC infrastructure blueprint
├── documentation/
│   ├── module_01_cloud_fundamentals.md
│   └── module_02_aws_infrastructure.md  # Detailed Module 2 manual
├── ARCHITECTURE.md                       # Overall system architecture spec
├── CHANGELOG.md                          # Version changelog
├── PROJECT_PROGRESS.md                   # Live module progress matrix
└── REQUIREMENTS.md                       # Software Requirements Specification
```

---

## ⚙️ 4. AWS Setup & Installation Steps

### Step 1: AWS Account Security & IAM Setup (Console Step-by-Step)
1. Log in to [AWS Management Console](https://aws.amazon.com/console/) as Root User.
2. In the top search bar, type **IAM** (Identity and Access Management).
3. Under Security Status, enable **Multi-Factor Authentication (MFA)** for the root user.
4. Navigate to **Users** -> Click **Add user**.
   - User name: `ThreatIntelAdmin`
   - Select **AWS Management Console access** and **Programmatic access**.
5. Attach Permissions: Select **Attach policies directly** -> Choose `AdministratorAccess` (or custom least privilege security role).
6. Download the `credentials.csv` file containing **Access Key ID** and **Secret Access Key**. *Never share this file or push it to GitHub!*

### Step 2: Set Up AWS Cost Safeguard Budget (Free Tier Protection)
1. Search for **AWS Budgets** in the top search bar.
2. Click **Create Budget** -> Select **Cost budget**.
3. Set Budget Amount: `$1.00 USD`.
4. Set Alert Threshold: Notify your email when actual cost exceeds `80%` ($0.80 USD).

### Step 3: Install & Configure AWS CLI
- **Windows Installation**: Download AWS CLI v2 MSI Installer from AWS official docs.
- **Verification**: Run `aws --version` in terminal.
- **Configuration**:
  ```bash
  aws configure
  ```
  Provide:
  - `AWS Access Key ID`: [Your Access Key]
  - `AWS Secret Access Key`: [Your Secret Access Key]
  - `Default region name`: `us-east-1`
  - `Default output format`: `json`

---

## 🏛️ 5. Infrastructure Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                       AWS REGION (e.g. us-east-1)                             |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                   VPC: HoneypotVPC (10.0.0.0/16)                         |  |
|  |                                                                         |  |
|  |   +-----------------------------------------------------------------+   |  |
|  |   |             Public Subnet (10.0.1.0/24)                        |   |  |
|  |   |                                                                 |   |  |
|  |   |   +---------------------------------------------------------+   |   |  |
|  |   |   | Security Group: HoneypotSG                             |   |   |  |
|  |   |   | Ingress Rules:                                          |   |   |  |
|  |   |   |   - Port 22 (SSH Trap)   <-- 0.0.0.0/0                  |   |   |  |
|  |   |   |   - Port 80 (HTTP Trap)  <-- 0.0.0.0/0                  |   |   |  |
|  |   |   |   - Port 2222 (Deception)<-- 0.0.0.0/0                  |   |   |  |
|  |   |   +---------------------------------------------------------+   |   |  |
|  |   |                                                                 |   |  |
|  |   +-----------------------------------------------------------------+   |  |
|  |                                 |                                       |  |
|  +---------------------------------|---------------------------------------+  |
|                                    v                                          |
|  +-------------------------------------------------------------------------+  |
|  | S3 Audit Bucket: threat-intel-prod-cloudtrail-logs-[ACCOUNT_ID]         |  |
|  | (Encrypted via AES256, Public Access Blocked, Versioning Enabled)       |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 🧪 6. Testing & Validation

Run the Python infrastructure configuration script:
```bash
python aws/aws_infrastructure_config.py
```

### Expected Output:
```
==================================================
   MODULE 2: AWS INFRASTRUCTURE & CREDENTIAL CHECK
==================================================
2026-08-03 14:00:00 [INFO] AWSInfraValidator: Initialized AWS Validator for target region: us-east-1
2026-08-03 14:00:01 [INFO] AWSInfraValidator: CloudFormation Template '.../cloudformation_template.yaml' syntax validation passed.

[AWS Environment Diagnostic Summary]:
 - AWS CLI Installed: True / Simulated
 - IAM Credentials Active: True / Simulation Ready
 - CloudFormation Template Valid: True

[Free Tier Cost Avoidance Guidelines]:
{
  "ec2_recommendation": "t2.micro (750 hours/month free)",
  "s3_recommendation": "5 GB Standard Storage free",
  "cloudtrail_recommendation": "1 Management Trail (First copy is FREE)",
  "cost_alert_threshold": "$1.00 USD (Set up AWS Budget Alarm immediately)"
}

[✓] Module 2 Infrastructure Verification Completed.
```

---

## 💬 7. Placement & Viva Voce Questions

**Q1: Why should you never use the AWS Root Account for daily operational tasks or code integration?**
> *Answer*: The AWS Root account possesses unrestricted privileges across all account resources and billing settings. If root access keys are leaked or compromised, an attacker can delete all infrastructure or spin up thousands of dollars of unauthorized resources. Industry best practice requires locking away root credentials with MFA and performing all work using an IAM user governed by Least Privilege policies.

**Q2: What is the difference between a Security Group and a Network ACL (NACL)?**
> *Answer*: A Security Group acts as a **stateful** firewall at the EC2 instance level (inbound rules automatically allow return outbound traffic). A NACL acts as a **stateless** firewall at the Subnet level (inbound and outbound rules must be explicitly defined).

**Q3: How does Infrastructure as Code (IaC) like AWS CloudFormation benefit cloud security operations?**
> *Answer*: IaC allows security teams to define entire cloud architectures in declarative configuration files (YAML/JSON). This ensures consistent security guardrails, eliminates manual configuration drift, enables version control in GitHub, and allows rapid environment redeployment during disaster recovery.

---

## 🛑 8. Common Mistakes to Avoid
1. **Hardcoding API Keys in Source Code**: Never commit `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` to GitHub. Use environment variables or IAM roles.
2. **Leaving S3 Buckets Publicly Accessible**: Always enable "Block Public Access" on audit buckets.
3. **Ignoring AWS Budgets**: Always configure a $1.00 budget alarm to avoid unexpected charges.

---

## 📝 9. Git Commit Message Recommendation
```bash
git commit -m "feat(aws): completed Module 2 AWS Infrastructure configuration, IaC CloudFormation template, and documentation"
```

---

## ✅ 10. Module 2 Checklist Before Moving to Module 3
- [x] AWS Account security best practices documented.
- [x] IAM Admin creation and MFA procedure detailed.
- [x] AWS CLI validator script (`aws/aws_infrastructure_config.py`) written and tested.
- [x] CloudFormation template (`aws/cloudformation_template.yaml`) authored and syntax-validated.
- [x] System Architecture and SRS updated.
- [x] Module 2 test script executed with exit code 0.
