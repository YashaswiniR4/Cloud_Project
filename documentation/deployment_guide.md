# AWS EC2 Honeypot & Threat Intelligence Platform Deployment Guide

## Overview
This deployment guide details the steps to deploy the **AI-Driven Autonomous Cloud Threat Intelligence Platform** to live AWS Cloud Infrastructure using AWS CloudFormation.

---

## 🏗️ Detailed AWS Resource Breakdown

| AWS Resource | Resource Name in Template | Purpose & Configuration | AWS Free Tier Compatibility |
|---|---|---|---|
| **VPC** | `HoneypotVPC` | Isolated Virtual Private Cloud (`10.0.0.0/16`) hosting 3-tier subnets. | Free (Always Free) |
| **Internet Gateway** | `InternetGateway` | Provides IPv4 Internet connectivity to Public Subnet. | Free (Always Free) |
| **Public Subnet** | `HoneypotPublicSubnet` | Tier 1 Deception Subnet (`10.0.1.0/24`) hosting EC2 Honeypot. | Free |
| **Private App Subnet** | `PrivateAppSubnet` | Tier 2 Private Subnet (`10.0.2.0/24`) for backend REST services. | Free |
| **Private DB Subnet** | `PrivateDBSubnet` | Tier 3 Private Subnet (`10.0.3.0/24`) for PostgreSQL database engine. | Free |
| **Security Groups** | `HoneypotSecurityGroup` | Ingress open on ports 22, 80, 2222 for attack trap capture. Egress restricted to HTTPS log streaming. | Free |
| **S3 Audit Bucket** | `CloudTrailAuditBucket` | AES256 encrypted bucket with Object Lock for CloudTrail audit logs. | 5 GB Free Tier Storage |
| **CloudWatch Log Group**| `HoneypotCloudWatchLogGroup`| Aggregates real-time Cowrie and HTTP honeypot attack logs (`/aws/honeypot/telemetry`). | 5 GB Log Ingestion Free Tier |
| **AWS CloudTrail** | `PlatformCloudTrail` | Multi-region trail recording control plane and data API activity. | 1 Management Trail Free |
| **IAM Roles & Profiles**| `EC2HoneypotRole`, `LambdaRemediationRole`, `CloudTrailDeliveryRole` | Scoped least-privilege policies enforcing Zero Trust access. | Free |
| **EC2 Instance** | `EC2HoneypotInstance` | `t2.micro` / `t3.micro` instance running Docker, Cowrie SSH Honeypot, and HTTP Deception Server. | 750 Hours/Month Free |

---

## 🚀 Live AWS Deployment Steps

### 1. Prerequisites
- Installed AWS CLI (`aws --version`)
- Configured AWS credentials (`aws configure`) with `us-east-1` default region.

### 2. Deploy CloudFormation Stack
Run the following AWS CLI command to create the stack:
```bash
aws cloudformation create-stack \
  --stack-name threat-intel-honeypot-stack \
  --template-body file://aws/cloudformation_template.yaml \
  --parameters ParameterKey=EnvironmentName,ParameterValue=threat-intel-prod \
               ParameterKey=InstanceType,ParameterValue=t2.micro \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 3. Monitor Deployment Status
```bash
aws cloudformation describe-stacks \
  --stack-name threat-intel-honeypot-stack \
  --query "Stacks[0].StackStatus"
```
*Wait until status changes to `CREATE_COMPLETE`.*

### 4. Retrieve Honeypot Public IP Address
```bash
aws cloudformation describe-stacks \
  --stack-name threat-intel-honeypot-stack \
  --query "Stacks[0].Outputs[?OutputKey=='EC2HoneypotPublicIp'].OutputValue" \
  --output text
```

---

## 🧪 Verification & Testing

### 1. Verify SSH Honeypot (Cowrie) Response
Attempt an SSH connection to the honeypot IP:
```bash
ssh root@<EC2_HONEYPOT_PUBLIC_IP>
```
*Cowrie will simulate an open SSH login banner and log all password attempts.*

### 2. Verify HTTP Honeypot Trap
Execute a curl request to test web deception:
```bash
curl -i http://<EC2_HONEYPOT_PUBLIC_IP>/admin?cmd=cat%20/etc/passwd
```
*The request will return HTTP status 200 with maintenance payload and record the telemetry log in CloudWatch.*
