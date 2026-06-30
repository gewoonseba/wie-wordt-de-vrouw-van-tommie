import { v } from "convex/values";
import { query } from "./_generated/server";
import { participantIdForToken } from "./authTokens";
import { getOrCreateSettings } from "./settings";

async function participantWithPhoto(ctx: any, participant: any) {
  return {
    ...participant,
    photoUrl: participant.photoStorageId
      ? await ctx.storage.getUrl(participant.photoStorageId)
      : null
  };
}

export const dashboard = query({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    const viewerParticipantId = await participantIdForToken(ctx, args.token);
    if (!viewerParticipantId) {
      return { authorized: false as const };
    }

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    const settings = await getOrCreateSettings(ctx);
    const events = await ctx.db
      .query("events")
      .withIndex("by_created")
      .order("desc")
      .take(15);

    return {
      authorized: true as const,
      viewerParticipantId,
      participants: await Promise.all(
        participants.map((participant) => participantWithPhoto(ctx, participant))
      ),
      settings,
      events
    };
  }
});
