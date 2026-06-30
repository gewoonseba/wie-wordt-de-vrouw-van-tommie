import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./authTokens";

const SETTINGS_KEY = "event";

export const DEFAULT_PAYOUTS = {
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
      defaultPayouts: DEFAULT_PAYOUTS,
      updatedAt: Date.now()
    };
  }

  const settingsId = await ctx.db.insert("settings", {
    key: SETTINGS_KEY,
    tommieTarget: 10000,
    tommieMoney: 0,
    defaultPayouts: DEFAULT_PAYOUTS,
    updatedAt: Date.now()
  });

  const created = await ctx.db.get(settingsId);
  if (!created) {
    throw new Error("Failed to create settings.");
  }
  return created;
}

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    return await getOrCreateSettings(ctx);
  }
});

export const getAdmin = query({
  args: {
    adminToken: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    return await getOrCreateSettings(ctx);
  }
});

export const update = mutation({
  args: {
    adminToken: v.string(),
    tommieTarget: v.number(),
    defaultPayouts: v.object({
      hiddenTask: v.number(),
      jokerUse: v.number(),
      standardChallenge: v.number(),
      roundThreeWin: v.number(),
      dateMoment: v.number()
    })
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const settings = await getOrCreateSettings(ctx);

    if (!settings._id) {
      throw new Error("Settings were not persisted.");
    }

    await ctx.db.patch(settings._id, {
      tommieTarget: args.tommieTarget,
      defaultPayouts: args.defaultPayouts,
      updatedAt: Date.now()
    });
  }
});
