import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation } from "./_generated/server";
import { hashToken } from "../src/lib/tokens";

const DEFAULT_ADMIN_PASSCODE = "tommie-admin";
const DEFAULT_SESSION_TTL_HOURS = 12;

export async function assertAdmin(
  ctx: QueryCtx | MutationCtx,
  adminToken: string
) {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_hash", (q) => q.eq("tokenHash", hashToken(adminToken)))
    .unique();

  if (!session || session.revokedAt || session.expiresAt < Date.now()) {
    throw new Error("Admin session is missing or expired.");
  }

  return session;
}

export async function participantIdForToken(
  ctx: QueryCtx | MutationCtx,
  token: string
) {
  const tokenRecord = await ctx.db
    .query("participantTokens")
    .withIndex("by_hash", (q) => q.eq("tokenHash", hashToken(token)))
    .unique();

  if (!tokenRecord || tokenRecord.revokedAt) {
    return null;
  }

  return tokenRecord.participantId;
}

export const login = mutation({
  args: {
    passcode: v.string(),
    sessionToken: v.string()
  },
  handler: async (ctx, args) => {
    const expectedPasscode = process.env.ADMIN_PASSCODE ?? DEFAULT_ADMIN_PASSCODE;

    if (args.passcode !== expectedPasscode) {
      throw new Error("Invalid admin passcode.");
    }

    const ttlHours = Number(
      process.env.ADMIN_SESSION_TTL_HOURS ?? DEFAULT_SESSION_TTL_HOURS
    );
    const now = Date.now();

    await ctx.db.insert("adminSessions", {
      tokenHash: hashToken(args.sessionToken),
      createdAt: now,
      expiresAt: now + ttlHours * 60 * 60 * 1000
    });

    return { ok: true };
  }
});

export const logout = mutation({
  args: {
    adminToken: v.string()
  },
  handler: async (ctx, args) => {
    const session = await assertAdmin(ctx, args.adminToken);
    await ctx.db.patch(session._id, { revokedAt: Date.now() });
  }
});

export const createParticipantToken = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants"),
    rawToken: v.string()
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);

    const now = Date.now();
    const existing = await ctx.db
      .query("participantTokens")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect();

    for (const token of existing) {
      if (!token.revokedAt) {
        await ctx.db.patch(token._id, { revokedAt: now });
      }
    }

    await ctx.db.insert("participantTokens", {
      participantId: args.participantId,
      tokenHash: hashToken(args.rawToken),
      createdAt: now
    });
  }
});

export const revokeParticipantTokens = mutation({
  args: {
    adminToken: v.string(),
    participantId: v.id("participants")
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminToken);
    const now = Date.now();
    const tokens = await ctx.db
      .query("participantTokens")
      .withIndex("by_participant", (q) => q.eq("participantId", args.participantId))
      .collect();

    for (const token of tokens) {
      if (!token.revokedAt) {
        await ctx.db.patch(token._id, { revokedAt: now });
      }
    }
  }
});
