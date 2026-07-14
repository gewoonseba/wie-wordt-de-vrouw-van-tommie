import { query } from "./_generated/server";
import { getOrCreateSettings } from "./settings";

const MAX_ACTIVE_PARTICIPANTS = 100;

export const get = query({
  args: {},
  handler: async (ctx) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(MAX_ACTIVE_PARTICIPANTS + 1);

    if (participants.length > MAX_ACTIVE_PARTICIPANTS) {
      throw new Error(
        `Scoreboard supports at most ${MAX_ACTIVE_PARTICIPANTS} active participants.`
      );
    }

    const settings = await getOrCreateSettings(ctx);

    return {
      participants: await Promise.all(
        participants.map(async (participant) => ({
          _id: participant._id,
          name: participant.name,
          photoUrl: participant.photoStorageId
            ? await ctx.storage.getUrl(participant.photoStorageId)
            : (participant.previewPhotoPath ?? null),
          points: participant.points,
          canDate: participant.canDate,
          createdAt: participant.createdAt
        }))
      ),
      tommieMoney: settings.tommieMoney
    };
  }
});
