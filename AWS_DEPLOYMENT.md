# AWS Production Deployment Guide: SupportDesk

This guide explains how **SupportDesk** is deployed to Amazon Web Services (AWS) using industry-standard enterprise architecture.

---

## 1. High-Level AWS Architecture

```
                      [ Client Web Browsers ]
                                 │
                                 ▼
                     [ Amazon CloudFront (CDN) ]
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
        Static Assets (/index.html)        API Requests (/api/*)
                 │                               │
                 ▼                               ▼
       [ Amazon S3 Bucket ]          [ Application Load Balancer ]
                                                 │
                                                 ▼
                                     [ AWS ECS / Fargate Tasks ]
                                      (FastAPI Python Backend)
                                                 │
                                                 ▼ (Private Subnet)
                                     [ Amazon RDS PostgreSQL ]
```

---

## 2. Component-by-Component Deployment

### Component A: Amazon RDS (PostgreSQL Database)
1. **Create Subnet Group**:
   - Create a DB Subnet Group across at least two Availability Zones (AZs) in private subnets.
2. **Launch RDS Instance**:
   - Engine: PostgreSQL (version 15+).
   - DB Instance Class: `db.t4g.micro` (Free-tier eligible) or `db.t4g.small`.
   - Settings:
     - Master Username: `supportdesk_admin`
     - Master Password: Stored securely in **AWS Secrets Manager**.
     - Initial Database Name: `supportdesk_db`.
3. **Security Group**:
   - Attach a security group (`sg-rds-postgres`) that permits inbound traffic on port `5432` **only** from the Backend ECS Security Group (`sg-ecs-backend`). Never allow `0.0.0.0/0`.

---

### Component B: Backend Deployment (FastAPI on AWS ECS Fargate)
1. **Push Container Image to Amazon ECR**:
   ```bash
   # 1. Authenticate Docker with Amazon ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

   # 2. Tag backend container
   docker build -t supportdesk-backend ./backend
   docker tag supportdesk-backend:latest <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/supportdesk-backend:latest

   # 3. Push to ECR repository
   docker push <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/supportdesk-backend:latest
   ```

2. **Configure ECS Task Definition**:
   - Launch type: `FARGATE`.
   - CPU: 0.5 vCPU (512 MB).
   - Container Port: `8000`.
   - Environment Variables / Secrets:
     - `DATABASE_URL`: Injected from AWS Secrets Manager:
       `postgresql://supportdesk_admin:PASSWORD@rds-endpoint.amazonaws.com:5432/supportdesk_db`
     - `CORS_ORIGINS`: `["https://supportdesk.yourcompany.com", "https://d12345abcdef.cloudfront.net"]`
     - `SLA_HOURS_CRITICAL`: `2`
     - `SLA_HOURS_HIGH`: `4`
     - `SLA_HOURS_MEDIUM`: `8`
     - `SLA_HOURS_LOW`: `24`

3. **Application Load Balancer (ALB)**:
   - Create an internet-facing ALB in public subnets with an HTTPS listener (via AWS Certificate Manager).
   - Target Group: Targets the ECS Fargate tasks on port 8000 with health check path `/`.

---

### Component C: Frontend Deployment (Amazon S3 + CloudFront)
1. **Build Frontend**:
   ```bash
   cd frontend
   npm install
   npm run build
   # Outputs optimized production assets into /dist
   ```
2. **Create and Sync S3 Bucket**:
   ```bash
   aws s3 mb s3://supportdesk-web-assets-prod
   aws s3 sync dist/ s3://supportdesk-web-assets-prod --delete
   ```
3. **CloudFront Distribution**:
   - Origin 1 (Default `/*`): Points to S3 Bucket via Origin Access Control (OAC).
   - Origin 2 (`/api/*`): Points to the Application Load Balancer DNS name.
   - Custom Error Response: Map HTTP 403 & 404 to `/index.html` with HTTP 200 (for Single Page Application client-side routing).

---

## 3. Network Security & Firewall Rules

| Resource | Inbound Allowed From | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **CloudFront** | Global (`0.0.0.0/0`) | `443` | Public end-user access |
| **ALB Security Group** | CloudFront IPs (or Public 443) | `443` | Forward API requests to ECS |
| **ECS Security Group** | ALB Security Group | `8000` | Backend application execution |
| **RDS Security Group** | ECS Security Group | `5432` | PostgreSQL database queries |

---

## 4. Key Talking Points for Technical Interviews

When asked in an interview: *"How does this system work end-to-end and how is it deployed to AWS?"*

1. **Client Layer**: The user visits the domain. CloudFront delivers the React static bundle from Amazon S3 at edge locations with low latency.
2. **API Communication**: All dynamic operations (`/api/v1/tickets`, `/api/v1/dashboard/stats`, etc.) route through CloudFront to the Application Load Balancer and down to FastAPI instances running in ECS Fargate tasks.
3. **Database Integrity**: FastAPI uses SQLAlchemy with connection pooling to talk to PostgreSQL on Amazon RDS. The database is housed inside a private subnet inaccessible to the public internet for strict ITIL security.
4. **Environment Isolation**: Database credentials, SLA thresholds, and CORS policies are injected at runtime via environment variables and AWS Secrets Manager, ensuring zero hardcoded secrets.
