# LaunchGuard

**AI-assisted DomainOps with safe deployment, verification, and rollback.**

LaunchGuard helps developers, solopreneurs, and small teams make domain and DNS changes with fewer deployment mistakes.

Instead of manually editing DNS records and hoping the configuration is correct, users describe what they want to accomplish in natural language. LaunchGuard turns that intent into a validated DNS plan, requires human approval, snapshots the current state, deploys through the Name.com CORE API, verifies the result, and provides one-click rollback.

🌐 **Live Demo:** https://launchguard.jjgarrido.com

---

## The Problem

DNS changes are powerful but unforgiving.

A single incorrect A record, conflicting CNAME, bad target, or accidental replacement can break a website, email service, API endpoint, or production launch.

Small teams and independent developers often make these changes manually without:

- pre-deployment validation
- configuration snapshots
- automated verification
- simple rollback
- AI-assisted planning

LaunchGuard adds a safety layer between human intent and DNS infrastructure.

---

## How LaunchGuard Works

```text
Domain Discovery
      ↓
Availability Check
      ↓
Sandbox Registration
      ↓
Natural-Language Intent
      ↓
Gemini AI DNS Plan
      ↓
Safety Validation
      ↓
Human Approval
      ↓
DNS Snapshot
      ↓
Safe Deployment
      ↓
Verification
      ↓
Rollback if needed
      ↓
Final Verification
```

The user remains in control: AI proposes the change, but LaunchGuard will not deploy it until the user explicitly approves the validated plan.

---

## Name.com CORE API Integration

LaunchGuard uses the **Name.com CORE API** throughout the complete domain lifecycle.

### Domain Discovery

Checks whether a requested domain is available and displays:

- registration availability
- registration price
- renewal price
- premium-domain status

### Sandbox Registration

Users can register available domains directly through the Name.com Sandbox from the LaunchGuard interface.

Registration requires explicit user confirmation and is restricted server-side to the Name.com Sandbox environment.

### DNS Inspection

LaunchGuard reads the domain's current DNS configuration before deployment.

### DNS Management

Approved plans can create DNS records through the Name.com CORE API.

LaunchGuard also uses DNS deletion and recreation capabilities during rollback.

### Verification

After deployment, LaunchGuard reads the DNS state again and confirms that the expected records actually exist.

### Rollback

LaunchGuard compares the current DNS state with the pre-deployment snapshot, removes unexpected records, recreates missing records, and verifies that the original configuration has been restored.

---

## AI-Assisted DNS Planning

LaunchGuard uses **Google Gemini** to translate natural-language deployment intent into structured DNS changes.

Example:

> Add a TXT record at host qa with value launchguard-production-check and TTL 300.

Gemini produces a structured plan containing:

- DNS record type
- host
- answer/value
- TTL
- priority when applicable
- risk level
- explanation of the proposed change

The AI output is not deployed directly.

Every plan must pass LaunchGuard's deterministic safety validator before the human approval step becomes available.

---

## Safety Controls

LaunchGuard is designed around the principle:

> **AI can propose infrastructure changes. It should not silently execute them.**

Current safeguards include:

- human approval before deployment
- DNS type allowlist
- IPv4 validation for A records
- IPv6 validation for AAAA records
- TTL validation
- hostname validation
- MX priority validation
- duplicate-record detection
- CNAME conflict detection
- current DNS state inspection
- prevention of CNAME coexistence conflicts
- pre-deployment snapshots
- post-deployment verification
- verified rollback
- sandbox-only domain registration
- credentials stored outside source control
- sanitized production error responses

---

## Snapshot and Rollback Engine

Before any DNS deployment, LaunchGuard stores the current DNS configuration in SQLite.

If something goes wrong, the user can restore that snapshot.

The rollback engine:

1. Reads the snapshot.
2. Reads the current Name.com DNS state.
3. Compares both configurations.
4. Removes records that should not exist.
5. Restores records that are missing.
6. Reads the DNS state again.
7. Verifies that rollback succeeded.

Rollback is therefore not just a UI action — LaunchGuard independently verifies the restored state.

---

## Hackathon Demo Flow

The deployed MVP demonstrates the complete workflow:

```text
Search Domain
→ Check Availability
→ Register in Name.com Sandbox
→ Describe DNS Intent
→ Generate Gemini Plan
→ Validate
→ Human Approve
→ Snapshot
→ Deploy via Name.com
→ Verify
→ Roll Back
→ Verify Again
```

This workflow has been tested end-to-end against the live Name.com Sandbox API.

---

## Architecture

```text
Browser
   │
   ▼
CloudPanel / Nginx
   │
   ▼
Gunicorn
   │
   ▼
Flask / LaunchGuard
   │
   ├── Gemini Planner
   ├── DNS Safety Validator
   ├── Snapshot Store (SQLite)
   ├── Safe Deployment Engine
   ├── Verification Engine
   └── Rollback Engine
           │
           ▼
     Name.com CORE API
```

---

## Technology Stack

- Python 3.12
- Flask 3
- Gunicorn
- SQLite
- HTML
- CSS
- Vanilla JavaScript
- Google Gemini API
- Name.com CORE API
- Name.com Sandbox
- Nginx
- CloudPanel
- Ubuntu Linux
- Let's Encrypt

---

## Project Structure

```text
launchguard/
├── app/
│   ├── services/
│   │   ├── deploy.py
│   │   ├── namecom.py
│   │   ├── planner.py
│   │   ├── rollback.py
│   │   ├── snapshots.py
│   │   └── validator.py
│   ├── static/
│   ├── templates/
│   ├── __init__.py
│   └── routes.py
├── docs/
│   └── architecture.md
├── tests/
├── .env.example
├── requirements.txt
├── README.md
└── run.py
```

---

## Environment Variables

Create a `.env` file based on `.env.example`.

LaunchGuard requires credentials for:

- Name.com Sandbox
- Google Gemini API

Real credentials and API tokens must never be committed to the repository.

---

## Run Locally

Create and activate a Python virtual environment, then install dependencies:

```bash
pip install -r requirements.txt
```

Configure `.env`, then run:

```bash
python run.py
```

The development server will be available at:

```text
http://127.0.0.1:5000
```

---

## Production Deployment

The live hackathon deployment runs on Ubuntu with:

```text
Nginx → Gunicorn → Flask
```

Gunicorn listens only on localhost and is managed as a persistent systemd service.

HTTPS is provided through Let's Encrypt.

---

## Hackathon

Built for the **DevNetwork API + Cloud + AI Hackathon 2026**.

LaunchGuard was designed around three core goals:

### API Integration Depth

Use the Name.com CORE API across domain discovery, registration, DNS management, verification, and rollback.

### Creativity & Originality

Turn domain management into an AI-assisted, safety-first DomainOps workflow rather than another DNS editor.

### Technical Execution

Combine structured AI planning, deterministic validation, human approval, snapshots, verified deployment, and verified rollback into a working end-to-end application.

---

## Current Status

- ✅ Domain availability
- ✅ Sandbox registration
- ✅ DNS inspection
- ✅ Gemini structured planning
- ✅ Safety validation
- ✅ Human approval
- ✅ DNS snapshots
- ✅ Safe deployment
- ✅ Post-deployment verification
- ✅ Rollback engine
- ✅ Rollback verification
- ✅ Production HTTPS deployment

**LaunchGuard MVP is feature-frozen and ready for hackathon submission.**