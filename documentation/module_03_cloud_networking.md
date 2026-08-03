# Module 3: Cloud Networking, VPC, Security Groups & Firewalls

## 🎯 1. Objective
Build the production Zero Trust network infrastructure for our Cloud Threat Intelligence Platform.
- Design a 3-tier Virtual Private Cloud (VPC) topology (`10.0.0.0/16`).
- Allocate 3 non-overlapping subnets:
  1. `Public Honeypot Subnet` (`10.0.1.0/24`)
  2. `Private App Subnet` (`10.0.2.0/24`)
  3. `Private DB Subnet` (`10.0.3.0/24`)
- Provision Internet Gateway (IGW), Route Tables, and Subnet Associations.
- Configure stateful Security Groups enforcing Zero Trust least privilege:
  - `HoneypotSG` (Ports 22, 80, 2222)
  - `BackendSG` (Port 8000 from Public Subnet)
  - `DatabaseSG` (Port 5432 strictly from Backend SG)
- Author Network Access Control Lists (NACLs) for stateless perimeter defense.
- Execute Python VPC Network Validator (`aws/vpc_network_validator.py`).

---

## 🧠 2. Concepts Required

### A. IP Addressing & Subnet Masking
- **VPC CIDR `10.0.0.0/16`**: Provides $2^{16} = 65,536$ total IP addresses (`10.0.0.0` to `10.0.255.255`).
- **Subnet CIDR `/24`**: Provides $2^8 = 256$ IP addresses per subnet. AWS reserves 5 IP addresses per subnet (Network ID, Router, DNS, Future use, Broadcast).

### B. Network Routing & Gateways
- **Internet Gateway (IGW)**: Allows resources in public subnets to connect to the Internet and receive incoming connection requests.
- **Route Table**: Set of rules (routes) used to determine where network traffic is directed.
  - Public Route Table: Destination `0.0.0.0/0` -> Target `igw-xxxxxxxx`.
  - Private Route Table: Internal local routes only (`10.0.0.0/16 local`).

### C. Firewall Defense Tiers: Security Groups vs NACLs
| Feature | Security Group (SG) | Network ACL (NACL) |
|---|---|---|
| **Level** | Instance level (Virtual NIC) | Subnet perimeter level |
| **State** | **Stateful** (Return traffic automatically allowed) | **Stateless** (Inbound & Outbound rules required) |
| **Rules** | Allow rules ONLY (Default deny all) | Allow AND Deny rules |
| **Evaluation**| All rules evaluated before decision | Evaluated in sequential rule order |

---

## 📂 3. Folder Structure & Files Updated
```
Project/
├── aws/
│   ├── aws_infrastructure_config.py
│   ├── cloudformation_template.yaml     # Updated with complete 3-Tier VPC, SGs, & NACLs
│   └── vpc_network_validator.py        # Created VPC Subnet & Security Group Auditor
├── documentation/
│   ├── architectural_review.md
│   ├── module_01_cloud_fundamentals.md
│   ├── module_02_aws_infrastructure.md
│   └── module_03_cloud_networking.md   # Complete Module 3 manual
├── ARCHITECTURE.md
├── CHANGELOG.md
├── PROJECT_PROGRESS.md
├── REQUIREMENTS.md
└── README.md
```

---

