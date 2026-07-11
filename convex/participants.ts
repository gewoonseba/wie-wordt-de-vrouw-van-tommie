import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./authTokens";

const MAX_PARTICIPANTS = 100;

function assertParticipantName(name: string) {
  if (name.trim().length === 0 || name.trim().length > 80) {
    throw new Error("Participant name must contain between 1 and 80 characters.");
  }
}

export const listForAdmin = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const participants = await ctx.db.query("participants").take(MAX_PARTICIPANTS + 1);

    if (participants.length > MAX_PARTICIPANTS) {
      throw new Error(`Participant management supports at most ${MAX_PARTICIPANTS} participants.`);
    }

    return await Promise.all(
      participants.map(async (participant) => ({
        _id: participant._id,
        name: participant.name,
        points: participant.points,
        canDate: participant.canDate,
        isActive: participant.isActive,
        photoUrl: participant.photoStorageId
          ? await ctx.storage.getUrl(participant.photoStorageId)
          : (participant.previewPhotoPath ?? null)
      }))
    );
  }
});

export const create = mutation({
  args: {
    adminToken: v.string(),
    name: v.string(),
    photoStorageId: v.optional(v.id("_storage"))
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const name = args.name.trim();
    assertParticipantName(name);

    const existing = await ctx.db.query("participants").take(MAX_PARTICIPANTS + 1);
    if (existing.length >= MAX_PARTICIPANTS) {
      throw new Error(`Participant management supports at most ${MAX_PARTICIPANTS} participants.`);
    }

    const now = Date.now();
    return await ctx.db.insert("participants", {
      name,
      photoStorageId: args.photoStorageId,
      points: 0,
      canDate: false,
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
    isActive: v.boolean(),
    photoStorageId: v.optional(v.id("_storage"))
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const participant = await ctx.db.get(args.participantId);
    if (!participant) {
      throw new Error("Participant not found.");
    }

    const name = args.name.trim();
    assertParticipantName(name);
    const patch: {
      name: string;
      isActive: boolean;
      photoStorageId?: typeof args.photoStorageId;
      updatedAt: number;
    } = {
      name,
      isActive: args.isActive,
      updatedAt: Date.now()
    };
    if (args.photoStorageId) {
      patch.photoStorageId = args.photoStorageId;
    }
    await ctx.db.patch(participant._id, patch);
  }
});

export const upsertRosterEntry = mutation({
  args: {
    adminToken: v.string(),
    name: v.string(),
    seedKey: v.string(),
    photoStorageId: v.id("_storage"),
    initialPoints: v.number(),
    initialCanDate: v.boolean()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const name = args.name.trim();
    assertParticipantName(name);
    const seedKey = args.seedKey.trim().toLowerCase();
    if (seedKey.length === 0) {
      throw new Error("Participant seed key is required.");
    }
    if (!Number.isSafeInteger(args.initialPoints) || args.initialPoints < 0) {
      throw new Error("Initial score must be a non-negative safe integer.");
    }

    const existing = await ctx.db
      .query("participants")
      .withIndex("by_seed_key", (q) => q.eq("seedKey", seedKey))
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name,
        photoStorageId: args.photoStorageId,
        updatedAt: now
      });
      return existing._id;
    }

    const allParticipants = await ctx.db.query("participants").take(MAX_PARTICIPANTS + 1);
    if (allParticipants.length >= MAX_PARTICIPANTS) {
      throw new Error(`Participant management supports at most ${MAX_PARTICIPANTS} participants.`);
    }

    return await ctx.db.insert("participants", {
      name,
      seedKey,
      photoStorageId: args.photoStorageId,
      points: args.initialPoints,
      canDate: args.initialCanDate,
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const generatePhotoUploadUrl = mutation({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    return await ctx.storage.generateUploadUrl();
  }
});
