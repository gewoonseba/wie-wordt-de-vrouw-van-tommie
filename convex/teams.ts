import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./authTokens";

export const list = query({
  args: {
    adminToken: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    return await ctx.db.query("teams").collect();
  }
});

export const create = mutation({
  args: {
    adminToken: v.string(),
    name: v.string(),
    color: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const now = Date.now();

    return await ctx.db.insert("teams", {
      name: args.name,
      color: args.color,
      participantIds: [],
      createdAt: now,
      updatedAt: now
    });
  }
});

export const updateMembers = mutation({
  args: {
    adminToken: v.string(),
    teamId: v.id("teams"),
    participantIds: v.array(v.id("participants"))
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const now = Date.now();

    await ctx.db.patch(args.teamId, {
      participantIds: args.participantIds,
      updatedAt: now
    });

    const participants = await ctx.db.query("participants").collect();
    for (const participant of participants) {
      const shouldBelong = args.participantIds.includes(participant._id);
      if (participant.currentTeamId === args.teamId || shouldBelong) {
        await ctx.db.patch(participant._id, {
          currentTeamId: shouldBelong ? args.teamId : undefined,
          updatedAt: now
        });
      }
    }
  }
});
