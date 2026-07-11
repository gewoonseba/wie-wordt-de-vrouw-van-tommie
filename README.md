# Tommie Scoreboard

Realtime public scoreboard for the “Wie wordt de vrouw van Tommie?” bachelor
party. Quiz scoring and physical card draws happen outside the app.

## What the app does

- `/` shows the live podium, complete ranking, date eligibility, and Tommie’s pot.
- `/admin` lets a logged-in host add signed score adjustments, set date
  eligibility, and add signed money adjustments.
- Existing `/p/<token>` links redirect to the public scoreboard. Participant
  tokens are no longer read or generated.

The event roster and participant photos must already exist in Convex. The app
does not provide participant, photo, team, card, quiz, or payout management.

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

| Platform | Variable | Notes |
|---|---|---|
| Vercel | `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL; the deploy command supplies it automatically. |
| Convex | `ADMIN_PASSCODE` | Strong event admin passcode. Do not use the development default. |
| Convex | `ADMIN_SESSION_TTL_HOURS` | Optional admin session lifetime. Defaults to `12`. |

Legacy Convex tables and fields remain in the schema for data compatibility.
Do not remove them until a backup has been created and its restore has been
verified.
