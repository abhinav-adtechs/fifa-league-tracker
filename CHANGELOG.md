# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/). Versions before 1.0.0 were tagged retroactively at milestone commits.

## [Unreleased]

### Security

- Removed hard-coded admin passwords from the client bundle and SQL scripts. Admin sign-in for the global admin and the legacy league's admins now goes only through the `verify_admin_password` RPC, with no offline fallback, and their old SHA-256 hashes are cleared from the stored platform state on load.
- `supabase_auth_setup.sql` turns on row-level security for `admin_passwords` and `admin_login_audit`.

### Changed

- Replaced the per-admin SQL scripts with `sql/set_admin_password.sql` (placeholders, refuses to run unedited).

## [1.0.0] — 2026-11-16

From a single league to a tournament platform. This release also adds the project documentation.

### Added

- Tournaments in four formats — Open League, League (round-robin), Knockout and League + Knockout — with a shared player pool, per-tournament squads and team names (`73d36b8`, `f15bcad`).
- Knockout bracket view with byes and a 3rd-place playoff (`73d36b8`, `f15bcad`).
- Tournament admin panel: per-tournament admins, result editing and deletion, squad management (`73d36b8`, `f15bcad`, `111d4ba`).
- Create-tournament dialog with trophy picker, guests and a match-count preview (`f15bcad`).
- Colour-coded league groups (`f15bcad`).
- React Router with shareable `/#/t/<tournament-id>` links (`111d4ba`).
- Explicit league groups for League + Knockout, with fixtures regenerated per group and participant reordering before the first match (`111d4ba`).
- README rewrite, `docs/` (architecture, ranking maths, deployment), MIT license, contributing guide, `.env.example`, this changelog and a GitHub Actions workflow.

### Changed

- Existing single-league data is migrated automatically into an Open League tournament (`73d36b8`).
- Auth, storage and session handling reworked for tournaments (`73d36b8`, `f15bcad`).

## [0.3.0] — 2026-03-11

### Added

- Promotion path (`RankProjection`): wins needed to overtake the next rank, against anyone or head-to-head (`43fd7cf`).
- Four colour themes — Dark, Light, Breeze and Amber (`43fd7cf`).
- FC26 shield logo in the header and as the favicon (`554b3d9`).
- Opponent names on biggest win and biggest loss in My Performance (`554b3d9`).

## [0.2.0] — 2026-02-19

### Added

- My Performance: calendar histogram, consistency, goals and biggest win/loss (`f4bb995`).
- Matches grouped by date, with a filter-aware 30-day histogram and compact rows (`a51b0b8`).
- PWA manifest, app icons and iOS standalone meta tags for Add to Home Screen (`ca97778`).
- Capacitor iOS project with session storage via Capacitor Preferences (`ca97778`).

## [0.1.0] — 2026-02-09

The first complete league tracker.

### Added

- Players, match recording and a standings table, scaffolded with Google AI Studio (`5530729`).
- Supabase persistence, prepared for Vercel deployment (`46d4eeb`).
- Password-based admin login backed by a `verify_admin_password` RPC, with login audit logging (`63ba68d`).
- Dark purple FC26-inspired theme and a glassmorphism dashboard (`03cab89`, `be129ac`).
- Normalised, points-per-game and classic table standings views, and a head-to-head comparison when two players are selected in Matches (`4732ecd`).
- Stats page upgrade; stats are recomputed from match history so they always stay in sync (`b21b782`, `3a349b3`).

### Removed

- The Gemini match-commentary service from the original scaffold (`63ba68d`).

[Unreleased]: https://github.com/abhinav-adtechs/fifa-league-tracker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/abhinav-adtechs/fifa-league-tracker/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/abhinav-adtechs/fifa-league-tracker/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/abhinav-adtechs/fifa-league-tracker/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/abhinav-adtechs/fifa-league-tracker/commits/v0.1.0
