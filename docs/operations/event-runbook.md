# Event Runbook

## Before the party

1. Deploy Convex and Vercel using
   `docs/operations/production-deployment.md`.
2. Set the production `ADMIN_PASSCODE` in Convex.
3. Confirm the intended participant records are active and their names and
   stored photos are correct. Roster and photo maintenance happens outside the
   event UI, through the Convex Dashboard when needed.
4. Open `/` on a phone and a shared display. Confirm the podium, full ranking,
   date states, and Tommie’s exact pot render correctly.
5. Open `/admin/login`, log in, and confirm the control room lists every active
   participant.

## During the party

Use `/admin` for all live entry:

- Enter a positive score adjustment when a participant earns points.
- Enter a negative score adjustment to correct a mistake. The result cannot go
  below zero.
- Set the participant’s exact date status to “Date allowed” or “No date.”
- Enter positive or negative money adjustments for Tommie’s pot. The result
  cannot go below zero.

After each action, confirm `/` updates without a refresh. Quiz scoring, physical
cards, and decisions about rewards remain outside the app.

## If something goes wrong

- A rejected adjustment remains in its form so it can be corrected and retried.
- If the admin session expires, log in again and resubmit the adjustment.
- If the participant list is empty or incomplete, correct the retained records
  in the Convex Dashboard before continuing.
- Old participant QR links should redirect to `/`; they do not authorize a
  personalized view.
- Do not delete legacy Convex tables or fields during the event. Physical schema
  cleanup remains deferred until a backup restore has been verified.
