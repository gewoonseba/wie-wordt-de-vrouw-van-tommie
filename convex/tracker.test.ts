/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";

import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";
import { hashToken } from "../src/lib/tokens";

const modules = import.meta.glob(["./**/*.ts", "./**/*.js"]);

const DEFAULT_PAYOUTS = {
  hiddenTask: 500,
  jokerUse: 500,
  standardChallenge: 500,
  roundThreeWin: 1000,
  dateMoment: 500
};

function createTest() {
  return convexTest(schema, modules);
}

async function seedAdminSession(t: ReturnType<typeof createTest>, token: string) {
  await t.run(async (ctx) => {
    await ctx.db.insert("adminSessions", {
      tokenHash: hashToken(token),
      createdAt: Date.now(),
      expiresAt: Date.now() + 60_000
    });
  });
}

async function seedParticipant(
  t: ReturnType<typeof createTest>,
  overrides: Partial<{
    name: string;
    points: number;
    canDate: boolean;
    isActive: boolean;
  }> = {}
) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("participants", {
      name: overrides.name ?? "Alice",
      points: overrides.points ?? 10,
      canDate: overrides.canDate ?? false,
      isActive: overrides.isActive ?? true,
      createdAt: now,
      updatedAt: now
    });
  });
}

describe("public scoreboard", () => {
  it("returns only active public participant state and the current money", async () => {
    const t = createTest();
    const activeId = await seedParticipant(t, { name: "Alice" });
    await seedParticipant(t, { name: "Inactive", isActive: false });
    await t.run(async (ctx) => {
      await ctx.db.insert("settings", {
        key: "event",
        tommieTarget: 10_000,
        tommieMoney: 1_500,
        defaultPayouts: DEFAULT_PAYOUTS,
        updatedAt: Date.now()
      });
    });

    const result = await t.query(api.scoreboard.get, {});

    expect(result).toEqual({
      participants: [
        expect.objectContaining({
          _id: activeId,
          name: "Alice",
          points: 10,
          canDate: false,
          photoUrl: null
        })
      ],
      tommieMoney: 1_500
    });
    expect(result.participants[0]).not.toHaveProperty("currentTeamId");
    expect(result.participants[0]).not.toHaveProperty("isActive");
  });

  it("returns zero money when the settings document does not exist", async () => {
    const t = createTest();

    await expect(t.query(api.scoreboard.get, {})).resolves.toEqual({
      participants: [],
      tommieMoney: 0
    });
  });

  it("rejects a roster larger than 100 instead of truncating it", async () => {
    const t = createTest();
    await t.run(async (ctx) => {
      const now = Date.now();
      for (let index = 0; index < 101; index += 1) {
        await ctx.db.insert("participants", {
          name: `Participant ${index}`,
          points: index,
          canDate: true,
          isActive: true,
          createdAt: now + index,
          updatedAt: now + index
        });
      }
    });

    await expect(t.query(api.scoreboard.get, {})).rejects.toThrow(
      "Scoreboard supports at most 100 active participants."
    );
  });
});

describe("participant roster", () => {
  it("seeds the preview roster once without duplicating participants", async () => {
    const t = createTest();

    await expect(t.mutation(api.seed.preview, {})).resolves.toEqual({
      created: 15,
      total: 15
    });
    await expect(t.mutation(api.seed.preview, {})).resolves.toEqual({
      created: 0,
      total: 15
    });

    const participants = await t.run(async (ctx) =>
      await ctx.db.query("participants").take(100)
    );
    expect(participants).toHaveLength(15);
    expect(participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Tommie", seedKey: "tommie", isActive: true })
      ])
    );
    const settings = await t.run(async (ctx) =>
      await ctx.db.query("settings").withIndex("by_key", (q) => q.eq("key", "event")).unique()
    );
    expect(settings?.tommieMoney).toBe(1_000);
  });

  it("lets an admin add and manage roster participants", async () => {
    const t = createTest();
    const token = "admin-session";
    await seedAdminSession(t, token);

    const participantId = await t.mutation(api.participants.create, {
      adminToken: token,
      name: "  New person  "
    });
    await t.mutation(api.participants.update, {
      adminToken: token,
      participantId,
      name: "Updated person",
      isActive: false
    });

    await expect(t.query(api.participants.listForAdmin, { adminToken: token })).resolves.toEqual([
      expect.objectContaining({
        _id: participantId,
        name: "Updated person",
        isActive: false,
        photoUrl: null
      })
    ]);
  });
});

