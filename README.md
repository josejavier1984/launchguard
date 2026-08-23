@'
# LaunchGuard

LaunchGuard is an AI-assisted DomainOps safety layer that helps developers, solopreneurs, and small teams plan, deploy, verify, and roll back domain and DNS changes safely.

## Core idea

Instead of editing DNS records manually, users describe what they want to accomplish in natural language.

LaunchGuard will:

1. Inspect the current domain configuration.
2. Interpret the user's deployment intent.
3. Generate a proposed DNS change plan.
4. Validate the plan for risky or destructive changes.
5. Create a snapshot of the current DNS state.
6. Apply approved changes through the Name.com CORE API.
7. Verify the resulting configuration.
8. Allow the user to roll back to a previous snapshot.

## Hackathon MVP

The initial MVP focuses on the following workflow:

Domain Search → Sandbox Registration → DNS Inspection → AI Plan → Validation → Snapshot → Deployment → Verification → Rollback

## Technology

- Python 3.12
- Flask
- SQLite
- HTML / CSS / JavaScript
- Name.com CORE API
- Name.com Sandbox
- Gemini API

## Project status

LaunchGuard is currently under active development for the API + Cloud + AI Hackathon 2026.

## Security

Real credentials and API tokens are stored in a local `.env` file and are never committed to the repository.

See `.env.example` for the required environment variables.
'@ | Set-Content -Encoding utf8 README.md