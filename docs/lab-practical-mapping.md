# Cloud Computing Lab (24CS01TP0503) — Practical Mapping

This matrix maps the **Cloud-Based Expense Tracker** implementation directly to the syllabus experiments prescribed by the Department of Computer Science & Engineering, Ramdeobaba University, Nagpur.

---

## Practical Mapping Matrix

| Exp No. | Syllabus Experiment Aim / Problem Statement | Project Implementation & Evidence | Course Outcome (CO) |
|---|---|---|---|
| **Exp 1** | Create Windows and Linux Virtual machines in AWS; perform steps to connect; mount additional disk (EBS volumes). | EC2 Linux instance launched using Amazon Linux 2023; connected via SSH (`ssh -i key.pem ec2-user@<IP>`); root EBS volume hosts the application runtime. | CO2 |
| **Exp 2** | Create a new EC2 instance on AWS to host a web application in a public subnet with a public IP address. | Application backend (Node.js/Express) and static frontend deployed on an EC2 instance launched inside `public-subnet-1a` (10.0.1.0/24) with an allocated Elastic/Public IPv4 and Internet Gateway. Accessible publicly over HTTP (port 3000/80). | CO2 |
| **Exp 3** | Backup and recovery of user data from EBS volumes using Snapshots. | Demonstrates disaster recovery by taking point-in-time EBS snapshots of the EC2 root and data volumes before application upgrades, and restoring a new volume from the snapshot. | CO2 |
| **Exp 4** | Create S3 storage in AWS, load files, and configure permissions to access files in browser. | Dedicated S3 bucket created for expense receipts. Users upload JPG, PNG, and PDF receipt documents via `/api/transactions` and access them in the browser via cryptographically generated S3 Presigned URLs. | CO2 |
| **Exp 5** | Implement versioning with S3 bucket to restore accidentally deleted files and keep different versions of the same object. | S3 Bucket Versioning is enabled. When receipts are replaced during transaction edits, S3 maintains historical `VersionId` records. The application includes a dedicated **S3 Version History** modal and API (`/api/transactions/:id/receipt-versions`) demonstrating version retrieval and Delete Marker recovery. | CO2 |
| **Exp 6** | Implement static website hosting using S3 bucket and Route 53 in AWS. | The `frontend/` folder is packaged as an independent static Single Page Application (SPA) ready to be hosted directly on an S3 static website bucket fronted by Route 53 DNS and CloudFront CDN. | CO2 |
| **Exp 7** | Shared storage through Amazon EFS (Elastic File System) across VMs. | Architectural design supports mounting an Amazon EFS volume across multiple EC2 application instances for shared temporary cache and logs across Availability Zones. | CO2 |
| **Exp 8** | Custom VPC with public and private subnets, Internet Gateway, and custom route tables. | Full VPC network isolation: `cloud-lab-vpc` (10.0.0.0/16) configured with `public-subnet-1a` (10.0.1.0/24) connected to `cloud-lab-igw`, and private subnets (`10.0.2.0/24`, `10.0.3.0/24`) housing the database tier. | CO3 |
| **Exp 9** | Load balancing functionality in AWS (Application Load Balancer across multi-AZ VMs). | Architecture provides production readiness for an Application Load Balancer (ALB) distributing traffic across multiple EC2 instances across `us-east-1a` and `us-east-1b`. | CO3 |
| **Exp 10** | Autoscaling service in AWS using Upscaling / Target Tracking. | Auto Scaling Group (ASG) design specified with Launch Templates and dynamic CloudWatch target-tracking metric alarms (e.g. CPU > 70%). | CO5 |
| **Exp 11** | Database service in AWS: Create relational database using RDS and connect using EC2 instance. | Amazon RDS for MySQL 8.0 created in private DB subnet group. The EC2 application server connects to RDS over port 3306 using connection pooling (`mysql2/promise`) and executes schema migrations. | CO4 |
| **Exp 12** | Cloud security mechanism: IAM, firewall rules (Security Groups), and data encryption. | **IAM:** EC2 Instance Profile with least-privilege IAM Policy for S3.<br>**Firewall:** Security Group chaining (`rds-mysql-sg` allows port 3306 *only* from `ec2-web-sg`).<br>**Encryption:** Passwords encrypted using bcrypt; S3 server-side encryption (SSE-S3); RDS encrypted storage. | CO3 |
