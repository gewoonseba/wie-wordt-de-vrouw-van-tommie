import { v } from "convex/values";

import { mutation, type MutationCtx } from "./_generated/server";
import { assertAdmin } from "./authTokens";
import { PARTICIPANT_ROSTER, STARTING_MONEY } from "./seed";
import { getOrCreateSettings } from "./settings";

const MAX_PARTICIPANTS = 100;

async function getResettableParticipants(ctx: MutationCtx) {
  const participants = await ctx.db.query("participants").take(MAX_PARTICIPANTS + 1);
  if (participants.length > MAX_PARTICIPANTS) {
    throw new Error(`Reset supports at most ${MAX_PARTICIPANTS} participants.`);
  }
  return participants;
}

async function setTommieMoney(ctx: MutationCtx, tommieMoney: number, updatedAt: number) {
  const settings = await getOrCreateSettings(ctx);
  if (!settings._id) {
    throw new Error("Settings were not persisted.");
  }
  await ctx.db.patch(settings._id, { tommieMoney, updatedAt });
}

function assertNonZeroInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value === 0) {
    throw new Error(`${label} must be a non-zero integer.`);
  }
}

function assertCardPoints(value: number) {
  if (!Number.isSafeInteger(value) || value < 2 || value > 10) {
    throw new Error("Card points must be an integer between 2 and 10.");
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

export const playCard = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    points: v.number()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    assertCardPoints(args.points);

    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found.");
    }

    const points = participant.points + args.points;
    if (!Number.isSafeInteger(points)) {
      throw new Error("Score total must be a safe integer.");
    }

    await ctx.db.patch(participant._id, {
      points,
      canDate: true,
      updatedAt: Date.now()
    });

    return { points, canDate: true };
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

export const resetToStartingState = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const participants = await getResettableParticipants(ctx);

    const startingState = new Map<string, { points: number; canDate: boolean }>(
      PARTICIPANT_ROSTER.map((participant) => [participant.seedKey, participant])
    );
    const now = Date.now();
    for (const participant of participants) {
      const seed = participant.seedKey ? startingState.get(participant.seedKey) : undefined;
      await ctx.db.patch(participant._id, {
        points: seed?.points ?? 0,
        canDate: seed?.canDate ?? false,
        updatedAt: now
      });
    }

    await setTommieMoney(ctx, STARTING_MONEY, now);

    return { participantCount: participants.length, tommieMoney: STARTING_MONEY };
  }
});

export const startNewGame = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const participants = await getResettableParticipants(ctx);

    const now = Date.now();
    for (const participant of participants) {
      await ctx.db.patch(participant._id, {
        points: 0,
        canDate: true,
        updatedAt: now
      });
    }

    await setTommieMoney(ctx, 0, now);

    return { participantCount: participants.length, tommieMoney: 0 };
  }
});
