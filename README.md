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

3. Start Convex:

   ```bash
   npm run convex:dev
   ```

4. In another terminal, start Next.js:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000/admin/login`.

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
npm run typecheck
npm run lint
npm test
npm run build
```
