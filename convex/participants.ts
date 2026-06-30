import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./authTokens";

async function withPhotoUrl(ctx: any, participant: any) {
  return {
    ...participant,
    photoUrl: participant.photoStorageId
      ? await ctx.storage.getUrl(participant.photoStorageId)
      : null
  };
}

export const list = query({
  args: {
    adminToken: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    return await Promise.all(participants.map((participant) => withPhotoUrl(ctx, participant)));
  }
});

export const create = mutation({
  args: {
    adminToken: v.string(),
    name: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const now = Date.now();

    return await ctx.db.insert("participants", {
      name: args.name,
      points: 0,
      canDate: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const update = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    name: v.string(),
    currentTeamId: v.optional(v.id("teams")),
    canDate: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.participantId, {
      name: args.name,
      currentTeamId: args.currentTeamId,
      ...(args.canDate === undefined ? {} : { canDate: args.canDate }),
      updatedAt: Date.now()
    });
  }
});

export const setPhoto = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    storageId: v.id("_storage")
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.participantId, {
      photoStorageId: args.storageId,
      updatedAt: Date.now()
    });
  }
});

export const deactivate = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants")
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    await ctx.db.patch(args.participantId, {
      isActive: false,
      updatedAt: Date.now()
    });
  }
});
