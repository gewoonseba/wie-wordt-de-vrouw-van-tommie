// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
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

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: ComponentProps<"div">) => (
    <div {...props}>{children}</div>
  ),
  AvatarImage: (props: ComponentProps<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
  AvatarFallback: ({ children, ...props }: ComponentProps<"span">) => (
    <span {...props}>{children}</span>
  )
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

    expect(
      screen.getByRole("heading", { name: "Wie Wordt de Vrouw van Tommie" })
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Het podium" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Volledige stand" })).toBeTruthy();
    expect(screen.getAllByText("Noor")).toHaveLength(2);
    expect(screen.getAllByText("Lisa")).toHaveLength(2);
    expect(screen.getAllByText("Mag op date").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Geen date").length).toBeGreaterThan(0);
    expect(screen.getByText("ACTIVATED")).toBeTruthy();
    expect(document.querySelector(".crt-toggle")?.classList.contains("is-active")).toBe(true);
    expect(document.querySelector(".crt-date-count")?.textContent).toContain(
      "3 DATE SIGNALS"
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

  it("opens and closes a Windows-style participant detail window", async () => {
    let queryResult = populatedScoreboard();
    useQueryMock.mockImplementation(() => queryResult);

    const view = render(<ScoreboardClient />);

    fireEvent.click(screen.getAllByRole("button", { name: "Bekijk Noor" })[0]);

    const dialog = screen.getByRole("dialog", { name: "Noor details" });
    expect(dialog).toBeTruthy();
    expect(screen.getByText("50 POINTS")).toBeTruthy();
    expect(screen.getByText("GEEN DATE MET TOMMIE")).toBeTruthy();

    queryResult = {
      ...queryResult,
      participants: queryResult.participants.map((participant) =>
        participant._id === "noor"
          ? { ...participant, points: 77, canDate: true }
          : participant
      )
    };
    view.rerender(<ScoreboardClient />);
    expect(screen.getByText("77 POINTS")).toBeTruthy();
    expect(screen.getByText("MAG OP DATE MET TOMMIE")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "Bekijk Lisa" })[0]);
    expect(screen.getByRole("dialog", { name: "Lisa details" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sluit details" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Bekijk Mia" }));
    expect(screen.getByRole("dialog", { name: "Mia details" })).toBeTruthy();
    expect(screen.getByText("RANK #04")).toBeTruthy();
    expect(screen.getByText("20 POINTS")).toBeTruthy();
    expect(screen.getByText("MAG OP DATE MET TOMMIE")).toBeTruthy();
    expect(screen.getByAltText("Portret van Mia").getAttribute("src")).toBe("/mia.png");
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Bekijk Mia" }));
    fireEvent.mouseDown(document.querySelector(".crt-modal-backdrop")!);
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Bekijk Mia" }));
    queryResult = {
      ...queryResult,
      participants: queryResult.participants.filter(
        (participant) => participant._id !== "mia"
      )
    };
    view.rerender(<ScoreboardClient />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await act(async () => Promise.resolve());

    queryResult = populatedScoreboard();
    view.rerender(<ScoreboardClient />);
    expect(screen.queryByRole("dialog")).toBeNull();
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
      },
      {
        _id: "mia",
        name: "Mia",
        photoUrl: "/mia.png",
        points: 20,
        canDate: true,
        createdAt: 4
      }
    ],
    tommieMoney: 1_500
  };
}
