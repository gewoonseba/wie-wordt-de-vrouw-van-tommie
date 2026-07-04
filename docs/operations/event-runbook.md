# Event Runbook

## Before the Party

1. Deploy Convex and Vercel using `docs/operations/production-deployment.md`.
2. Set production environment variables in Convex and Vercel.
3. Login as admin.
4. Create every participant.
5. Upload participant pictures.
6. Generate QR codes for participants.
7. Create the teams for the first activity.
8. Test one participant QR code on a phone.

## During the Party

Use `/admin/scoring` for all live entry.

For physical card draws:

1. Select a pending draw or choose a participant manually.
2. Enter the physical card ranks.
3. Save the draw.
4. Confirm points and date eligibility update on the viewer page.

For dates:

1. Select a player with `canDate = true`.
2. Select the date task.
3. Start the date. This consumes the player's date flag.
4. Mark success or failure.
5. On success, resolve the generated 3-card pending draw after the player
   physically draws cards.

For quiz rounds:

1. Enter team scores.
2. Save quiz rewards.
3. Resolve each generated card draw after physical cards are drawn.

For mini-games:

1. Enter card rewards per team.
2. Save mini-game rewards.
3. Resolve each generated card draw after physical cards are drawn.

## If Something Goes Wrong

- Use manual card draw entries for missed obligations.
- Use the participant page to manually reset a player's `canDate` flag.
- Add a Tommie money manual adjustment for missed payouts.
- Keep notes in money events so corrections are understandable later.
