import { query, type MutationCtx, type QueryCtx } from "./_generated/server";

const SETTINGS_KEY = "event";

const LEGACY_DEFAULT_PAYOUTS = {
  hiddenTask: 500,
  jokerUse: 500,
  standardChallenge: 500,
  roundThreeWin: 1000,
  dateMoment: 500
};

export async function getOrCreateSettings(ctx: QueryCtx | MutationCtx) {
  const existing = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
    .unique();

  if (existing) {
    return existing;
  }

  if (!("insert" in ctx.db)) {
    return {
      _id: undefined,
      _creationTime: Date.now(),
      key: SETTINGS_KEY,
      tommieTarget: 10000,
      tommieMoney: 0,
      defaultPayouts: LEGACY_DEFAULT_PAYOUTS,
      updatedAt: Date.now()
    };
  }

  const settingsId = await ctx.db.insert("settings", {
    key: SETTINGS_KEY,
    tommieTarget: 10000,
    tommieMoney: 0,
    defaultPayouts: LEGACY_DEFAULT_PAYOUTS,
    updatedAt: Date.now()
  });

  const created = await ctx.db.get(settingsId);
  if (!created) {
    throw new Error("Failed to create settings.");
  }
  return created;
}

export const getTommieMoney = query({
  args: {},
  handler: async (ctx) => {
    const settings = await getOrCreateSettings(ctx);
    return { tommieMoney: settings.tommieMoney };
  }
});
