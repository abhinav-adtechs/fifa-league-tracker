# Contributing to FIFA League Tracker

Thanks for helping out! This guide covers local setup, conventions and what a good pull request looks like.

By participating you agree to follow the [Code of Conduct](https://github.com/abhinav-adtechs/.github/blob/main/CODE_OF_CONDUCT.md). Please report security issues privately as described in the [security policy](https://github.com/abhinav-adtechs/.github/blob/main/SECURITY.md) — not in public issues.

## Development setup

**Requirements:** Node.js 20.19+ or 22.12+ (CI runs Node 22) and npm. Xcode and CocoaPods only for iOS work.

```bash
git clone https://github.com/abhinav-adtechs/fifa-league-tracker.git
cd fifa-league-tracker
npm ci
npm run dev        # http://localhost:3000
```

No backend is required: without Supabase variables the app keeps everything in `localStorage`, which is the easiest way to develop. Admin sign-in has no offline fallback, so admin features need Supabase. To test against Supabase, copy `.env.example` to `.env.local`, fill in a **development** project's URL and anon key, and follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) to create the tables.

### Checks

CI runs exactly these — please run them before opening a PR:

```bash
npx tsc --noEmit   # type-check
npm run build      # production build
```

There is no linter or test runner yet; adding tests is on the roadmap.

## Where things live

- League and tournament logic: `utils/` (pure functions — the best place to start)
- UI: `App.tsx` and `components/`
- Persistence and auth: `services/`
- Themes and global styles: `index.html`

[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) has the full map, and [`docs/RANKING.md`](docs/RANKING.md) explains the maths.

## Making changes

- **Keep logic in `utils/`.** Functions there take state and return new state without side effects; components should call them rather than duplicate rules.
- **Don't break saved data.** Everything lives in one persisted `PlatformState` JSON document. If you change its shape in `types.ts`, handle older documents on load (see `createPlatformFromLegacy` for an example) and mention it in the PR.
- **Ranking changes** need a matching update to `docs/RANKING.md` with a worked example.
- **No secrets or personal data.** Never commit `.env*` files, keys, passwords, real names or photos of people.

## Branches and commits

- Branch from `main` with a prefix: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`, `test/…`.
- Use [Conventional Commits](https://www.conventionalcommits.org/):

  ```text
  feat(bracket): show aggregate score for two-legged ties
  fix(standings): break PPG ties by goal difference
  docs: add League + Knockout example to RANKING.md
  ```

## Filing issues

- **Bugs:** steps to reproduce, expected vs actual behaviour, browser or iOS version, and whether Supabase or `localStorage` was in use.
- **Features:** describe the league situation you're trying to handle before the proposed UI.
- Search [existing issues](https://github.com/abhinav-adtechs/fifa-league-tracker/issues) first.

## Pull request checklist

- [ ] `npx tsc --noEmit` and `npm run build` pass
- [ ] The PR does one thing and explains _why_
- [ ] Changes to persisted state are backward compatible (or migrated)
- [ ] UI changes include screenshots — ideally in both a dark and a light theme
- [ ] Docs updated (`README.md`, `docs/`) where behaviour changed
- [ ] No secrets, personal data or `.env*` files in the diff
