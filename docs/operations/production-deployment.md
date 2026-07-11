# Production Deployment

The Next.js frontend runs on Vercel and the realtime backend, database, and
participant photo storage run on Convex.

## 1. Prepare locally

Install dependencies and run the repository verification gate:

```bash
npm install
npm run verify
```

For local development:

```bash
cp .env.example .env.local
npm run dev:all
```

## 2. Configure and deploy Convex

Set these values in the Convex production environment:

| Variable | Required | Value |
|---|---:|---|
| `ADMIN_PASSCODE` | Yes | Strong passcode for `/admin/login`. |
| `ADMIN_SESSION_TTL_HOURS` | No | Session length in hours. Defaults to `12`. |

Do not use the development default `tommie-admin` for the event.

Deploy the backend before the frontend:

```bash
npm run convex:deploy
```

## 3. Configure Vercel

Use these project settings:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Install Command | `npm install` |
| Build Command | `npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'` |
| Output Directory | `.next` |

Add the matching `CONVEX_DEPLOY_KEY` to Vercel’s Production and Preview
environments. Production uses a production deploy key; previews use a Convex
preview deploy key. The build command supplies `NEXT_PUBLIC_CONVEX_URL` for the
matching deployment.

Create a production deploy key with:

```bash
npx convex deployment token create vercel-production --prod
```

Create preview deploy keys in Convex under Project Settings → Preview Deploy
Keys.

## 4. CI/CD

GitHub Actions runs install, audit, and `npm run verify`. Pull requests use the
Convex preview deploy key and Vercel credentials; merges to `main` deploy the
production app.

Required repository configuration:

| Kind | Name | Purpose |
|---|---|---|
| Secret | `CONVEX_PREVIEW_DEPLOY_KEY` | Creates the matching Convex preview backend. |
| Secret | `VERCEL_TOKEN` | Authorizes the Vercel deployment. |
| Variable | `VERCEL_ORG_ID` | Identifies the Vercel account or team. |
| Variable | `VERCEL_PROJECT_ID` | Identifies the Vercel project. |

## 5. Production smoke test

1. Open `/` without a token or login and confirm the public scoreboard loads.
2. Open `/admin/login`, authenticate with `ADMIN_PASSCODE`, and verify one score
   adjustment, one explicit date-state update, and one money adjustment.
3. Confirm each change appears on `/` in realtime.
4. Open a representative legacy `/p/anything` URL and confirm it redirects to
   `/` without a participant-token lookup.
5. Confirm there are no controls for participant setup, teams, cards, quiz
   rewards, date tasks, or payout configuration.

## Data compatibility

Legacy tables and fields intentionally remain in `convex/schema.ts`. Their
runtime APIs are retired, but destructive schema cleanup must wait until a
restorable data export has been created and successfully restored in a safe
environment.
