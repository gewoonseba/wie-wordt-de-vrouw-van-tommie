import { mutation } from "./_generated/server";
import { getOrCreateSettings } from "./settings";

export const STARTING_MONEY = 1_000;

export const PARTICIPANT_ROSTER = [
  { name: "Diet", seedKey: "diet", points: 120, canDate: false },
  { name: "Tommie", seedKey: "tommie", points: 80, canDate: true },
  { name: "Mehuys", seedKey: "mehuys", points: 110, canDate: false },
  { name: "Tim", seedKey: "tim", points: 60, canDate: false },
  { name: "Seba", seedKey: "seba", points: 100, canDate: true },
  { name: "Antoon", seedKey: "antoon", points: 90, canDate: false },
  { name: "Robbert", seedKey: "robbert", points: 75, canDate: false },
  { name: "Chiel", seedKey: "chiel", points: 130, canDate: true },
  { name: "Bossie", seedKey: "bossie", points: 55, canDate: false },
  { name: "Okan", seedKey: "okan", points: 95, canDate: false },
  { name: "Goossens", seedKey: "goossens", points: 105, canDate: false },
  { name: "Toubri", seedKey: "toubri", points: 70, canDate: false },
  { name: "Wolsing", seedKey: "wolsing", points: 115, canDate: false },
  { name: "Jakkie", seedKey: "jakkie", points: 65, canDate: false },
  { name: "Vinny", seedKey: "vinny", points: 85, canDate: false }
] as const;

/** Creates missing starter participants for a newly created preview deployment. */
export const preview = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    let created = 0;

    const settings = await getOrCreateSettings(ctx);
    if (!settings._id) {
      throw new Error("Settings were not persisted.");
    }
    await ctx.db.patch(settings._id, {
      tommieMoney: STARTING_MONEY,
      updatedAt: now
    });

    for (const participant of PARTICIPANT_ROSTER) {
      const existing = await ctx.db
        .query("participants")
        .withIndex("by_seed_key", (q) => q.eq("seedKey", participant.seedKey))
        .unique();

      if (!existing) {
        await ctx.db.insert("participants", {
          ...participant,
          previewPhotoPath: `/participants/${participant.seedKey}.png`,
          isActive: true,
          createdAt: now,
          updatedAt: now
        });
        created += 1;
      } else if (!existing.previewPhotoPath) {
        await ctx.db.patch(existing._id, {
          previewPhotoPath: `/participants/${participant.seedKey}.png`,
          updatedAt: now
        });
      }
    }

    return { created, total: PARTICIPANT_ROSTER.length };
  }
});
