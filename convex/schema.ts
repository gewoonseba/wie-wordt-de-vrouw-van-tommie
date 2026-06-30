import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const payoutValidator = v.object({
  hiddenTask: v.number(),
  jokerUse: v.number(),
  standardChallenge: v.number(),
  roundThreeWin: v.number(),
  dateMoment: v.number()
});

export default defineSchema({
  participants: defineTable({
    name: v.string(),
    photoStorageId: v.optional(v.id("_storage")),
    points: v.number(),
    canDate: v.boolean(),
    currentTeamId: v.optional(v.id("teams")),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_active", ["isActive"])
    .index("by_team", ["currentTeamId"]),

  teams: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    participantIds: v.array(v.id("participants")),
    createdAt: v.number(),
    updatedAt: v.number()
  }),

  participantTokens: defineTable({
    participantId: v.id("participants"),
    tokenHash: v.string(),
    revokedAt: v.optional(v.number()),
    createdAt: v.number(),
    lastUsedAt: v.optional(v.number())
  })
    .index("by_hash", ["tokenHash"])
    .index("by_participant", ["participantId"]),

  adminSessions: defineTable({
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number())
  }).index("by_hash", ["tokenHash"]),

  settings: defineTable({
    key: v.string(),
    tommieTarget: v.number(),
    tommieMoney: v.number(),
    defaultPayouts: payoutValidator,
    updatedAt: v.number()
  }).index("by_key", ["key"]),

  events: defineTable({
    type: v.string(),
    actor: v.string(),
    participantId: v.optional(v.id("participants")),
    teamId: v.optional(v.id("teams")),
    payload: v.any(),
    pointsDelta: v.optional(v.number()),
    moneyDelta: v.optional(v.number()),
    reversesEventId: v.optional(v.id("events")),
    createdAt: v.number()
  })
    .index("by_created", ["createdAt"])
    .index("by_participant", ["participantId"]),

  drawObligations: defineTable({
    participantId: v.id("participants"),
    activityType: v.string(),
    activityLabel: v.string(),
    cardCount: v.number(),
    status: v.union(v.literal("pending"), v.literal("resolved"), v.literal("void")),
    resolvedEventId: v.optional(v.id("events")),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_status", ["status"])
    .index("by_participant", ["participantId"]),

  activities: defineTable({
    type: v.string(),
    name: v.string(),
    status: v.string(),
    metadata: v.any(),
    createdAt: v.number(),
    updatedAt: v.number()
  })
});
