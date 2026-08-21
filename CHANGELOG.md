# Changelog

All notable changes to Digital Barangay are documented here.

The project follows Semantic Versioning for portfolio release management.

## [Unreleased]

### Planned
- Next patch release to be defined from the v1.0.0 production baseline.

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
