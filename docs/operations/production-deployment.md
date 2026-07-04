# Production Deployment

This app is split across:

- Vercel for the Next.js frontend.
- Convex for the realtime backend, database, functions, and file storage.

## 1. Prepare Locally

Run the full local verification suite before deploying:

```bash
npm install
npm run verify
```

Make sure `.env.local` has a working local Convex URL while developing:

```bash
cp .env.example .env.local
npm run convex:dev
```

## 2. Deploy Convex Production

Deploy the backend first so Vercel can point at the production Convex URL:

```bash
npm run convex:deploy
```

Set production-only Convex environment variables in the Convex dashboard:

| Variable | Required | Value |
|---|---:|---|
| `ADMIN_PASSCODE` | Yes | Strong passcode for `/admin/login`. |
| `ADMIN_SESSION_TTL_HOURS` | No | Session length in hours. Defaults to `12`. |

Do not use the development default `tommie-admin` for the actual event.

After deployment, copy the production deployment URL. It should look like:

```text
https://<deployment-name>.convex.cloud
```

## 3. Configure Vercel

Create or import the Vercel project from this repository.

Use these build settings. The build command is also committed in `vercel.json`
so Git-triggered preview and production deployments deploy Convex first, then
build the frontend with the matching Convex URL.

| Setting | Value |
|---|---|
| Framework Preset | Next.js |
| Install Command | `npm install` |
| Build Command | `npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'` |
| Output Directory | `.next` |

Add these Vercel environment variables:

| Variable | Environment | Required | Value |
|---|---|---:|---|
| `CONVEX_DEPLOY_KEY` | Production | Yes | Convex production deploy key. |
| `CONVEX_DEPLOY_KEY` | Preview | Yes | Convex preview deploy key from the Convex project settings. |
| `NEXT_PUBLIC_APP_URL` | Production | Yes | Public Vercel URL, for example `https://your-app.vercel.app`. |

Generate the production deploy key with:

```bash
npx convex deployment token create vercel-production --prod
```

Generate the preview deploy key from the Convex dashboard:

```text
Project Settings -> Preview Deploy Keys -> Generate Preview Deploy Key
```

Add both keys to Vercel as `CONVEX_DEPLOY_KEY`, scoped to their matching Vercel
environment. Without the Preview key, Vercel pull request deployments will not
be able to create isolated Convex preview backends.

`NEXT_PUBLIC_APP_URL` controls the base URL embedded into generated participant
QR codes. Update it if you later move from a Vercel preview URL to a custom
domain.

`NEXT_PUBLIC_CONVEX_URL` is supplied by `npx convex deploy` during the Vercel
build, so Vercel preview deployments can point at their own isolated Convex
preview backend.

## 4. GitHub CI/CD

GitHub Actions runs `npm ci`, `npm audit --audit-level=moderate`, and
`npm run verify` on pull requests and pushes to `main`.

Vercel is connected to the GitHub repository:

- Pull requests create Vercel Preview deployments.
- Merges to `main` create Vercel Production deployments.
- The Vercel build command deploys Convex automatically before building Next.js.

## 5. Deploy Vercel

Deploy from the Vercel dashboard or CLI. After deployment, open:

```text
https://<your-domain>/admin/login
```

Log in with the Convex `ADMIN_PASSCODE`, then create one test participant and
generate a QR code. Open the participant URL on a phone and confirm the viewer
loads realtime data.

## 6. Event-Day Checks

Before sharing QR codes:

- Confirm Vercel production has a production `CONVEX_DEPLOY_KEY`.
- Confirm Vercel preview has a preview `CONVEX_DEPLOY_KEY`.
- Confirm Convex has the production `ADMIN_PASSCODE`.
- Confirm `NEXT_PUBLIC_APP_URL` matches the URL guests will actually open.
- Create all participants and upload their photos.
- Generate QR codes only after the final production URL is set.
- Test at least one QR code from mobile data, not only the venue Wi-Fi.
