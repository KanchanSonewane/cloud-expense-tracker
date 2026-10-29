# Cloud Computing Lab: Comprehensive Viva Questions & Answers

This document prepares students for the final laboratory evaluation and oral viva for **Cloud Computing Lab (Course Code: 24CS01TP0503)**.

---

### Q1. Why did you use Amazon RDS instead of installing MySQL directly inside the EC2 instance?
**Answer:**
1. **Separation of Concerns:** Decoupling compute (EC2) from database storage ensures that if the EC2 instance crashes or needs to be scaled horizontally, the database state remains intact and unaffected.
2. **Automated Management:** Amazon RDS provides managed automated backups, point-in-time recovery, automated software patching, and health monitoring.
3. **High Availability & Scalability:** RDS easily supports Multi-AZ (Availability Zone) synchronous replication for failover and Read Replicas for scaling read operations, which is cumbersome to configure manually on self-hosted MySQL.

---

### Q2. Why did you use Amazon S3 for receipts instead of saving images as BLOBs in the MySQL database?
**Answer:**
1. **Database Performance Degradation:** Storing large binary files (JPG, PNG, PDF) bloats database tables, fills the InnoDB buffer pool with non-queryable data, degrades index lookup speeds, and makes database backups significantly slower and larger.
2. **Cost & Scalability:** Relational database storage (EBS gp2/gp3) is more expensive per gigabyte than object storage. Amazon S3 is purpose-built to store virtually unlimited unstructured objects with 99.999999999% (11 9's) durability at a fraction of the cost.
3. **Direct Secure Offloading:** S3 can serve objects directly to users via Presigned URLs, reducing bandwidth and CPU overhead on both the database and the EC2 web server.

---

### Q3. How does Amazon S3 Versioning work, and how does it recover accidentally deleted files? (Lab Experiment 5)
**Answer:**
- When S3 Versioning is enabled on a bucket, every `PUT` operation on an existing object key does not overwrite the file; instead, S3 assigns a unique alphanumeric `VersionId` to the new version and retains all previous versions.
- **Accidental Deletion Recovery:** If an object is deleted without specifying a version ID, Amazon S3 does not permanently destroy the file; it places a **Delete Marker** with its own `VersionId` as the current version. The file appears deleted to normal requests, but deleting the Delete Marker permanently restores the original file.

---

### Q4. What is an IAM Role, and why is it preferred over embedding IAM User Access Keys in `.env`? (Lab Experiment 12)
**Answer:**
- An **IAM Role** is an identity with permission policies that can be assumed by AWS resources (such as an EC2 instance) using an **Instance Profile**.
- **Security Best Practice (Least Privilege):** Hardcoding `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in code or `.env` files risks credential leakage if the code is pushed to Git or compromised.
- With an IAM Role attached to the EC2 instance, the AWS SDK automatically fetches temporary, rotating credentials via the **Instance Metadata Service (IMDSv2)**. No secret keys ever exist on the disk.

---

### Q5. How is the Amazon RDS database protected from public internet attacks in your VPC? (Lab Experiment 8)
**Answer:**
1. **Private Subnet Placement:** The RDS database is deployed in a private subnet with `Publicly Accessible = False`. It does not have a public IPv4 address and has no direct route to the Internet Gateway.
2. **Security Group Referencing:** The RDS Security Group (`rds-mysql-sg`) allows inbound TCP traffic on port 3306 **only** from the EC2 Security Group (`ec2-web-sg`). Even from within the VPC, only the authorized EC2 instance can initiate connections to the database.

---

### Q6. What is the difference between a Security Group and a Network Access Control List (NACL)?
**Answer:**
| Feature | Security Group (SG) | Network ACL (NACL) |
|---|---|---|
| **Level** | Operates at the **Instance** level (Virtual NIC) | Operates at the **Subnet** level |
| **State** | **Stateful** (Return traffic is automatically allowed) | **Stateless** (Inbound & Outbound rules required) |
| **Rules** | Supports **Allow** rules only | Supports both **Allow** and **Deny** rules |
| **Evaluation** | All rules evaluated before decision | Rules evaluated in strict numerical order |

---

### Q7. What is an S3 Presigned URL, and why is it better than making the S3 bucket public?
**Answer:**
- An S3 Presigned URL is a cryptographically signed URL generated using AWS credentials that gives temporary read (or write) access to a specific private S3 object.
- It includes security query parameters: `X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-Date`, `X-Amz-Expires`, and `X-Amz-Signature`.
- **Advantage:** The bucket remains completely private to the world. Only authenticated users authorized by our backend receive a time-limited signed URL (e.g., valid for 60 minutes). Once expired, the URL cannot be used.

---

### Q8. How does the application protect against SQL Injection?
**Answer:**
- By using **Parameterized Queries** (Prepared Statements) provided by the `mysql2/promise` library.
- Placeholders (`?`) ensure that user inputs are treated strictly as data literals and never parsed or executed as executable SQL syntax:
  ```javascript
  await db.query('SELECT * FROM users WHERE email = ?', [email]);
  ```

---

### Q9. How are passwords stored securely in the database?
**Answer:**
- Passwords are never stored in plaintext.
- The application uses **bcrypt** with a salt work factor of 10 (`bcrypt.genSalt(10)`).
- bcrypt utilizes adaptive hashing and cryptographic salting, making it resilient against precomputed rainbow table attacks and GPU-accelerated brute force.

---

### Q10. What is an Internet Gateway (IGW) and how does routing work in your VPC?
**Answer:**
- An **Internet Gateway** is a horizontally scaled, redundant VPC component that enables communication between VPC instances and the public internet. It performs network address translation (1:1 NAT) between the instance's private IP and its public IPv4.
- In the public route table, a default route entry:
  - **Destination:** `0.0.0.0/0`
  - **Target:** `igw-xxxxxxxx` (the attached Internet Gateway)
  directs all non-local internet traffic through the IGW.

---

### Q11. What is the difference between Amazon EBS and Amazon S3? (Lab Experiments 1, 3, 4)
**Answer:**
- **Amazon EBS (Elastic Block Store):**
  - High-performance **block-level storage** designed to be attached to a single EC2 instance like a physical hard disk.
  - Used for the root filesystem, operating system, and application binaries.
  - Formatted with filesystems like ext4 or XFS.
- **Amazon S3 (Simple Storage Service):**
  - **Object storage** accessed over HTTP/HTTPS via REST API or SDK.
  - Scalable to exabytes; stores flat objects with keys, metadata, and versioning.
  - Accessible globally without being mounted to a specific VM.

---

### Q12. How do EBS Snapshots work for backup and disaster recovery? (Lab Experiment 3)
**Answer:**
- An EBS Snapshot is a point-in-time, incremental backup of an EBS volume stored durably in Amazon S3.
- **Incremental Nature:** Only blocks that have changed since the previous snapshot are saved, optimizing storage costs.
- **Restoration:** If an EBS volume is corrupted or deleted, a new identical volume can be recreated in minutes from the snapshot and attached to any EC2 instance in the same Availability Zone.

---

### Q13. How would you scale this application horizontally if user traffic spikes? (Lab Experiments 9 & 10)
**Answer:**
1. **Application Load Balancer (ALB):** Place an ALB in the public subnet across multiple Availability Zones to distribute incoming HTTP requests evenly.
2. **Auto Scaling Group (ASG):** Define an ASG with Launch Templates. Configure target tracking scaling policies (e.g., maintain average CPU utilization at 60%).
3. **Stateless Compute:** Because session state is carried via JWT tokens and receipts are in S3, any EC2 instance can handle any user request seamlessly without sticky sessions.
4. **RDS Multi-AZ & Read Replicas:** Read replicas can offload dashboard analytical queries from the primary database.

---

### Q14. What is Amazon EFS and how does it differ from EBS and S3? (Lab Experiment 7)
**Answer:**
- **Amazon EFS (Elastic File System):** A managed **network file system (NFSv4)** that can be mounted simultaneously by hundreds of EC2 Linux instances across multiple Availability Zones for shared read/write access.
- In contrast, a standard EBS volume can only attach to one EC2 instance at a time (block storage), while S3 is object storage accessed via REST API.

---

### Q15. How would you host the frontend statically on S3 and Route 53? (Lab Experiment 6)
**Answer:**
1. **S3 Static Website Hosting:** Configure an S3 bucket with static website hosting enabled, specifying `index.html` as the index document.
2. **Amazon Route 53:** Create a Public Hosted Zone for the custom domain and add an **Alias A record** pointing directly to the S3 website endpoint (or Amazon CloudFront distribution for CDN caching and SSL).
3. The frontend JavaScript then calls the backend API hosted on EC2 via CORS.

---

### Q16. What happens if the EC2 instance is terminated? Is any expense or receipt data lost?
**Answer:**
- **Zero data loss:**
  - All user profiles and transaction metadata persist securely in **Amazon RDS MySQL**.
  - All uploaded receipts and document files reside permanently in **Amazon S3**.
- A new EC2 instance can be launched from an AMI or git clone, configured with the same `.env` RDS endpoint and S3 bucket name, and immediately resume serving all user data.

---

### Q17. What are the key Cloud Computing characteristics demonstrated by this project according to NIST?
**Answer:**
1. **On-Demand Self-Service:** Instantly provisioning compute (EC2), database (RDS), and storage (S3) without human intervention from AWS.
2. **Broad Network Access:** Accessing the expense tracker from anywhere over standard web protocols (HTTP/HTTPS).
3. **Resource Pooling:** Leveraging multi-tenant AWS cloud hardware partitioned safely via virtualization and hypervisors (Nitro/Xen).
4. **Rapid Elasticity:** Automatically scaling storage and compute on demand.
5. **Measured Service:** Paying only for actual compute hours, database hours, and gigabytes stored in S3.
