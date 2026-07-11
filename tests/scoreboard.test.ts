import { describe, expect, it } from "vitest";

import {
  formatEuro,
  getMoneyPileLayerCount,
  rankParticipants,
  selectPodium,
  type ScoreboardParticipant
} from "@/lib/scoreboard";

function participant(
  overrides: Partial<ScoreboardParticipant> & Pick<ScoreboardParticipant, "_id">
): ScoreboardParticipant {
  return {
    name: overrides._id,
    photoUrl: null,
    points: 0,
    canDate: false,
    createdAt: 1,
    ...overrides
  };
}

describe("scoreboard ranking", () => {
  it("orders by points, creation time, and id without mutating the input", () => {
    const input = [
      participant({ _id: "charlie", points: 20, createdAt: 1 }),
      participant({ _id: "bravo", points: 20, createdAt: 1 }),
      participant({ _id: "alpha", points: 10, createdAt: 0 }),
      participant({ _id: "delta", points: 20, createdAt: 2 })
    ];

    expect(rankParticipants(input).map(({ _id }) => _id)).toEqual([
      "bravo",
      "charlie",
      "delta",
      "alpha"
    ]);
    expect(input.map(({ _id }) => _id)).toEqual([
      "charlie",
      "bravo",
      "alpha",
      "delta"
    ]);
  });

  it("selects at most three real participants in ranking order", () => {
    const ranked = rankParticipants([
      participant({ _id: "fourth", points: 10 }),
      participant({ _id: "first", points: 40 }),
      participant({ _id: "third", points: 20 }),
      participant({ _id: "second", points: 30 })
    ]);

    expect(selectPodium(ranked).map(({ _id }) => _id)).toEqual([
      "first",
      "second",
      "third"
    ]);
    expect(selectPodium(ranked.slice(0, 2))).toHaveLength(2);
    expect(selectPodium([])).toEqual([]);
  });
});

describe("money pile", () => {
  it.each([
    [0, 0],
    [1, 1],
    [499, 1],
    [500, 1],
    [501, 2],
    [10_000, 20],
    [100_000, 20]
  ])("maps EUR %i to %i bounded layers", (amount, expectedLayers) => {
    expect(getMoneyPileLayerCount(amount)).toBe(expectedLayers);
  });

  it("defensively treats negative and non-finite totals as an empty pile", () => {
    expect(getMoneyPileLayerCount(-1)).toBe(0);
    expect(getMoneyPileLayerCount(Number.NaN)).toBe(0);
    expect(getMoneyPileLayerCount(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("formats the authoritative amount as localized whole EUR", () => {
    expect(formatEuro(100_000)).toBe(
      new Intl.NumberFormat("nl-BE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
      }).format(100_000)
    );
  });
});
