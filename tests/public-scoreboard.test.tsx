// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ParticipantPage from "@/app/p/[token]/page";
import { ScoreboardClient } from "@/components/scoreboard/ScoreboardClient";

const { redirectMock, useQueryMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  useQueryMock: vi.fn()
}));

vi.mock("convex/react", () => ({
  useQuery: useQueryMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

afterEach(() => {
  cleanup();
  redirectMock.mockReset();
  useQueryMock.mockReset();
});

describe("ScoreboardClient", () => {
  it("renders loading, then the ranked podium, full ranking, money, and date states", () => {
    let queryResult: ReturnType<typeof populatedScoreboard> | undefined;
    useQueryMock.mockImplementation(() => queryResult);
    const view = render(<ScoreboardClient />);

    expect(screen.getByRole("heading", { name: "De live stand komt eraan…" })).toBeTruthy();

    queryResult = populatedScoreboard();
    view.rerender(<ScoreboardClient />);

    expect(screen.getByRole("heading", { name: "Het podium" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Volledige stand" })).toBeTruthy();
    expect(screen.getAllByText("Noor")).toHaveLength(2);
    expect(screen.getAllByText("Lisa")).toHaveLength(2);
    expect(screen.getAllByText("Mag op date").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Geen date").length).toBeGreaterThan(0);
    expect(screen.getByText("ACTIVATED")).toBeTruthy();
    expect(document.querySelector(".crt-toggle")?.classList.contains("is-active")).toBe(true);
    expect(document.querySelector(".crt-date-count")?.textContent).toContain(
      "2 DATE SIGNALS"
    );
    expect(screen.getByText(/€.*1\.500/)).toBeTruthy();

    queryResult = {
      ...queryResult,
      participants: queryResult.participants.map((participant) =>
        participant._id === "noor" ? { ...participant, points: 55 } : participant
      ),
      tommieMoney: 2_000
    };
    view.rerender(<ScoreboardClient />);

    expect(screen.getByText(/€.*2\.000/)).toBeTruthy();
    expect(screen.getAllByText("55").length).toBeGreaterThan(0);
  });

  it("renders intentional empty states", () => {
    useQueryMock.mockReturnValue({ participants: [], tommieMoney: 0 });

    render(<ScoreboardClient />);

    expect(screen.getByRole("heading", { name: "Het podium staat klaar" })).toBeTruthy();
    expect(screen.getByText("Er zijn nog geen actieve deelnemers.")).toBeTruthy();
    expect(screen.getByText("De pot is nog leeg.")).toBeTruthy();
    expect(screen.getByText("STANDBY")).toBeTruthy();
    expect(document.querySelector(".crt-toggle")?.classList.contains("is-active")).toBe(false);
    expect(document.querySelector(".crt-date-count")?.textContent).toContain(
      "0 DATE SIGNALS"
    );
  });
});

describe("legacy participant route", () => {
  it("redirects to the public scoreboard without reading a token", () => {
    ParticipantPage();

    expect(redirectMock).toHaveBeenCalledWith("/");
    expect(redirectMock).toHaveBeenCalledTimes(1);
  });
});

function populatedScoreboard() {
  return {
    participants: [
      {
        _id: "lisa",
        name: "Lisa",
        photoUrl: null,
        points: 40,
        canDate: true,
        createdAt: 2
      },
      {
        _id: "noor",
        name: "Noor",
        photoUrl: null,
        points: 50,
        canDate: false,
        createdAt: 1
      },
      {
        _id: "ada",
        name: "Ada",
        photoUrl: null,
        points: 30,
        canDate: true,
        createdAt: 3
      }
    ],
    tommieMoney: 1_500
  };
}
