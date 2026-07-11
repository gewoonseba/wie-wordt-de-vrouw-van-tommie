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

Production rollout must be coordinated. This release removes Convex APIs that
the previous frontend still calls, so deploying the backend first creates a
temporary compatibility window until the matching frontend is live. Schedule a
maintenance window, prepare both deployments, deploy Convex, and immediately
deploy the matching Vercel frontend. Do not reintroduce the retired APIs solely
to bridge this window.

If rollback is required, redeploy the compatible backend and frontend together;
rolling back only Vercel leaves the old frontend calling removed Convex APIs.
Pull-request previews do not share this production risk because each preview
uses its isolated Convex deployment. The Vercel build command invokes Convex
with `--preview-run seed:preview`; Convex runs that mutation only when it
provisions a new preview, automatically adding the starter roster without
affecting production.

During the coordinated rollout, deploy the backend with:

```bash
npm run convex:deploy
```

Then seed the initial participant roster and its portraits:

```bash
npm run seed:participants
```

The script requests the production admin passcode and uploads the 15 PNG files
from the supplied Google Drive sticker folder to Convex storage. It uses stable
roster keys, then sets the documented start state: €1,000 in Tommie’s pot,
seeded individual scores, and date eligibility for Tommie, Seba, and Chiel.
Set `PARTICIPANT_PHOTO_DIR` when running it from a machine where the source
folder has a different path.

## 3. Configure Vercel

Use these project settings:

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Install Command | `npm install` |
| Build Command | `npx convex deploy --preview-run seed:preview --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'` |
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
2. Open `/admin/login`, authenticate with `ADMIN_PASSCODE`, and record the exact
   baseline score and date state for one participant plus the exact baseline
   value of Tommie’s pot.
3. Apply a known non-zero score delta, set the participant’s date state to the
   opposite boolean, and apply a known non-zero money delta. Keep both deltas so
   their exact inverses can be submitted.
4. Confirm the expected score, date state, and pot appear on `/` in realtime.
5. Restore the baseline by applying the inverse score and money deltas and
   setting date eligibility back to the recorded boolean.
6. Confirm `/admin` and `/` both show the exact recorded baselines after the
   realtime restoration; refresh `/` once to confirm the restored state persists.
7. Open a representative legacy `/p/anything` URL and confirm it redirects to
   `/` without a participant-token lookup.
8. Confirm there are no controls for participant setup, teams, cards, quiz
   rewards, date tasks, or payout configuration.

## Data compatibility

Legacy tables and fields intentionally remain in `convex/schema.ts`. Their
runtime APIs are retired, but destructive schema cleanup must wait until a
restorable data export has been created and successfully restored in a safe
environment.
