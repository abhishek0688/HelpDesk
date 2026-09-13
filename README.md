# SupportDesk – Smart Technical Support and Incident Management Platform

A clean, full-stack IT service desk and incident management platform built with **React**, **FastAPI**, **SQLAlchemy**, and **PostgreSQL**.

Designed specifically for clarity and technical interview explainability, avoiding over-engineering while adhering to strict ITIL incident management standards.

---

## Architecture Overview

```
 [ React.js Frontend (Vite + Vanilla CSS) ]
                    │
                    ▼  (REST API calls via fetch)
 [ FastAPI Python Backend (Port 8000) ]
       │                │                │
       ▼                ▼                ▼
 [ SLA Service ]  [ RCA Engine ]  [ Duplicate Detector ]
       │                │                │
       └────────────────┴────────────────┘
                        │
                        ▼  (SQLAlchemy ORM + Alembic)
 [ PostgreSQL Database (Docker) / SQLite (Local Fallback) ]
```

---

## Key Features

1. **Sequential Ticket Code Generation**:
   - Auto-generates standard enterprise incident numbers (e.g. `INC-1001`, `INC-1002`).
2. **Duplicate Ticket Detection**:
   - Token & keyword similarity algorithm scans active/past tickets during creation to alert engineers of repeat issues and display previous solutions.
3. **Smart Troubleshooting Recommendations (Rule-based)**:
   - When a ticket category is selected (Network, Software, Hardware, OS, Access, Security), provides technical diagnostic recommendations that engineers can immediately execute.
4. **Manual Troubleshooting Logging**:
   - 14 default checklist actions + custom steps. Engineers manually record notes and actual outcomes: *Successful*, *Unsuccessful*, or *Inconclusive*.
5. **Real Troubleshooting Success Analytics**:
   - Computed directly from database records (`troubleshooting_steps` table). Measures times used, successful attempts, and percentage success rates.
6. **Root Cause Analysis (RCA) with Strict 100-Word Constraint**:
   - Includes a live frontend word counter and backend validator strictly enforcing the 100-word limit.
   - **Suggest RCA Button**: Heuristic engine analyzes symptoms, error messages, and troubleshooting outcomes to propose an actionable hypothesis that engineers can Accept, Edit, or Dismiss.
7. **Dynamic SLA Management**:
   - Critical: 2 hrs | High: 4 hrs | Medium: 8 hrs | Low: 24 hrs.
   - Calculates deadlines, remaining time countdowns, and dynamic states (*Within SLA*, *Near Breach*, *Breached*, *Completed*).
8. **L2 Escalation & Smart Escalation Recommendation**:
   - Rule-based detection flags unresolved tickets with multiple failed attempts or imminent SLA breaches with: `"Recommended Action: Escalate to L2"`.
   - Dedicated escalation handover records the reason, target L2 team, and technical notes.
9. **1-Click Knowledge Base Conversion**:
   - Once resolved, a single click converts the ticket's problem, root cause, steps, and solution into a published, searchable Knowledge Base article.
10. **Incident Audit Timeline**:
    - Immutable event logging of every lifecycle milestone (Ticket Created, Step Logged, RCA Added, Status Changed, Escalated, Resolved).

---

## Technology Stack

- **Frontend**: React 18, HTML5, Vanilla CSS3 (with Light/Dark theme custom properties), Vite.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2.
- **Database**: PostgreSQL 15, SQLAlchemy 2.0 ORM, Alembic migrations.
- **DevOps**: Docker, Multi-Stage Dockerfile, Docker Compose.
- **Cloud**: AWS Deployment architecture documented (S3, CloudFront, ECS Fargate, RDS PostgreSQL).

---

## Quick Start Guide

### Option 1: Quick Local Run (Zero-Setup SQLite Fallback)

This method lets you test immediately without installing or running a PostgreSQL server. The backend automatically uses SQLite fallback.

#### 1. Start the Backend
```bash
cd supportdesk/backend

# Create virtual environment (optional)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed sample demonstration data
python -m app.seed_data

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at: `http://localhost:8000`
Interactive Swagger Docs at: `http://localhost:8000/docs`

#### 2. Start the Frontend
In a new terminal:
```bash
cd supportdesk/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

### Option 2: Docker Compose (Full PostgreSQL Stack)

To run the complete production-grade multi-container stack with PostgreSQL:

```bash
cd supportdesk

# Start PostgreSQL, FastAPI backend, and Nginx frontend
docker compose up --build
```

Access:
- Frontend: `http://localhost`
- Backend API Docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## Running Automated Backend Tests

We have written an automated test suite verifying ticket code generation, SLA deadlines, 100-word RCA limits, duplicate detection, and troubleshooting analytics:

```bash
cd supportdesk/backend
python test_backend.py
```

Expected output:
```
..........
----------------------------------------------------------------------
Ran 10 tests in 0.37s

OK
```

---

## Folder Structure

```
supportdesk/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── schemas/           # Pydantic request/response schemas
│   │   ├── routes/            # REST API route handlers
│   │   ├── services/          # Pure Python business logic
│   │   ├── config.py          # App & SLA settings
│   │   ├── database.py        # Database connection & session
│   │   ├── seed_data.py       # Realistic demonstration seeder
│   │   └── main.py            # FastAPI entry point
│   ├── alembic/               # Database migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── test_backend.py
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI elements (Badges, Timeline, Modal)
│   │   ├── pages/             # Dashboard, TicketList, CreateTicket, Details, KB, Analytics
│   │   ├── services/          # api.js API client
│   │   ├── styles/            # Vanilla CSS Design System
│   │   ├── App.jsx            # Main app & view router
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml         # Multi-container orchestration
├── .env.example               # Environment variables template
├── AWS_DEPLOYMENT.md          # Complete AWS deployment guide
└── README.md
```

---

## Interview Guide: How to Explain this Project

When an interviewer asks you about this project, here is the structured explanation:

1. **Architecture Overview**:
   > *"I built SupportDesk as a 3-tier enterprise IT incident platform. The presentation layer is built in React using clean vanilla CSS and Vite. The business logic layer is built in Python using FastAPI for high-performance async REST endpoints and Pydantic for strict request validation. The persistence layer uses SQLAlchemy ORM connected to PostgreSQL."*

2. **How Troubleshooting Analytics Works**:
   > *"Rather than hardcoding success rates, every time an engineer performs a troubleshooting step, an entry is created in the `troubleshooting_steps` table with an outcome: Successful, Unsuccessful, or Inconclusive. The `/analytics/troubleshooting` endpoint aggregates this real data using SQL queries to determine the empirical success rate of each action."*

3. **How RCA Enforcement and Suggestions Work**:
   > *"In technical support, RCA descriptions should be concise. I enforced a strict 100-word maximum both on the frontend using a live WordCounter component and on the backend using Pydantic field validators. Furthermore, I built a rule-based suggestion engine that inspects symptoms, error messages, and completed troubleshooting steps to propose a root cause hypothesis, which can easily be replaced with an LLM in the future."*

4. **How AWS and Docker Work Together**:
   > *"The application is fully containerized using Docker Compose for local development. For AWS production, the React frontend is hosted on Amazon S3 and distributed globally through CloudFront. The FastAPI backend runs as an ECS Fargate container behind an Application Load Balancer, and the database runs on Amazon RDS PostgreSQL in private subnets with strict Security Group rules."*
