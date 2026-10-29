# AWS Cloud Deployment Guide: Cloud-Based Expense Tracker

This guide provides step-by-step instructions to deploy the **Cloud-Based Expense Tracker** on Amazon Web Services (AWS) from scratch. It is designed for students and faculty evaluating the **B.Tech CSE Cloud Computing Lab**.

---

## Prerequisites
- An active AWS Account (AWS Free Tier eligible).
- Basic understanding of the AWS Management Console.
- SSH client (Terminal on macOS/Linux or PowerShell/PuTTY on Windows).

---

## Step 1: Create AWS Virtual Private Cloud (VPC)
*(Lab Practical 8: Amazon VPC)*

1. Navigate to the **VPC Console** in the `us-east-1` (N. Virginia) region.
2. Click **Create VPC**.
3. Select **VPC only**.
4. Configure settings:
   - **Name tag:** `cloud-lab-vpc`
   - **IPv4 CIDR block:** `10.0.0.0/16`
5. Click **Create VPC**.
6. Select your created VPC, click **Actions** > **Edit VPC settings**, check **Enable DNS hostnames**, and click **Save changes**.

---

## Step 2: Create Subnets, Internet Gateway & Route Tables

### A. Create Internet Gateway
1. In the VPC Console, click **Internet Gateways** > **Create internet gateway**.
2. Name tag: `cloud-lab-igw`.
3. Click **Create internet gateway**.
4. Select `cloud-lab-igw`, click **Actions** > **Attach to VPC**, choose `cloud-lab-vpc`, and click **Attach**.

### B. Create Subnets
1. In VPC Console, go to **Subnets** > **Create subnet**.
2. Select VPC: `cloud-lab-vpc`.
3. Create **Subnet 1 (Public Subnet for EC2)**:
   - **Subnet name:** `public-subnet-1a`
   - **Availability Zone:** `us-east-1a`
   - **IPv4 CIDR block:** `10.0.1.0/24`
4. Click **Add new subnet** to create **Subnet 2 (Private Subnet for RDS)**:
   - **Subnet name:** `private-subnet-1a`
   - **Availability Zone:** `us-east-1a`
   - **IPv4 CIDR block:** `10.0.2.0/24`
5. Click **Add new subnet** to create **Subnet 3 (Private Subnet 2 for RDS Multi-AZ / Subnet Group)**:
   - **Subnet name:** `private-subnet-1b`
   - **Availability Zone:** `us-east-1b`
   - **IPv4 CIDR block:** `10.0.3.0/24`
6. Click **Create subnet**.

### C. Configure Public Route Table
1. Go to **Route Tables** > **Create route table**.
2. Name: `public-route-table`, VPC: `cloud-lab-vpc`. Click **Create**.
3. Select `public-route-table`, open the **Routes** tab, and click **Edit routes**.
4. Click **Add route**:
   - **Destination:** `0.0.0.0/0`
   - **Target:** Select `Internet Gateway` and choose `cloud-lab-igw`.
5. Click **Save changes**.
6. Open **Subnet associations** tab > **Edit subnet associations**, select `public-subnet-1a`, and click **Save associations**.
7. In the **Subnets** menu, select `public-subnet-1a`, click **Actions** > **Edit subnet settings**, check **Enable auto-assign public IPv4 address**, and click **Save**.

---

## Step 3: Create Security Groups (Firewall Rules)
*(Lab Practical 12: Cloud Security & Firewalls)*

### A. EC2 Security Group (`ec2-web-sg`)
1. In the VPC Console, click **Security Groups** > **Create security group**.
2. **Security group name:** `ec2-web-sg`.
3. **Description:** Security group for Expense Tracker web server.
4. **VPC:** Select `cloud-lab-vpc`.
5. **Inbound rules:**
   - **Type:** HTTP (Port 80) | **Source:** Anywhere-IPv4 (`0.0.0.0/0`)
   - **Type:** Custom TCP (Port 3000) | **Source:** Anywhere-IPv4 (`0.0.0.0/0`)
   - **Type:** SSH (Port 22) | **Source:** My IP (or `0.0.0.0/0` for testing)
6. Click **Create security group**.

