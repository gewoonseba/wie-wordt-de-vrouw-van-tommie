// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Id } from "../convex/_generated/dataModel";
import { DateEligibilityControl } from "@/components/admin/DateEligibilityControl";
import { MoneyAdjustmentForm } from "@/components/admin/MoneyAdjustmentForm";
import { ScoreAdjustmentForm } from "@/components/admin/ScoreAdjustmentForm";

const { useMutationMock } = vi.hoisted(() => ({
  useMutationMock: vi.fn()
}));

vi.mock("convex/react", () => ({
  useMutation: useMutationMock
}));

const participantId = "participant-1" as Id<"participants">;

afterEach(() => {
  cleanup();
  useMutationMock.mockReset();
});

describe("ScoreAdjustmentForm", () => {
  it("submits the exact score delta and renders the returned total", async () => {
    const adjustScore = vi.fn().mockResolvedValue({ points: 47 });
    useMutationMock.mockReturnValue(adjustScore);

    render(
      <ScoreAdjustmentForm
        adminToken="admin-token"
        currentScore={40}
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    fireEvent.change(screen.getByLabelText("Score adjustment"), {
      target: { value: "+7" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Adjust Noor" }));

    await waitFor(() => {
      expect(adjustScore).toHaveBeenCalledWith({
        adminToken: "admin-token",
        participantId,
        delta: 7
      });
    });
    expect(await screen.findByText("Saved: 47 points.")).toBeTruthy();
    expect((screen.getByLabelText("Score adjustment") as HTMLInputElement).value).toBe("");
  });

  it("allows only one in-flight submission", async () => {
    let resolveMutation!: (result: { points: number }) => void;
    const adjustScore = vi.fn().mockReturnValue(
      new Promise<{ points: number }>((resolve) => {
        resolveMutation = resolve;
      })
    );
    useMutationMock.mockReturnValue(adjustScore);

    render(
      <ScoreAdjustmentForm
        adminToken="admin-token"
        currentScore={40}
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    fireEvent.change(screen.getByLabelText("Score adjustment"), {
      target: { value: "5" }
    });
    const form = screen.getByRole("button", { name: "Adjust Noor" }).closest("form");
    if (!form) throw new Error("Expected score form.");

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(adjustScore).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving…" }).hasAttribute("disabled")).toBe(true);

    await act(async () => resolveMutation({ points: 45 }));
  });

  it("shows backend errors and delegates expired sessions", async () => {
    const onSessionExpired = vi.fn();
    const adjustScore = vi
      .fn()
      .mockRejectedValueOnce(new Error("Score service unavailable."))
      .mockRejectedValueOnce(new Error("Admin session is missing or expired."));
    useMutationMock.mockReturnValue(adjustScore);

    const view = render(
      <ScoreAdjustmentForm
        adminToken="admin-token"
        currentScore={40}
        onSessionExpired={onSessionExpired}
        participantId={participantId}
        participantName="Noor"
      />
    );

    const input = screen.getByLabelText("Score adjustment");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByText("Score service unavailable.")).toBeTruthy();

    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1));
    view.unmount();
  });
});

describe("other admin controls", () => {
  it("sends explicit date booleans in both directions", async () => {
    const setDateEligibility = vi.fn().mockResolvedValue({ canDate: true });
    useMutationMock.mockReturnValue(setDateEligibility);
    const props = {
      adminToken: "admin-token",
      onSessionExpired: vi.fn(),
      participantId,
      participantName: "Noor"
    };

    const view = render(<DateEligibilityControl {...props} canDate={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "May date Tommie" }));
    await waitFor(() => {
      expect(setDateEligibility).toHaveBeenLastCalledWith({
        adminToken: "admin-token",
        participantId,
        canDate: true
      });
    });

    view.rerender(<DateEligibilityControl {...props} canDate />);
    fireEvent.click(screen.getByRole("checkbox", { name: "May date Tommie" }));
    await waitFor(() => {
      expect(setDateEligibility).toHaveBeenLastCalledWith({
        adminToken: "admin-token",
        participantId,
        canDate: false
      });
    });
  });

  it("submits the exact money delta", async () => {
    const adjustMoney = vi.fn().mockResolvedValue({ tommieMoney: 1_750 });
    useMutationMock.mockReturnValue(adjustMoney);

    render(
      <MoneyAdjustmentForm
        adminToken="admin-token"
        currentTotal={1_500}
        onSessionExpired={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Money adjustment"), {
      target: { value: "+250" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Adjust pot" }));

    await waitFor(() => {
      expect(adjustMoney).toHaveBeenCalledWith({
        adminToken: "admin-token",
        delta: 250
      });
    });
    expect(await screen.findByText(/Saved:.*1\.750/)).toBeTruthy();
  });
});
