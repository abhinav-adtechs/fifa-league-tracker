# Deployment

The app is a static Vite build. Without configuration it runs entirely in the browser with `localStorage`; add Supabase when you want everyone to see the same league.

## Contents

1. [Supabase](#1-supabase)
2. [Admins](#2-admins)
3. [Web hosting](#3-web-hosting)
4. [iOS app](#4-ios-app)

## 1. Supabase

Create a project at [supabase.com](https://supabase.com/dashboard), then run the following in the **SQL Editor**.

### State tables

The app stores its state in two single-row tables (see [ARCHITECTURE.md](ARCHITECTURE.md#persistence)). Their DDL is not part of the repo yet, so here is the minimal schema `services/storage.ts` expects:

```sql
create table if not exists public.players_state (
  id      text primary key,   -- the app uses 'default'
  players jsonb
);

create table if not exists public.matches_state (
  id      text primary key,   -- the app uses 'default'
  matches jsonb
);

alter table public.players_state enable row level security;
alter table public.matches_state enable row level security;

-- The browser reads and upserts these rows with the anon key.
create policy "anon read players"   on public.players_state for select to anon using (true);
create policy "anon insert players" on public.players_state for insert to anon with check (true);
create policy "anon update players" on public.players_state for update to anon using (true) with check (true);

create policy "anon read matches"   on public.matches_state for select to anon using (true);
create policy "anon insert matches" on public.matches_state for insert to anon with check (true);
create policy "anon update matches" on public.matches_state for update to anon using (true) with check (true);
```

> [!WARNING]
> These policies are what the current client needs, and they let anyone holding your anon key edit league data. Admin logins protect the UI, not the database. Share the deployment with people you trust; see the [security model](ARCHITECTURE.md#security-model).

### Admin password function

[`supabase_auth_setup.sql`](../supabase_auth_setup.sql) creates the `admin_passwords` table (bcrypt hashes via `pgcrypto`), an `admin_login_audit` table, the `verify_admin_password(plain_password)` RPC and an `admin_login_summary` view, and turns on row-level security for both tables so the anon key cannot read them.

Then add each admin with [`sql/set_admin_password.sql`](../sql/set_admin_password.sql): replace the two placeholders, run it, and clear the editor. Run the same script to change a password. Never commit real passwords. If the RPC ever goes missing, [`fix_function.sql`](../fix_function.sql) recreates it.

Finally, copy the project URL and **anon** key from _Settings → API_.

## 2. Admins

- The **global admin** (who can create tournaments) is verified through `verify_admin_password`, and `services/auth.ts` only accepts one admin name for that role (`GLOBAL_ADMIN_NAME`). Change it to match the admin you inserted.
- **Tournament admins** are stored per tournament (name + SHA-256 hash) and managed from the tournament's _Settings_ tab. The global admin is added to every new tournament without a local hash and signs in through `verify_admin_password`, as do the original league's admins (`LEGACY_ADMIN_NAMES`) in the legacy tournament.

> [!NOTE]
> No passwords ship in the client bundle and there is no offline fallback: the global admin needs Supabase to sign in.

## 3. Web hosting

Any static host works. On Vercel:

1. Import the repository; the **Vite** preset detects `npm run build` and the `dist` output folder.
2. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or the `NEXT_PUBLIC_` variants) as environment variables. They are inlined at build time, so redeploy after changing them.
3. Deploy. The app uses hash routes (`/#/t/<id>`), so no rewrite rules are needed.

To check a build locally: `npm run build && npm run preview`.

The PWA manifest (`public/manifest.webmanifest`) uses `start_url: "/"`, so serve the app from the domain root for Add to Home Screen to work as expected.

## 4. iOS app

**Prerequisites:** Xcode and CocoaPods.

```bash
npm run ios        # vite build → npx cap sync ios → opens Xcode
```

Or step by step: `npm run build`, `npm run cap:sync`, then open `ios/App/App.xcworkspace`. Select a simulator or device, configure signing, and run.

The iOS app bundles the built `dist/` folder (`capacitor.config.ts` → `webDir: "dist"`), so rebuild and sync after every web change. The Supabase values baked into that build are the ones used by the app. Admin sessions are stored with Capacitor Preferences on device.
