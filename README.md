# Digital Barangay App — Frontend

A full-stack Digital Barangay resident and staff portal for Barangay San Isidro.

## Live Demo

**GitHub Pages:** https://arjayb.github.io/Digital-Barangay-App/

**Backend API:** https://digital-barangay-backend.onrender.com/

## What it does

### Residents

- Create a resident account
- Sign in securely with JWT authentication
- Submit barangay document requests
- Receive a backend-generated tracking number
- Report non-emergency community concerns
- Track request and concern status
- View barangay officials and published notices

### Barangay Staff

- Protected admin login
- Live resident/request/concern metrics
- Review document requests
- Update request status and add notes
- Review community concerns
- Update concern status

## Architecture

```text
Resident / Admin Browser
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
| `index.html` | Public Digital Barangay front desk |
| `about.html` | About the application and architecture |
| `member-register.html` | Resident account registration |
| `member-login.html` | Resident authentication |
| `member-dashboard.html` | Resident requests and concerns dashboard |
| `admin-login.html` | Staff-only authentication |
| `admin-dashboard.html` | Protected staff operations dashboard |

## Authentication

The backend uses one login system with account roles (`resident` and `admin`). The frontend enforces the appropriate portal for each role, while protected pages re-check the session against the backend.

## Development notes

The public front desk is now connected to the deployed API. Requests and concerns are persisted in PostgreSQL rather than browser-only demo storage. Resident and admin dashboards consume live backend data.

For backend setup, database deployment and environment variables, see the companion repository:

https://github.com/arjayb/digital-barangay-backend

## Project status

Version 1 full-stack foundation is deployed and connected across GitHub Pages, Render, Prisma and Neon. The next phase is production hardening, UX refinement, richer admin operations, and additional resident services.
