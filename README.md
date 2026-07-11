# Tommie Scoreboard

Realtime public scoreboard for the “Wie wordt de vrouw van Tommie?” bachelor
party. Quiz scoring and physical card draws happen outside the app.

## What the app does

- `/` shows the live podium, complete ranking, date eligibility, and Tommie’s pot.
- `/admin` lets a logged-in host manage the participant roster (including
  portraits and scoreboard visibility), add signed score adjustments, set date
  eligibility, and add signed money adjustments.
- Existing `/p/<token>` links redirect to the public scoreboard. Participant
  tokens are no longer read or generated.

The repository includes a production roster seeder for the 15 event
participants. It uploads the portraits from the supplied local folder to
Convex storage and can safely be run again without resetting scores.

## Stack

- Next.js App Router frontend
- Convex realtime database, functions, and file storage
- Vercel hosting

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment values:

   ```bash
   cp .env.example .env.local
   ```

3. Start Convex and Next.js:

   ```bash
   npm run dev:all
   ```

4. Open `http://localhost:3000` for the scoreboard or
   `http://localhost:3000/admin/login` for host controls.

`npm run dev:all` keeps the local frontend and Convex backend behind
`localhost:3000` so browser previews can use the same origin.

The default development admin passcode is `tommie-admin`. Set a strong
`ADMIN_PASSCODE` in the Convex production environment before the event.

## Verification

```bash
npm run verify
```

Dependencies are pinned to exact versions. Keep `.npmrc` set to
`save-exact=true` when adding packages.

## Production

Host the backend on Convex and the frontend on Vercel. See
[`docs/operations/production-deployment.md`](docs/operations/production-deployment.md)
for the deployment checklist.

Seed the production roster after deploying the Convex functions:

```bash
npm run seed:participants
```

The command prompts for the production admin passcode (or accepts it through
`ADMIN_PASSCODE`) and reads portraits from the provided Google Drive folder.
Set `PARTICIPANT_PHOTO_DIR` when that folder is elsewhere. Preview deployments
seed the same 15 names automatically through Convex's `--preview-run` hook.
The seed starts with €1,000 in Tommie&apos;s pot, preset individual scores, and
date eligibility for Tommie, Seba, and Chiel. Admin can restore this start
state with **Startstand herstellen**.

| Platform | Variable | Notes |
|---|---|---|
| Vercel | `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL; the deploy command supplies it automatically. |
| Convex | `ADMIN_PASSCODE` | Strong event admin passcode. Do not use the development default. |
| Convex | `ADMIN_SESSION_TTL_HOURS` | Optional admin session lifetime. Defaults to `12`. |

Legacy Convex tables and fields remain in the schema for data compatibility.
Do not remove them until a backup has been created and its restore has been
verified.
