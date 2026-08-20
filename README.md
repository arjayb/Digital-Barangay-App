# Digital Barangay App

A standalone digital front desk for Barangay San Isidro. Residents can request documents, browse the officials directory and notice board, and report non-emergency concerns.

This folder contains the simple frontend counterpart of the supplied
`Digital-Barangay-App-main` ZIP:

- `index.html` — page structure and resident-facing forms
- `style.css` — Barangay San Isidro visual design
- `script.js` — tabs, seeded content, request/report flows, tracking IDs, and local persistence

## Features

- Request a Barangay Clearance, Certificate of Residency, Certificate of Indigency, or Business Permit Endorsement
- Generate a claim stub with a tracking number
- View officials and community notices
- Report noise, infrastructure, sanitation, neighbor disputes, stray animals, or another concern
- Submit anonymously when needed
- Keep request and report data in the browser with `localStorage`
- Move demo statuses through `Pending → Ready → Claimed` and `Received → In Progress → Resolved`

## Run locally

No build step or package installation is required. Keep all four files in the same folder and open `index.html` in a browser.

For a local static server, run one of these commands from this folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deploy with GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `script.js`, and `README.md` to the repository root.
3. Open **Settings → Pages** in GitHub.
4. Choose **Deploy from a branch**.
5. Select the `main` branch and the `/root` folder.
6. Save and wait for the GitHub Actions deployment to finish.

The resulting site will normally be available at:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY/
```

## Backend deployment notes

The supplied backend is a separate Node.js/Express service backed by MongoDB
and Cloudinary. Its API routes include:

- `/api/auth`
- `/api/users`
- `/api/requests`
- `/api/officials`
- `/api/notices`
- `/api/concerns`
- `/api/admin`

The backend deployment used Render with:

```text
Build command: npm install --legacy-peer-deps
Start command: npm start
```

The current standalone files intentionally preserve the original ZIP behavior:
they operate without a backend and save data locally in the browser. To connect
them to the deployed backend, the form handlers in `script.js` must be changed
to call the Render API and the backend `CORS_ORIGIN` must match the exact
GitHub Pages origin.

## Stack

HTML, CSS, vanilla JavaScript, and browser `localStorage`.