### B. RDS Security Group (`rds-mysql-sg`)
1. Click **Create security group**.
2. **Security group name:** `rds-mysql-sg`.
3. **Description:** Security group for RDS MySQL database.
4. **VPC:** Select `cloud-lab-vpc`.
5. **Inbound rules:**
   - **Type:** MYSQL/Aurora (Port 3306)
   - **Source:** Select **Custom** and search for `ec2-web-sg` (allows traffic *only* from the EC2 instance).
6. Click **Create security group**.

---

## Step 4: Create Amazon RDS MySQL Database
*(Lab Practical 11: Relational Database Service & EC2 Connection)*

### A. Create DB Subnet Group
1. Open the **RDS Console** > **Subnet groups** > **Create DB subnet group**.
2. **Name:** `expense-tracker-db-subnet-group`.
3. **VPC:** Select `cloud-lab-vpc`.
4. Under **Add subnets**, select Availability Zones `us-east-1a` and `us-east-1b`, and choose subnets `10.0.2.0/24` and `10.0.3.0/24`.
5. Click **Create**.

### B. Launch RDS Instance
1. In the RDS Console, click **Databases** > **Create database**.
2. Choose **Standard create**.
3. **Engine type:** `MySQL` (Version: `MySQL 8.0.x`).
4. **Templates:** `Free Tier`.
5. **Settings:**
   - **DB instance identifier:** `expense-tracker-db`
   - **Master username:** `admin`
   - **Master password:** `CloudLabPass2026!` (Save this securely)
6. **Instance configuration:** `db.t3.micro` or `db.t4g.micro`.
7. **Storage:** 20 GiB gp2/gp3.
8. **Connectivity:**
   - **Virtual private cloud (VPC):** `cloud-lab-vpc`
   - **DB Subnet group:** `expense-tracker-db-subnet-group`
   - **Public access:** `No` (Restricted to private subnet)
   - **Existing VPC security groups:** Remove `default`, select `rds-mysql-sg`.
9. **Additional configuration:**
   - **Initial database name:** `cloud_expense_tracker`
10. Click **Create database** (Takes 5–10 minutes to provision).
11. Once **Available**, copy the **Endpoint** URL (e.g., `expense-tracker-db.c123456789.us-east-1.rds.amazonaws.com`).

---

## Step 5: Create Amazon S3 Bucket for Receipts
*(Lab Practical 4: S3 Storage & Browser Access)*

1. Navigate to the **S3 Console** > click **Create bucket**.
2. **Bucket name:** `cloud-expense-receipts-<your-rollnumber-or-name>` (Must be globally unique).
3. **AWS Region:** `us-east-1`.
4. **Object Ownership:** ACLs disabled (recommended).
5. **Block Public Access:** Keep all checkboxes checked (Secure default; the app generates presigned signed URLs for viewing).
6. **Bucket Encryption:** Server-side encryption with Amazon S3 managed keys (SSE-S3).

---

## Step 6: Enable S3 Versioning
*(Lab Practical 5: S3 Versioning & Accidental Deletion Recovery)*

1. In the **Create bucket** screen (or under the **Properties** tab of an existing bucket):
2. Under **Bucket Versioning**, select **Enable**.
3. Click **Create bucket**.

---

## Step 7: Create IAM Role for EC2
*(Lab Practical 12: IAM Least Privilege)*

1. Navigate to the **IAM Console** > **Roles** > **Create role**.
2. **Trusted entity type:** Select **AWS service**.
3. **Use case:** Select **EC2** > Click **Next**.
4. In Permissions policies, click **Create policy** (opens in a new tab):
   - Switch to **JSON** editor and paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ExpenseTrackerS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:ListBucketVersions"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```
   *(Replace `YOUR-BUCKET-NAME` with your actual bucket name).*
5. Name policy: `ExpenseTrackerS3Policy` > click **Create policy**.
6. Return to the Role creation tab, refresh policies, search for `ExpenseTrackerS3Policy`, and check it.
7. Role name: `EC2-ExpenseTracker-Role` > Click **Create role**.

---

## Step 8: Launch Amazon EC2 Instance
*(Lab Practical 2: EC2 Instance in Public Subnet)*

