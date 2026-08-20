# Digital Barangay App — Frontend

Static frontend for the Digital Barangay full-stack app: a public front desk demo plus resident and admin login portals backed by a real API.

## Stack

- Static HTML/CSS/vanilla JS, deployed on **GitHub Pages**
- Backend: **Node.js + Express**, **Prisma ORM** over **PostgreSQL (Neon)**, JWT auth, bcrypt password hashing — deployed on **Render**
- File uploads (document requests, concern reports) go straight to **Cloudinary**

## Pages

| Page | Purpose | Auth |
|---|---|---|
| `index.html` | Public front desk demo (request documents, directory & notices, report a concern) | none — currently a standalone localStorage demo, not yet wired to the API |
| `member-login.html` | Resident sign-in | calls `POST /api/auth/login` |
| `admin-login.html` | Staff-only sign-in; rejects non-admin accounts even with valid credentials | calls `POST /api/auth/login`, checks `role === 'admin'` |
| `admin-dashboard.html` | Protected shell for staff tools (requests, notices, officials, concerns management plug in here) | guarded by `assets/js/admin-guard.js` |

## How the auth split works

The backend has one login endpoint that returns the account's `role` (`resident` or `admin`) along with a JWT. The frontend enforces the split:

- `member-login.html` accepts any authenticated account.
- `admin-login.html` accepts the login response but only creates a session if `role === 'admin'` — otherwise it shows an error and never stores a token.
- `admin-guard.js`, included at the top of every admin page, re-checks the token against `GET /api/auth/me` on each load (not just the cached role), so an expired token or a demoted account gets redirected back to `admin-login.html` immediately rather than trusting stale localStorage.

## Setup

1. Open `assets/js/api.js` and set `API_BASE_URL` to your deployed Render backend URL.
2. Confirm `CORS_ORIGIN` on Render matches your GitHub Pages origin.
3. Create your first admin with the backend's seed script (see the backend README), then sign in at `admin-login.html`.

## Not yet done

- `index.html` still runs entirely on localStorage and isn't calling the API yet — hooking its request/report forms up to `POST /api/requests` and `POST /api/concerns` (with the resident's token attached) is the next integration step.
- No resident self-registration page yet (`POST /api/auth/register` exists on the backend; a `member-register.html` just needs to call it).
- Admin dashboard is a shell — the actual modules (manage requests, officials, notices, concerns, reports) still need to be built on top of the guard.
