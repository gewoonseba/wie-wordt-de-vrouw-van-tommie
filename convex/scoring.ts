import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { assertAdmin } from "./authTokens";
import { getOrCreateSettings } from "./settings";
import {
  calculateQuizRewards,
  consumeDateFlag,
  scoreCardDraw
} from "../src/lib/game-rules";

const cardRankValidator = v.union(
  v.literal("2"),
  v.literal("3"),
  v.literal("4"),
  v.literal("5"),
  v.literal("6"),
  v.literal("7"),
  v.literal("8"),
  v.literal("9"),
  v.literal("10"),
  v.literal("A"),
  v.literal("J"),
  v.literal("Q"),
  v.literal("K")
);

export const listPendingDraws = query({
  args: {
    adminToken: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    return await ctx.db
      .query("drawObligations")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  }
});

export const recentEvents = query({
  args: {
    adminToken: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    return await ctx.db
      .query("events")
      .withIndex("by_created")
      .order("desc")
      .take(args.limit ?? 25);
  }
});

export const recordCardDraw = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    cards: v.array(cardRankValidator),
    reason: v.string(),
    obligationId: v.optional(v.id("drawObligations"))
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found.");
    }

    const result = scoreCardDraw(args.cards, participant.canDate);
    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      type: "card_draw",
      actor: "admin",
      participantId: args.participantId,
      payload: {
        reason: args.reason,
        cards: args.cards,
        dateCardsDrawn: result.dateCardsDrawn,
        canDateBefore: participant.canDate,
        canDateAfter: result.canDateAfter,
        obligationId: args.obligationId
      },
      pointsDelta: result.pointsAwarded,
      createdAt: now
    });

    await ctx.db.patch(args.participantId, {
      points: participant.points + result.pointsAwarded,
      canDate: result.canDateAfter,
      updatedAt: now
    });

    if (args.obligationId) {
      await ctx.db.patch(args.obligationId, {
        status: "resolved",
        resolvedEventId: eventId,
        updatedAt: now
      });
    }

    return { eventId, result };
  }
});

export const startDate = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    task: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found.");
    }

    const canDateAfterStart = consumeDateFlag(participant.canDate);
    const now = Date.now();

    await ctx.db.patch(args.participantId, {
      canDate: canDateAfterStart,
      updatedAt: now
    });

    return await ctx.db.insert("events", {
      type: "date_started",
      actor: "admin",
      participantId: args.participantId,
      payload: {
        task: args.task,
        canDateBefore: participant.canDate,
        canDateAfterStart
      },
      createdAt: now
    });
  }
});

export const completeDate = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    task: v.string(),
    success: v.boolean(),
    awardTommieMoney: v.boolean()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const now = Date.now();
    const settings = await getOrCreateSettings(ctx);
    let moneyDelta = 0;

    if (args.awardTommieMoney) {
      moneyDelta = settings.defaultPayouts.dateMoment;
      if (settings._id) {
        await ctx.db.patch(settings._id, {
          tommieMoney: settings.tommieMoney + moneyDelta,
          updatedAt: now
        });
      }
    }

    const eventId = await ctx.db.insert("events", {
      type: "date_completed",
      actor: "admin",
      participantId: args.participantId,
      payload: {
        task: args.task,
        success: args.success,
        awardTommieMoney: args.awardTommieMoney
      },
      moneyDelta: moneyDelta || undefined,
      createdAt: now
    });

    if (args.success) {
      await ctx.db.insert("drawObligations", {
        participantId: args.participantId,
        activityType: "date",
        activityLabel: `Successful date: ${args.task}`,
        cardCount: 3,
        status: "pending",
        createdAt: now,
        updatedAt: now
      });
    }

    return eventId;
  }
});

export const recordQuizRewards = mutation({
  args: {
    adminToken: v.string(),
    label: v.string(),
    scores: v.array(
      v.object({
        teamId: v.id("teams"),
        score: v.number()
      })
    )
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const now = Date.now();
    const rewards = calculateQuizRewards(
      args.scores.map((score) => ({ teamId: score.teamId, score: score.score }))
    );

    for (const reward of rewards) {
      const team = await ctx.db.get(reward.teamId as Id<"teams">);
      if (!team) {
        continue;
      }

      for (const participantId of team.participantIds) {
        if (reward.rewardCards > 0) {
          await ctx.db.insert("drawObligations", {
            participantId,
            activityType: "quiz",
            activityLabel: `${args.label} - ${team.name}`,
            cardCount: reward.rewardCards,
            status: "pending",
            createdAt: now,
            updatedAt: now
          });
        }
      }
    }

    return await ctx.db.insert("events", {
      type: "quiz_rewards",
      actor: "admin",
      payload: {
        label: args.label,
        scores: args.scores,
        rewards
      },
      createdAt: now
    });
  }
});

export const recordMiniGameRewards = mutation({
  args: {
    adminToken: v.string(),
    label: v.string(),
    rewards: v.array(
      v.object({
        teamId: v.id("teams"),
        cardCount: v.number()
      })
    )
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const now = Date.now();

    for (const reward of args.rewards) {
      const team = await ctx.db.get(reward.teamId);
      if (!team) {
        continue;
      }

      for (const participantId of team.participantIds) {
        if (reward.cardCount > 0) {
          await ctx.db.insert("drawObligations", {
            participantId,
            activityType: "mini_game",
            activityLabel: `${args.label} - ${team.name}`,
            cardCount: reward.cardCount,
            status: "pending",
            createdAt: now,
            updatedAt: now
          });
        }
      }
    }

    return await ctx.db.insert("events", {
      type: "mini_game_rewards",
      actor: "admin",
      payload: args,
      createdAt: now
    });
  }
});

export const addTommieMoney = mutation({
  args: {
    adminToken: v.string(),
    source: v.string(),
    amount: v.number(),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const settings = await getOrCreateSettings(ctx);
    const now = Date.now();

    if (!settings._id) {
      throw new Error("Settings were not persisted.");
    }

    await ctx.db.patch(settings._id, {
      tommieMoney: settings.tommieMoney + args.amount,
      updatedAt: now
    });

    return await ctx.db.insert("events", {
      type: "tommie_money",
      actor: "admin",
      payload: {
        source: args.source,
        note: args.note,
        balanceBefore: settings.tommieMoney,
        balanceAfter: settings.tommieMoney + args.amount
      },
      moneyDelta: args.amount,
      createdAt: now
    });
  }
});
