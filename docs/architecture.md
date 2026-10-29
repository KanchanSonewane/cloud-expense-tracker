# System Architecture: Cloud-Based Expense Tracker

## 1. High-Level Architectural Overview

The **Cloud-Based Expense Tracker** is architected according to AWS cloud-native best practices for security, scalability, and separation of concerns.

The application decouples:
- **Compute:** Amazon EC2 running a Node.js/Express.js web application server.
- **Relational Data:** Amazon RDS (Relational Database Service) for MySQL managing users, accounts, and financial transactions.
- **Unstructured Document Storage:** Amazon S3 (Simple Storage Service) for receipt attachments (PNG, JPG, PDF) with **S3 Versioning** enabled.
- **Security & Authorization:** AWS IAM (Identity and Access Management) Instance Profile attached to EC2 for least-privilege credential-less access to S3.
- **Network Isolation:** Amazon VPC (Virtual Private Cloud) utilizing public subnets for compute and private subnets for the database tier.

---

## 2. Cloud Architecture Diagram

```text
                                  ┌─────────────────────────┐
                                  │   End Users / Browser   │
                                  └────────────┬────────────┘
                                               │ HTTP / HTTPS (Port 80/443)
                                               ▼
                                  ┌─────────────────────────┐
                                  │     Internet Gateway    │
                                  └────────────┬────────────┘
                                               │
===============================================│===================================================
AWS Virtual Private Cloud (VPC: 10.0.0.0/16)   │
                                               ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
 │ Public Subnet (10.0.1.0/24 - Availability Zone: us-east-1a)                                   │
 │                                                                                               │
 │   ┌─────────────────────────────────────────────────────────────┐                             │
 │   │                   Amazon EC2 Instance                       │                             │
 │   │  ┌───────────────────────┐       ┌───────────────────────┐  │                             │
 │   │  │   Frontend (Static)   │       │  Node.js / Express    │  │                             │
 │   │  │  HTML5 / CSS3 / JS    │ ────> │  REST API (Port 3000) │  │                             │
 │   │  └───────────────────────┘       └───────────┬───────────┘  │                             │
 │   │                                              │              │                             │
 │   │  EC2 Security Group (sg-web)                 │              │                             │
 │   │  Inbound: 80, 443, 22                        │              │                             │
 │   └──────────────────────────────────────────────│──────────────┘                             │
 │                                                  │ IAM Role (S3 Access)                       │
 └──────────────────────────────────────────────────┼────────────────────────────────────────────┘
                                                    │
                   ┌────────────────────────────────┴────────────────────────────────┐
                   │                                                                 │
                   ▼ (MySQL Port 3306)                                               ▼ (AWS SDK v3 / HTTPS)
 ┌──────────────────────────────────────────────────┐             ┌──────────────────────────────────────┐
 │ Private Subnet (10.0.2.0/24 - us-east-1b)        │             │             Amazon S3                │
 │                                                  │             │                                      │
 │   ┌──────────────────────────────────────────┐   │             │  Bucket: cloud-expense-receipts      │
 │   │        Amazon RDS for MySQL 8.0          │   │             │                                      │
 │   │                                          │   │             │  • Path: /receipts/user_{id}/...     │
 │   │  • Table: users (Bcrypt passwords)       │   │             │  • Feature: S3 Object Versioning     │
 │   │  • Table: transactions (Metadata)        │   │             │  • Presigned URLs (Time-limited)     │
 │   │  • No public IP address                  │   │             │  • Encryption: SSE-S3 (AES-256)      │
 │   └──────────────────────────────────────────┘   │             └──────────────────────────────────────┘
 │                                                  │
 │  RDS Security Group (sg-rds)                     │
 │  Inbound: 3306 ONLY from sg-web                  │
 └──────────────────────────────────────────────────┘
===================================================================================================
```

---

## 3. Component Deep Dive

### A. Amazon EC2 (Elastic Compute Cloud) — Compute Layer
- **Role:** Web and API application server.
- **Operating System:** Amazon Linux 2023 or Ubuntu 22.04 LTS.
- **Instance Sizing:** `t2.micro` or `t3.micro` (AWS Free Tier eligible: 1 vCPU, 1 GiB RAM).
- **Network Placement:** Launched inside a **Public Subnet** with an assigned Public IPv4 and attached **Internet Gateway (IGW)**.
- **Process Supervision:** Supervised by `systemd` or `PM2` to automatically restart upon reboot or unhandled exceptions.

### B. Amazon RDS for MySQL — Relational Database Layer
- **Role:** Persistent system of record for structured data.
- **Storage Strategy:** Instead of storing binary image blobs inside the database (which degrades memory buffers, backups, and query speeds), RDS stores only the S3 Object Key reference (`receipt_key`, e.g., `receipts/user_1/1730141200_lunch.png`).
- **Security Group Isolation:** The RDS instance has **Publicly Accessible = False**. It only accepts TCP traffic on Port 3306 from the specific Security Group ID of the EC2 instance (`sg-web`). Even if an attacker knows the database endpoint, direct access from the public internet is impossible.

### C. Amazon S3 (Simple Storage Service) — Document Storage Layer
- **Role:** Durable, highly available object storage for receipts (PNG, JPG, PDF).
- **Storage Class:** S3 Standard (99.999999999% / 11 9's durability).
- **Security Policy:** Bucket blocks public access (`BlockPublicAcls = true`, `BlockPublicPolicy = true`).
- **Access Pattern:** Client browsers access receipts securely via **AWS Presigned Signed URLs** generated by the backend with a 1-hour expiration.

### D. Amazon S3 Versioning (Data Protection & Lab Demonstration)
- **Lab Syllabus Requirement:** Practical 5 ("Implement versioning with S3 bucket to restore files that are deleted accidentally and keep different versions of the same object").
- **Implementation:**
  - Bucket Versioning is set to `Enabled`.
  - When a user modifies a transaction and uploads a new receipt under the same transaction reference, S3 creates a new immutable version without overwriting the original.
  - Calling `s3Service.listReceiptVersions(key)` retrieves every historical `VersionId`, file size, and upload timestamp.
  - If a file is deleted without specifying a version ID, S3 inserts a **Delete Marker**. Deleting the delete marker instantly restores the file.

### E. AWS IAM (Identity and Access Management)
- **Role:** Credential-less authentication.
- **Mechanism:** An IAM Role with an inline policy granting `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucketVersions` is attached to the EC2 instance profile.
- **Advantage:** The Node.js application does not require `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` to be saved in `.env` or in Git commits. The AWS SDK v3 automatically fetches rotating credentials via IMDSv2 (`169.254.169.254`).

---

## 4. End-to-End Data Flow

### Scenario: Adding an Expense with Receipt
1. **User Client:** User fills out the expense form (Amount: ₹450, Category: Food, Date: 2026-10-28) and selects `lunch_bill.pdf`.
2. **HTTP Transmission:** Browser sends a `multipart/form-data` POST request with a JWT Bearer token in the `Authorization` header to `/api/transactions`.
3. **EC2 Application Server:**
   - Verifies JWT authenticity.
   - Multer middleware validates file type (MIME check) and size (&le; 5MB).
   - `s3Service.uploadReceipt()` streams the in-memory buffer to the S3 bucket using `PutObjectCommand`.
   - Amazon S3 returns the generated Object Key and `VersionId`.
4. **RDS MySQL Server:**
   - Parameterized SQL `INSERT` writes transaction metadata, user ID, amount, and `receipt_key` into table `transactions`.
5. **Client Response:** Backend returns a `201 Created` status with the new transaction object and a time-limited signed S3 preview URL.
