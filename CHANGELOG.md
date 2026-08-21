# Changelog

All notable changes to Digital Barangay are documented here.

The project follows Semantic Versioning for portfolio release management.

## [Unreleased]

No post-v1.1.0 changes are currently committed to the release plan.

## [1.1.0] - 2026-08-22

### Added
- Dedicated Webmaster role and credential-governance portal.
- Stable administrator Staff IDs (`ADM-####`) and seeded Webmaster identity (`WEB-0001`).
- Administrator application review workflow with approve/reject decisions and review notes.
- Administrator suspension/reactivation workflow that preserves historical attribution.
- Credential-governance history.
- Backend-generated document tracking numbers for existing and new requests.
- Canonical request and concern status-history records.
- Resident `Claimed` confirmation for requests marked ready for pickup.
- Resident `Confirm Resolved` action that closes a resolved concern.

### Changed
- Request and concern workflow transitions are backend-authoritative.
- Request rejection requires a reason at the approved transition point.
- Admin actions are attributed to the authenticated administrator and Staff ID.
- Admin credential fields are governed by the Webmaster workflow rather than ordinary Admin operations.
- Shared authentication gateway now routes `resident`, `admin`, and `webmaster` roles to their dedicated portals.

### Data migration
- Production migration was rehearsed against an isolated Neon branch before execution.
- Existing production Admin was preserved and assigned `ADM-0001` without changing credentials.
- Existing requests received unique tracking numbers.
- Existing requests and concerns received SYSTEM baseline history rows without fabricated staff attribution.
- Unique constraints for Staff IDs and tracking numbers were applied only after backfill verification.
- Existing production resident, request, and concern records were preserved.

### Release status
- Neon production migration: passed.
- Render backend deployment: passed.
- GitHub Pages frontend deployment: passed.
- Existing Admin authentication: passed.
- Webmaster authentication: passed.
- Human live acceptance: passed.
- Independent POLARIS audit: deferred as a later assurance exercise; not a v1.1.0 release blocker.

### Preservation
Both frontend and backend production commits are marked with the immutable `v1.1.0` tag. The prior `v1.0.0` baseline remains preserved.

## [1.0.0] - 2026-08-22

### Added
- Single authentication gateway with Member and Admin login modes.
- Resident registration and role-based authentication.
- Member Portal with dashboard, document requests, request tracking, concern reporting, concern tracking, and directory/notices.
- Admin operations portal with resident, document-request, and concern management.
- Persistent upper-right logout controls across authenticated portals.
- Shared responsive application shell and civic design system.
- Live frontend integration with the deployed Digital Barangay backend and database.

### Security
- Role-mode symmetry enforced before session creation.
- Authentication redirect destinations allowlisted and role-locked.

### Fixed
- Removed an orphan Member Portal refresh handler that prevented portal initialization after deployment.

### Release status
- Member Portal deployment acceptance: passed.
- Admin Portal deployment acceptance: passed.
- Production hotfix acceptance: passed.

### Preservation
The accepted v1.0.0 production state is preserved on the `release/v1.0.0` branch. Future patch work proceeds from `main` without rewriting this baseline.
