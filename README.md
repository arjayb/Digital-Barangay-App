# Digital Barangay App

A digital front desk for a barangay hall — request documents, browse the officials directory and notice board, and report a concern. No backend or login required — vanilla JS, HTML, and CSS, with data saved locally in the browser.

## Features

- **Request Documents** — request a Barangay Clearance, Certificate of Residency, Certificate of Indigency, or Business Permit Endorsement, and get a claim stub with a tracking number
- **Directory & Notices** — browse barangay officials and read posted announcements
- **Report a Concern** — file a non-emergency report (noise, infrastructure, sanitation, disputes, etc.), with an option to report anonymously
- All requests and reports persist locally and move through realistic status stages (e.g. Pending → Ready → Claimed)

## Run it

Just open `index.html` in a browser — no build step, no dependencies.

## Stack

HTML, CSS, vanilla JavaScript. Data is stored with `localStorage`, so it's demo-only — there's no real backend or database behind it.
