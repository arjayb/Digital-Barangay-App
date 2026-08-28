# Digital Barangay App — Frontend

A full-stack Digital Barangay resident, administrator, and credential-governance portal for Barangay San Isidro.

## Current release

**v1.1.0 — live in production**

**GitHub Pages:** https://kelbrictech.github.io/Digital-Barangay-App/

**Backend API:** https://digital-barangay-backend.onrender.com/

## What it does

### Residents

- Create a resident account
- Sign in securely with JWT authentication
- Submit barangay document requests
- Receive a backend-generated tracking number
- Track request decision history and rejection notes
- Confirm a document as claimed after it is marked ready for pickup
- Report non-emergency community concerns
- Track concern history and confirm a resolved concern as closed
- View barangay officials and published notices

### Barangay Administrators

- Protected staff login with stable `ADM-####` Staff IDs
- Live resident/request/concern metrics
- Review document requests through backend-authoritative status transitions
- Add decision notes; rejection reasons are required when rejecting a request
- Review community concerns through the approved response workflow
- Preserve auditable status history attributed to the acting administrator

### Webmaster

- Dedicated `WEB-0001` credential-governance role and portal
- Review pending administrator credential applications
- Approve or reject applications with review notes
- View administrators and their Staff IDs/account status
- Suspend and reactivate administrator access without deleting historical attribution
- Review credential-governance history

## Architecture

```text
Resident / Admin / Webmaster Browser
                |
                v
         GitHub Pages frontend
                |
                v
         Render Express API
                |
             Prisma ORM
                |
                v
          Neon PostgreSQL

File uploads -> Cloudinary
```

## Stack

- HTML / CSS / Vanilla JavaScript
- GitHub Pages
- Node.js + Express
- Prisma ORM
- PostgreSQL (Neon)
- JWT authentication
- bcrypt password hashing
- Cloudinary for uploaded files
- Render for the backend API

## Main pages

| Page | Purpose |
|---|---|
| `index.html` | Single authentication gateway for resident and staff access |
| `about.html` | About the application and architecture |
| `member-register.html` | Resident account registration |
| `member-dashboard.html` | Resident requests, concerns, tracking and confirmations |
| `admin-dashboard.html` | Protected barangay operations dashboard |
| `webmaster-dashboard.html` | Protected credential-governance dashboard |

## Authentication and governance

The backend uses one authentication system with three roles: `resident`, `admin`, and `webmaster`. The frontend routes each authenticated user to the appropriate portal, while protected pages re-check the session against the backend.

Operational authority and credential authority are intentionally separated: ordinary administrators process requests and concerns; the Webmaster governs administrator credentials and account lifecycle.

## Release history

- `v1.0.0` — first accepted full-stack production baseline
- `v1.1.0` — Staff IDs, tracking numbers, auditable histories, resident completion/closure confirmations, backend-authoritative workflows, and Webmaster credential governance

See [`CHANGELOG.md`](CHANGELOG.md) for release details.

## Development notes

The public frontend consumes the live Render API; application records persist in Neon PostgreSQL rather than browser-only demo storage.

For backend setup, data model and deployment details, see the companion repository:

https://github.com/kelbrictech/digital-barangay-backend

## Project status

**v1.1.0 is deployed and human-accepted in production.** Additional independent assurance remains a future quality checkpoint and is not represented as part of this release.

---

## About KELBRIC Technologies

We turn practical ideas and operational needs into focused digital products through rapid prototyping and evidence-based iteration.

**Public product process:** DISCOVER → DESIGN → BUILD → PROVE

© 2026 KELBRIC Technologies.