1. Navigate to the **EC2 Console** > click **Launch instance**.
2. **Name:** `expense-tracker-server`.
3. **Application and OS Images:** **Amazon Linux 2023 AMI** (Free tier eligible).
4. **Instance type:** `t2.micro` (or `t3.micro`).
5. **Key pair:** Select or create a key pair (e.g., `cloud-lab-key.pem`).
6. **Network settings:** Click **Edit**:
   - **VPC:** `cloud-lab-vpc`.
   - **Subnet:** `public-subnet-1a`.
   - **Auto-assign public IP:** `Enable`.
   - **Firewall (security groups):** Select existing security group `ec2-web-sg`.
7. **Advanced details:**
   - **IAM instance profile:** Select `EC2-ExpenseTracker-Role`.
8. Click **Launch instance**.
9. Once running, copy the **Public IPv4 address** (e.g., `54.210.120.45`).

---

## Step 9: Connect via SSH & Install Dependencies
*(Lab Practical 1: Connecting to VMs)*

Open your terminal and run:

```bash
chmod 400 cloud-lab-key.pem
ssh -i "cloud-lab-key.pem" ec2-user@YOUR_EC2_PUBLIC_IP
```

Inside the EC2 instance, install Node.js 20/22, npm, and Git:

```bash
# Update system packages
sudo dnf update -y

# Install Node.js 20 and Git
sudo dnf install -y nodejs git

# Verify installations
node -v
npm -v
git --version

# Install PM2 process manager for continuous background execution
sudo npm install -g pm2
```

---

## Step 10: Clone Project & Configure Environment

```bash
# Clone the repository
git clone https://github.com/your-username/cloud-expense-tracker.git
cd cloud-expense-tracker

# Install dependencies
npm install

# Create production .env file
cp .env.example .env
nano .env
```

Set the `.env` values:

```env
PORT=3000
NODE_ENV=production

JWT_SECRET=super_secret_production_key_for_btech_cse_lab_2026
JWT_EXPIRES_IN=7d

# Amazon RDS MySQL Endpoint (from Step 4)
DB_HOST=expense-tracker-db.c123456789.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_NAME=cloud_expense_tracker
DB_USER=admin
DB_PASSWORD=CloudLabPass2026!

# Amazon S3 Configuration (from Step 5)
AWS_REGION=us-east-1
AWS_S3_BUCKET=cloud-expense-receipts-your-rollnumber
AWS_USE_IAM_ROLE=true
ENABLE_LOCAL_STORAGE_FALLBACK=false
```

*(Press `CTRL + O`, `ENTER`, and `CTRL + X` to save and exit nano).*

---

## Step 11: Initialize Database Schema

Optionally seed initial schema using the MySQL client on EC2:

```bash
sudo dnf install -y mariadb105

# Connect to RDS from EC2 and execute schema.sql
mysql -h YOUR_RDS_ENDPOINT -u admin -p cloud_expense_tracker < database/schema.sql
```

*(Note: The application also auto-creates the required tables upon first start if they do not exist).*

---

## Step 12: Start the Application with PM2

```bash
# Start server using PM2
pm2 start backend/server.js --name "expense-tracker"

# Configure PM2 to restart automatically on system reboot
pm2 startup
pm2 save
```

Verify status:
```bash
pm2 status
pm2 logs expense-tracker
```

---

## Step 13: Access the Web Application

In your browser, visit:
```
http://YOUR_EC2_PUBLIC_IP:3000
```

1. Click **Register** or use the demo login.
2. Add a new expense (e.g., Food, ₹250) and attach a receipt file.
3. Check the **Dashboard** and **Transactions** pages.
4. Click **Cloud Lab Info** to view the live status of EC2, RDS, and S3.

---

## Step 14: Demonstration of S3 Versioning & Recovery
*(Lab Practical 5 Viva Task)*

1. Navigate to **Transactions** in the web app.
2. Click **Edit** on your transaction and upload a different receipt image.
3. Click the **Versions** button next to the receipt.
4. Notice that S3 has maintained **Version #1** and **Version #2** with unique `VersionId`s and timestamps.
5. In the AWS S3 Console > Bucket > Toggle **Show versions** to show the external examiner the physical version records stored in AWS!
