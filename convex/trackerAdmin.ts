import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { assertAdmin } from "./authTokens";
import { getOrCreateSettings } from "./settings";

function assertNonZeroInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value === 0) {
    throw new Error(`${label} must be a non-zero integer.`);
  }
}

export const adjustScore = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    delta: v.number()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    assertNonZeroInteger(args.delta, "Score adjustment");

    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found.");
    }

    const points = participant.points + args.delta;
    if (!Number.isSafeInteger(points)) {
      throw new Error("Score total must be a safe integer.");
    }
    if (points < 0) {
      throw new Error("Score cannot be negative.");
    }

    await ctx.db.patch(participant._id, {
      points,
      updatedAt: Date.now()
    });

    return { points };
  }
});

export const setDateEligibility = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    canDate: v.boolean()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);

    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found.");
    }

    if (participant.canDate !== args.canDate) {
      await ctx.db.patch(participant._id, {
        canDate: args.canDate,
        updatedAt: Date.now()
      });
    }

    return { canDate: args.canDate };
  }
});

export const adjustMoney = mutation({
  args: {
    adminToken: v.string(),
    delta: v.number()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    assertNonZeroInteger(args.delta, "Money adjustment");

    const settings = await getOrCreateSettings(ctx);
    if (!settings._id) {
      throw new Error("Settings were not persisted.");
    }

    const tommieMoney = settings.tommieMoney + args.delta;
    if (!Number.isSafeInteger(tommieMoney)) {
      throw new Error("Money total must be a safe integer.");
    }
    if (tommieMoney < 0) {
      throw new Error("Money total cannot be negative.");
    }

    await ctx.db.patch(settings._id, {
      tommieMoney,
      updatedAt: Date.now()
    });

    return { tommieMoney };
  }
});