describe("admin tracker mutations", () => {
  it("restores seeded values and clears custom participant state", async () => {
    const t = createTest();
    const token = "admin-session";
    await seedAdminSession(t, token);
    await t.mutation(api.seed.preview, {});
    const customParticipantId = await seedParticipant(t, {
      name: "Custom participant",
      points: 42,
      canDate: true
    });
    await t.run(async (ctx) => {
      const settings = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", "event"))
        .unique();
      if (!settings) {
        throw new Error("Settings missing from preview seed.");
      }
      await ctx.db.patch(settings._id, { tommieMoney: 3_500 });
      const tommie = await ctx.db
        .query("participants")
        .withIndex("by_seed_key", (q) => q.eq("seedKey", "tommie"))
        .unique();
      if (!tommie) {
        throw new Error("Tommie missing from preview seed.");
      }
      await ctx.db.patch(tommie._id, { points: 999, canDate: false });
    });

    await expect(
      t.mutation(api.trackerAdmin.resetToStartingState, { adminToken: token })
    ).resolves.toMatchObject({ tommieMoney: 1_000 });

    const result = await t.query(api.scoreboard.get, {});
    expect(result.tommieMoney).toBe(1_000);
    expect(result.participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Tommie", points: 80, canDate: true }),
        expect.objectContaining({
          _id: customParticipantId,
          points: 0,
          canDate: false
        })
      ])
    );
  });

  it("rejects tracker mutations after logout revokes the session", async () => {
    const t = createTest();
    const token = "admin-session";
    const participantId = await seedParticipant(t);
    await seedAdminSession(t, token);

    await t.mutation(api.authTokens.logout, { adminToken: token });

    await expect(
      t.mutation(api.trackerAdmin.adjustScore, {
        adminToken: token,
        participantId,
        delta: 1
      })
    ).rejects.toThrow("Admin session is missing or expired.");
  });

  it("applies signed score deltas transactionally", async () => {
    const t = createTest();
    const token = "admin-session";
    const participantId = await seedParticipant(t, { points: 10 });
    await seedAdminSession(t, token);

    await expect(
      t.mutation(api.trackerAdmin.adjustScore, {
        adminToken: token,
        participantId,
        delta: 5
      })
    ).resolves.toEqual({ points: 15 });
    await expect(
      t.mutation(api.trackerAdmin.adjustScore, {
        adminToken: token,
        participantId,
        delta: -3
      })
    ).resolves.toEqual({ points: 12 });
  });

  it.each([0, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid score delta %s",
    async (delta) => {
      const t = createTest();
      const token = "admin-session";
      const participantId = await seedParticipant(t);
      await seedAdminSession(t, token);

      await expect(
        t.mutation(api.trackerAdmin.adjustScore, {
          adminToken: token,
          participantId,
          delta
        })
      ).rejects.toThrow();
    }
  );

  it("rejects a score correction below zero without changing state", async () => {
    const t = createTest();
    const token = "admin-session";
    const participantId = await seedParticipant(t, { points: 2 });
    await seedAdminSession(t, token);

    await expect(
      t.mutation(api.trackerAdmin.adjustScore, {
        adminToken: token,
        participantId,
        delta: -3
      })
    ).rejects.toThrow("Score cannot be negative.");
    const participant = await t.run(async (ctx) => ctx.db.get(participantId));
    expect(participant?.points).toBe(2);
  });

  it("sets date eligibility explicitly and idempotently", async () => {
    const t = createTest();
    const token = "admin-session";
    const participantId = await seedParticipant(t, { canDate: false });
    await seedAdminSession(t, token);

    await expect(
      t.mutation(api.trackerAdmin.setDateEligibility, {
        adminToken: token,
        participantId,
        canDate: true
      })
    ).resolves.toEqual({ canDate: true });
    const eligibleParticipant = await t.run((ctx) => ctx.db.get(participantId));
    expect(eligibleParticipant?.canDate).toBe(true);

    await expect(
      t.mutation(api.trackerAdmin.setDateEligibility, {
        adminToken: token,
        participantId,
        canDate: false
      })
    ).resolves.toEqual({ canDate: false });
    const ineligibleParticipant = await t.run((ctx) => ctx.db.get(participantId));
    expect(ineligibleParticipant?.canDate).toBe(false);

    await expect(
      t.mutation(api.trackerAdmin.setDateEligibility, {
        adminToken: token,
        participantId,
        canDate: false
      })
    ).resolves.toEqual({ canDate: false });
    const repeatedParticipant = await t.run((ctx) => ctx.db.get(participantId));
    expect(repeatedParticipant?.canDate).toBe(false);
    expect(repeatedParticipant?.updatedAt).toBe(ineligibleParticipant?.updatedAt);
  });

  it("creates settings on the first valid money adjustment", async () => {
    const t = createTest();
    const token = "admin-session";
    await seedAdminSession(t, token);

    await expect(
      t.mutation(api.trackerAdmin.adjustMoney, {
        adminToken: token,
        delta: 500
      })
    ).resolves.toEqual({ tommieMoney: 500 });
    await expect(
      t.mutation(api.trackerAdmin.adjustMoney, {
        adminToken: token,
        delta: -200
      })
    ).resolves.toEqual({ tommieMoney: 300 });
  });

  it("rejects invalid, below-zero, and unauthorized money adjustments", async () => {
    const t = createTest();
    const token = "admin-session";
    await seedAdminSession(t, token);

    await expect(
      t.mutation(api.trackerAdmin.adjustMoney, {
        adminToken: token,
        delta: 0
      })
    ).rejects.toThrow();
    await expect(
      t.mutation(api.trackerAdmin.adjustMoney, {
        adminToken: token,
        delta: -1
      })
    ).rejects.toThrow("Money total cannot be negative.");
    await expect(
      t.mutation(api.trackerAdmin.adjustMoney, {
        adminToken: "invalid",
        delta: 10
      })
    ).rejects.toThrow("Admin session is missing or expired.");
  });
});