## 🏛️ 4. Network Topology Architecture Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                  VPC CIDR: 10.0.0.0/16 (HoneypotVPC)                              |
|                                                                                                   |
|  [ Internet Gateway (IGW) ] <--- Route: 0.0.0.0/0                                                 |
|          |                                                                                        |
|          v                                                                                        |
|  +---------------------------------------------------------------------------------------------+  |
|  | Public Subnet (10.0.1.0/24) - Tier 1: Deception Zone                                       |  |
|  |   NACL: PublicSubnetNACL (Rule 100: Allow All TCP)                                         |  |
|  |   Security Group: HoneypotSecurityGroup                                                     |  |
|  |     - Ingress: TCP 22 (SSH), TCP 80 (HTTP), TCP 2222 (Deception) from 0.0.0.0/0             |  |
|  |     - Egress: HTTPS 443 strictly to log API endpoints                                      |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Private App Subnet (10.0.2.0/24) - Tier 2: Microservice & ML Zone                           |  |
|  |   NACL: PrivateSubnetNACL (Rule 100: Allow 10.0.0.0/16)                                        |  |
|  |   Security Group: BackendSecurityGroup                                                      |  |
|  |     - Ingress: TCP 8000 allowed from 10.0.1.0/24                                            |  |
|  |     - Egress: Outbound allowed for Threat Intel APIs                                       |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Private DB Subnet (10.0.3.0/24) - Tier 3: Isolated Database Zone                             |  |
|  |   NACL: PrivateSubnetNACL (Rule 100: Allow 10.0.0.0/16)                                        |  |
|  |   Security Group: DatabaseSecurityGroup                                                     |  |
|  |     - Ingress: TCP 5432 ALLOWED ONLY from BackendSecurityGroup ID (Zero Trust)               |  |
|  |     - Egress: Restricted strictly inside 10.0.0.0/16                                        |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 🧪 5. Testing & Validation

Run the Python network validator:
```bash
python aws/vpc_network_validator.py
```

### Expected Output:
```
==================================================
  MODULE 3: AWS VPC NETWORK & SECURITY AUDITOR    
==================================================
2026-08-03 14:10:00 [INFO] VPCNetworkValidator: Initialized VPC Validator for network: 10.0.0.0/16
2026-08-03 14:10:00 [INFO] VPCNetworkValidator: Successfully added subnet [PublicHoneypotSubnet]: 10.0.1.0/24 (256 IP addresses)
2026-08-03 14:00:00 [INFO] VPCNetworkValidator: Successfully added subnet [PrivateAppSubnet]: 10.0.2.0/24 (256 IP addresses)
2026-08-03 14:10:00 [INFO] VPCNetworkValidator: Successfully added subnet [PrivateDBSubnet]: 10.0.3.0/24 (256 IP addresses)
2026-08-03 14:10:00 [INFO] VPCNetworkValidator: Zero Trust Security Group Audit: PASSED (No critical isolation breaches).
2026-08-03 14:10:00 [INFO] VPCNetworkValidator: CloudFormation VPC Architecture Verification PASSED. All 12 resources present.

[VPC Network Diagnostics Summary]:
 - Subnet Allocation Valid: True
 - Zero Trust SG Audit Violations: 0
 - CloudFormation Network Blueprint Valid: True

[✓] Module 3 VPC Networking & Zero Trust Verification Complete.
```

---

## 💬 6. Viva Voce & Interview Questions

**Q1: How do you enforce Zero Trust database isolation at the network layer in AWS?**
> *Answer*: We place the database inside an isolated Private Subnet (`10.0.3.0/24`) with no direct internet route. In the `DatabaseSecurityGroup`, we configure the inbound port 5432 rule to reference the `SourceSecurityGroupId` of the `BackendSecurityGroup` instead of an IP CIDR. This ensures that ONLY instances belonging to the Backend SG can communicate with PostgreSQL, regardless of their IP addresses.

**Q2: What is the difference between stateful Security Groups and stateless NACLs?**
> *Answer*: Security Groups operate statefully at the instance boundary; if inbound traffic is allowed, the response outbound traffic is automatically permitted. NACLs operate statelessly at the subnet boundary; rules must be configured explicitly for both inbound AND outbound traffic.

---

## 📝 7. Git Commit Recommendation
```bash
git add .
git commit -m "feat(networking): completed Module 3 VPC 3-tier micro-segmentation, Security Groups, NACLs, and network validator script"
```

---

## ✅ 8. Checklist Before Moving to Module 4
- [x] VPC network topology designed (`10.0.0.0/16`).
- [x] Public Honeypot, Private App, and Private DB subnets defined.
- [x] Zero Trust Security Group ingress and egress rules implemented.
- [x] Network ACLs configured for stateless subnet defense.
- [x] `aws/vpc_network_validator.py` authored and tested with exit code 0.
- [x] CloudFormation template updated and validated.
