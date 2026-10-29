# Cloud-Based Expense Tracker
> **A Cloud-Hosted Personal Expense Management System using Amazon Web Services (AWS)**  
> **Course:** B.Tech CSE — Cloud Computing Laboratory (Course Code: 24CS01TP0503)

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v20%2B%20%7C%20v22%2B-green.svg)](https://nodejs.org/)
[![AWS Services](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS%20%7C%20S3%20%7C%20IAM%20%7C%20VPC-orange.svg)](https://aws.amazon.com/)
[![Database](https://img.shields.io/badge/Database-Amazon%20RDS%20(MySQL)-blue.svg)](https://aws.amazon.com/rds/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

---

## 1. Project Title & Overview
**Cloud-Based Expense Tracker** is a full-stack, cloud-native web application designed to demonstrate the practical application of enterprise cloud infrastructure in modern software development.

Unlike conventional local expense tracking utilities that rely on local storage or SQLite files, this project decouples **compute (Amazon EC2)**, **relational data management (Amazon RDS for MySQL)**, **unstructured document storage (Amazon S3 with S3 Versioning)**, **network security (Amazon VPC)**, and **access governance (AWS IAM)**.

---

## 2. Problem Statement
Personal financial management requires high data durability, zero data loss, secure document storage for audit receipts, and remote access. Storing financial records and binary receipt attachments in a monolithic local server creates single points of failure, scaling bottlenecks, security vulnerabilities, and database bloat. This project resolves these issues by leveraging the AWS Cloud infrastructure to create a secure, resilient, and scalable expense tracking platform.

---

## 3. Project Objectives
- Enable users to securely register, authenticate, and manage income and expenditure.
- Store structured financial transactions in **Amazon RDS (MySQL)** with strict relational constraints and indexing.
- Offload invoice and receipt files (JPG, PNG, PDF) to **Amazon S3** using presigned URLs.
- Demonstrate **Amazon S3 Versioning** for object audit trails and accidental file deletion recovery.
- Host the backend and frontend on an **Amazon EC2** virtual instance within a custom **Amazon VPC**.
- Implement least-privilege security using an **IAM Instance Profile** (eliminating hardcoded credentials).
- Map cloud computing theoretical concepts directly to laboratory practical demonstrations.

---

## 4. Key Features
- **User Authentication & Authorization:**
  - Secure registration and login using **bcrypt** password hashing (work factor: 10).
  - Stateless **JSON Web Tokens (JWT)** for session authentication.
  - Multi-tenant data isolation: users can strictly view and manage only their own data.
- **Financial Analytics Dashboard:**
  - Real-time summary metric cards: *Total Income*, *Total Expenses*, *Net Balance*, and *Transaction Count*.
  - Category-wise spending visualization via interactive **Chart.js Doughnut Charts**.
  - Monthly cash flow trends via **Chart.js Bar Charts**.
  - Recent activity feed with quick access to receipts.
- **Transaction Management:**
  - Comprehensive CRUD operations (Create, Read, Update, Delete) for income and expenses.
  - Real-time filtering by *Type* (Income/Expense), *Category* (Food, Travel, Bills, etc.), and *Date Range*.
  - Instant keyword search across descriptions and categories.
  - Form validation: positive amounts, valid date picker, and input sanitization.
- **Amazon S3 Receipt Storage & Versioning:**
  - Direct file uploads (JPG, PNG, PDF up to 5MB) streamed to Amazon S3.
  - Secure browser preview via time-limited **Presigned URLs**.
  - **S3 Versioning Inspection:** Real-time visibility into historical object versions, timestamps, and Delete Markers.
- **Cloud Architecture Telemetry:**
  - Built-in diagnostic viewer (`/api/cloud/status`) displaying EC2 platform metadata, RDS MySQL connectivity, and S3 bucket health.

---

## 5. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Chart.js | Modern, responsive Single Page Application UI |
| **Backend** | Node.js, Express.js | Modular REST API with centralized error handling |
| **Database** | Amazon RDS for MySQL 8.0 / MySQL 8.0+ | Relational schema, connection pooling (`mysql2/promise`) |
| **Cloud Storage** | Amazon S3 | Document storage with AWS SDK v3 & S3 Versioning |
| **Cloud Compute** | Amazon EC2 | Virtual machine hosting Node.js runtime and web server |
| **Cloud Networking** | Amazon VPC, Subnets, Internet Gateway | Public/Private subnet topology |
| **Cloud Security** | AWS IAM Roles, Security Groups | Least-privilege IAM instance profile, stateful firewall rules |

---

## 6. System Architecture

```text
                                  ┌─────────────────────────┐
                                  │   End Users / Browser   │
                                  └────────────┬────────────┘
                                               │ HTTP (Port 80/3000)
                                               ▼
                                  ┌─────────────────────────┐
                                  │   Internet Gateway      │
                                  └────────────┬────────────┘
                                               │
===============================================│===================================================
AWS Virtual Private Cloud (VPC: 10.0.0.0/16)   │
                                               ▼
 ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
 │ Public Subnet (10.0.1.0/24 - us-east-1a)                                                      │
 │                                                                                               │
 │   ┌─────────────────────────────────────────────────────────────┐                             │
 │   │                   Amazon EC2 Instance                       │                             │
 │   │  ┌───────────────────────┐       ┌───────────────────────┐  │                             │
 │   │  │   Static Frontend     │       │  Node.js / Express    │  │                             │
 │   │  │  HTML5 / CSS3 / JS    │ ────> │  REST API (Port 3000) │  │                             │
 │   │  └───────────────────────┘       └───────────┬───────────┘  │                             │
 │   │                                              │              │                             │
 │   │  Security Group: ec2-web-sg                  │              │                             │
 │   │  Inbound: 80, 443, 3000, 22                  │              │                             │
 │   └──────────────────────────────────────────────│──────────────┘                             │
 │                                                  │ Attached IAM Role                          │
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
 │   │  • Stores Users & Transactions           │   │             │  • Receipts (JPG/PNG/PDF)            │
 │   │  • No public IP address                  │   │             │  • S3 Object Versioning Enabled      │
 │   │  • Accessible ONLY from ec2-web-sg       │   │             │  • Secure Presigned URLs (1 hr)      │
 │   └──────────────────────────────────────────┘   │             └──────────────────────────────────────┘
 │                                                  │
 │  Security Group: rds-mysql-sg                    │
 └──────────────────────────────────────────────────┘
===================================================================================================
```

---

## 7. AWS Services Used & Rationale

1. **Amazon EC2 (Elastic Compute Cloud):** Hosts the Express.js application runtime and serves the web frontend. Provides full control over operating system configurations, environment variables, and process supervisors.
2. **Amazon RDS (Relational Database Service):** Provides a managed MySQL 8.0 relational database with automated daily snapshots, automated security patching, multi-AZ failover capability, and connection isolation in a private subnet.
3. **Amazon S3 (Simple Storage Service):** Delivers durable object storage for receipt documents. Storing images in S3 instead of database BLOBs protects database query performance and significantly reduces storage costs.
4. **S3 Versioning:** Protects against accidental deletion and preserves historical versions of replaced receipts, satisfying the Cloud Lab data recovery practical.
5. **AWS IAM (Identity and Access Management):** Grants the EC2 instance controlled access to S3 using an IAM Role. Eliminates the critical security hazard of committing AWS secret keys into code repositories.
6. **Amazon VPC (Virtual Private Cloud):** Establishes an isolated virtual network with public subnets for compute and private subnets for the database tier.

---

## 8. Database Design

The schema is defined in `database/schema.sql` and follows standard third normal form (3NF).

```
   ┌───────────────────────┐             ┌─────────────────────────────────┐
   │         users         │             │          transactions           │
   ├───────────────────────┤             ├─────────────────────────────────┤
   │ id (PK, INT AUTO_INC) │ 1 ─────── N │ id (PK, INT AUTO_INC)           │
   │ name (VARCHAR)        │             │ user_id (FK -> users.id)        │
   │ email (VARCHAR, UNQ)  │             │ type (ENUM: income/expense)     │
   │ password_hash (VARCHAR│             │ amount (DECIMAL(10,2), >0)      │
   │ created_at (TIMESTAMP)│             │ category (VARCHAR)              │
   └───────────────────────┘             │ description (VARCHAR, NULL)     │
                                         │ transaction_date (DATE)         │
                                         │ receipt_key (VARCHAR, S3 KEY)   │
                                         │ receipt_filename (VARCHAR)      │
                                         │ created_at (TIMESTAMP)          │
                                         │ updated_at (TIMESTAMP)          │
                                         └─────────────────────────────────┘
```

---

## 9. Local Setup & Execution Instructions

You can run and test this project on your local machine immediately:

### Step 1: Clone and Navigate
```bash
git clone https://github.com/your-username/cloud-expense-tracker.git
cd cloud-expense-tracker
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

*(Note: If you do not have an active MySQL server running locally, the application automatically activates its built-in SQLite engine with an identical schema so you can evaluate the complete UI and APIs out of the box).*

### Step 4: Run Automated Verification Tests
```bash
npm test
```
All 12 integration tests will execute and confirm health check, user authentication, transactions CRUD, receipt uploads, dashboard calculations, and S3 versioning endpoints.

### Step 5: Start the Web Server
```bash
npm start
```
Open your browser and navigate to:
```
http://localhost:3000
```
- Click **Sign In** and use the demo credentials button (`demo@cloudlab.edu` / `Demo@1234`) or register a new user account.

---

## 10. AWS Cloud Deployment Instructions

For complete step-by-step instructions, consult [docs/aws-deployment.md](file:///c:/Users/Kanchan/Documents/antigravity/wonderful-kepler/docs/aws-deployment.md).

### Summary Deployment Steps:
1. **Create VPC (`10.0.0.0/16`)** with an Internet Gateway, one public subnet (`10.0.1.0/24`), and two private subnets (`10.0.2.0/24`, `10.0.3.0/24`).
2. **Create Security Groups:**
   - `ec2-web-sg`: Inbound HTTP (80/3000), SSH (22).
   - `rds-mysql-sg`: Inbound MySQL (3306) restricted to source `ec2-web-sg`.
3. **Launch Amazon RDS for MySQL (db.t3.micro)** inside the private subnet group with `Publicly Accessible = False`.
4. **Create Amazon S3 Bucket** and toggle **Bucket Versioning = Enabled**.
5. **Create IAM Role** with S3 read/write permissions and attach it to the EC2 instance profile.
6. **Launch EC2 Instance (Amazon Linux 2023)** in `public-subnet-1a` with `ec2-web-sg` and the attached IAM Role.
7. **SSH into EC2**, install Node.js, clone the repository, configure `.env` with the RDS endpoint, and run `pm2 start backend/server.js`.

---

## 11. Environment Variables Specification

| Variable | Description | Example Value |
|---|---|---|
| `PORT` | HTTP Server port | `3000` |
| `NODE_ENV` | Environment mode | `production` or `development` |
| `JWT_SECRET` | Secret key for signing session tokens | `your_secure_random_key_here` |
| `JWT_EXPIRES_IN` | Token validity duration | `7d` |
| `DB_HOST` | Amazon RDS MySQL Endpoint or `localhost` | `expense-db.c123.us-east-1.rds.amazonaws.com` |
| `DB_PORT` | Database Port | `3306` |
| `DB_NAME` | Database Name | `cloud_expense_tracker` |
| `DB_USER` | Database Master Username | `admin` |
| `DB_PASSWORD` | Database Master Password | `YourSecureRDSPassword123` |
| `AWS_REGION` | AWS Region for S3 Bucket | `us-east-1` |
| `AWS_S3_BUCKET` | Dedicated Amazon S3 Bucket Name | `cloud-expense-receipts-2026` |
| `AWS_USE_IAM_ROLE` | Set to `true` when using EC2 IAM Role | `true` (or `false` for local testing) |
| `AWS_ACCESS_KEY_ID` | Optional IAM User access key (local only) | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Optional IAM User secret key (local only) | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `ENABLE_LOCAL_STORAGE_FALLBACK`| Fallback to local storage if S3 unconfigured | `false` (in production) |

---

## 12. Cloud Computing Lab Practical Mapping

This project maps directly to the syllabus of the **Cloud Computing Laboratory (24CS01TP0503)**:

| Lab Practical | Syllabus Experiment Aim | Implementation in Project |
|---|---|---|
| **Exp 1 & 2** | EC2 VM provisioning in public subnet with public IP | Node.js Express server hosted on EC2 Amazon Linux 2023 with attached Elastic IP. |
| **Exp 3** | Backup & recovery using EBS Snapshots | EBS volume snapshots taken before deployments to enable point-in-time VM recovery. |
| **Exp 4** | S3 object storage & browser retrieval | Receipts stored in S3; accessed via cryptographically signed Presigned URLs. |
| **Exp 5** | S3 Versioning & accidental file deletion recovery | S3 versioning enabled; API `/api/transactions/:id/receipt-versions` inspects object versions and demonstrates Delete Marker recovery. |
| **Exp 6** | Static website hosting with S3 & Route 53 | Frontend SPA architecture ready for S3 static website hosting fronted by Route 53. |
| **Exp 8** | Custom VPC with public/private subnets & IGW | Complete network segregation: Web on public subnet, RDS database on private subnet. |
| **Exp 9 & 10** | Load Balancing & Auto Scaling | Stateless backend architecture prepared for Application Load Balancer and Auto Scaling Groups. |
| **Exp 11** | Amazon RDS MySQL Database | Persistent transaction metadata managed by Amazon RDS MySQL connected via EC2. |
| **Exp 12** | Cloud Security: IAM, Firewalls & Encryption | IAM instance profile (least privilege), Security Group chaining, bcrypt hashing, and S3 SSE. |

---

## 13. REST API Documentation

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token | No |
| `GET` | `/api/auth/profile` | Get current user profile | Yes |
| `GET` | `/api/dashboard/summary` | Get financial summary metrics | Yes |
| `GET` | `/api/dashboard/category-summary` | Get category spending breakdown | Yes |
| `GET` | `/api/dashboard/monthly-summary` | Get 6-month income vs expense cashflow | Yes |
| `GET` | `/api/transactions` | List transactions with filters | Yes |
| `POST` | `/api/transactions` | Create transaction & upload S3 receipt | Yes |
| `GET` | `/api/transactions/:id` | Get single transaction details | Yes |
| `PUT` | `/api/transactions/:id` | Update transaction & replace S3 receipt | Yes |
| `DELETE`| `/api/transactions/:id` | Delete transaction & delete S3 receipt | Yes |
| `GET` | `/api/transactions/:id/receipt-versions` | List historical S3 versions of a receipt | Yes |
| `GET` | `/api/cloud/status` | Real-time cloud infrastructure diagnostics | No |

---

## 14. Viva Examination Preparation

A comprehensive list of 20 faculty viva questions with technically precise answers is provided in [docs/viva-questions.md](file:///c:/Users/Kanchan/Documents/antigravity/wonderful-kepler/docs/viva-questions.md).

---

## 15. Authors & Acknowledgments
- **Project Name:** Cloud-Based Expense Tracker
- **Department:** Computer Science & Engineering (B.Tech CSE)
- **Course:** Cloud Computing Lab (24CS01TP0503)
- **Institution:** Ramdeobaba University, Nagpur
