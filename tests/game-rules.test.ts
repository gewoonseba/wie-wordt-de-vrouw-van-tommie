import { describe, expect, it } from "vitest";
import {
  calculateQuizRewards,
  consumeDateFlag,
  expandTeamRewardToParticipants,
  scoreCard,
  scoreCardDraw
} from "@/lib/game-rules";

describe("card scoring", () => {
  it("scores number cards by face value", () => {
    expect(scoreCard("7")).toEqual({
      rank: "7",
      points: 7,
      isDateCard: false
    });
  });

  it("scores face cards and aces as 10 point date cards", () => {
    for (const rank of ["A", "J", "Q", "K"] as const) {
      expect(scoreCard(rank)).toEqual({
        rank,
        points: 10,
        isDateCard: true
      });
    }
  });

  it("stacks date card points while only setting canDate true once", () => {
    expect(scoreCardDraw(["A", "7", "K"], false)).toEqual({
      cards: [
        { rank: "A", points: 10, isDateCard: true },
        { rank: "7", points: 7, isDateCard: false },
        { rank: "K", points: 10, isDateCard: true }
      ],
      pointsAwarded: 27,
      dateCardsDrawn: 2,
      canDateAfter: true
    });
  });

  it("preserves canDate when no date card is drawn", () => {
    expect(scoreCardDraw(["2", "3"], false).canDateAfter).toBe(false);
    expect(scoreCardDraw(["2", "3"], true).canDateAfter).toBe(true);
  });
});

describe("date eligibility", () => {
  it("consumes a true date flag", () => {
    expect(consumeDateFlag(true)).toBe(false);
  });

  it("rejects date start when canDate is false", () => {
    expect(() => consumeDateFlag(false)).toThrow("cannot start a date");
  });
});

describe("quiz rewards", () => {
  it("rewards normal ranking as 3 / 2 / 1", () => {
    expect(
      calculateQuizRewards([
        { teamId: "a", score: 9 },
        { teamId: "b", score: 7 },
        { teamId: "c", score: 4 }
      ])
    ).toEqual([
      { teamId: "a", rewardCards: 3, rank: 1, tiedTeamIds: ["a"] },
      { teamId: "b", rewardCards: 2, rank: 2, tiedTeamIds: ["b"] },
      { teamId: "c", rewardCards: 1, rank: 3, tiedTeamIds: ["c"] }
    ]);
  });

  it("floors a three-way tie to 2 / 2 / 2", () => {
    expect(
      calculateQuizRewards([
        { teamId: "a", score: 8 },
        { teamId: "b", score: 8 },
        { teamId: "c", score: 8 }
      ]).map((reward) => reward.rewardCards)
    ).toEqual([2, 2, 2]);
  });

  it("floors a two-way tie for first to 2 / 2 / 1", () => {
    expect(
      calculateQuizRewards([
        { teamId: "a", score: 8 },
        { teamId: "b", score: 8 },
        { teamId: "c", score: 5 }
      ]).map((reward) => reward.rewardCards)
    ).toEqual([2, 2, 1]);
  });

  it("floors a two-way tie for second to 3 / 1 / 1", () => {
    expect(
      calculateQuizRewards([
        { teamId: "a", score: 10 },
        { teamId: "b", score: 8 },
        { teamId: "c", score: 8 }
      ]).map((reward) => reward.rewardCards)
    ).toEqual([3, 1, 1]);
  });
});

describe("team reward expansion", () => {
  it("creates one draw obligation per participant", () => {
    expect(expandTeamRewardToParticipants(["p1", "p2"], 3)).toEqual([
      { participantId: "p1", cardCount: 3 },
      { participantId: "p2", cardCount: 3 }
    ]);
  });
});
