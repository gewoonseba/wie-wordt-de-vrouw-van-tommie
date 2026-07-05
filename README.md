# Tommie Bachelor Tracker

Realtime tracker for the bachelor party game described in `spel-tracking-spec.md`.

## Stack

- Next.js App Router frontend
- Convex realtime database, functions, and file storage
- Vercel hosting
- QR-token participant access without participant accounts

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment values:

   ```bash
   cp .env.example .env.local
   ```

3. Start the local app:

   ```bash
   npm run dev:all
   ```

4. Open `http://localhost:3000/admin/login`.

`npm run dev:all` starts Convex, runs Next.js, and keeps both services behind
`localhost:3000` so local browser previews can connect to Convex through the same
origin.

The default development admin passcode is `tommie-admin`. Set `ADMIN_PASSCODE`
in Convex environment variables before using the app for the actual event.

## Core Workflows

- Create participants under `/admin/participants`.
- Upload pictures for participants.
- Generate a QR code for each participant and let them scan it.
- Create teams and assign players before quiz or mini-game rounds.
- Use `/admin/scoring` to enter physical card draws, dates, quiz rewards,
  mini-game rewards, and Tommie money events.

## Verification

```bash
npm run verify
```

## Dependency Versions

Dependencies are pinned to exact versions. Keep `.npmrc` set to
`save-exact=true` so future `npm install <package>` commands do not add version
ranges.

## Production

Host the backend on Convex and the frontend on Vercel. The full checklist is in
[`docs/operations/production-deployment.md`](docs/operations/production-deployment.md).

Required production values:

| Platform | Variable | Notes |
|---|---|---|
| Vercel | `NEXT_PUBLIC_CONVEX_URL` | Production Convex URL, for example `https://example.convex.cloud`. |
| Vercel | `NEXT_PUBLIC_APP_URL` | Final Vercel production URL, used for participant QR links. |
| Convex | `ADMIN_PASSCODE` | Strong event admin passcode. Do not use the development default. |
| Convex | `ADMIN_SESSION_TTL_HOURS` | Optional admin session lifetime. Defaults to `12`. |
