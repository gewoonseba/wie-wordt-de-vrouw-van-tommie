// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Id } from "../convex/_generated/dataModel";
import { DateCompletedButton } from "@/components/admin/DateCompletedButton";
import { DateEligibilityControl } from "@/components/admin/DateEligibilityControl";
import { MoneyAdjustmentForm } from "@/components/admin/MoneyAdjustmentForm";
import { ParticipantManager } from "@/components/admin/ParticipantManager";
import { ScoreAdjustmentForm } from "@/components/admin/ScoreAdjustmentForm";
import { StartNewGameButton } from "@/components/admin/StartNewGameButton";
import { useDateEligibilityMutation } from "@/components/admin/useDateEligibilityMutation";

const { useMutationMock } = vi.hoisted(() => ({
  useMutationMock: vi.fn()
}));

vi.mock("convex/react", () => ({
  useMutation: useMutationMock
}));

const participantId = "participant-1" as Id<"participants">;

type DateControlHarnessProps = {
  adminToken: string;
  canDate: boolean;
  onSessionExpired: () => void;
  participantId: Id<"participants">;
  participantName: string;
};

function DateCompletedButtonHarness({
  adminToken,
  canDate,
  onSessionExpired,
  participantId,
  participantName
}: DateControlHarnessProps) {
  const dateEligibility = useDateEligibilityMutation({
    adminToken,
    onSessionExpired,
    participantId
  });

  return (
    <DateCompletedButton
      canDate={canDate}
      dateEligibility={dateEligibility}
      participantName={participantName}
    />
  );
}

function DateEligibilityControlHarness({
  adminToken,
  canDate,
  onSessionExpired,
  participantId,
  participantName
}: DateControlHarnessProps) {
  const dateEligibility = useDateEligibilityMutation({
    adminToken,
    onSessionExpired,
    participantId
  });

  return (
    <DateEligibilityControl
      canDate={canDate}
      dateEligibility={dateEligibility}
      participantId={participantId}
      participantName={participantName}
    />
  );
}

function SharedDateControlsHarness(props: DateControlHarnessProps) {
  const dateEligibility = useDateEligibilityMutation({
    adminToken: props.adminToken,
    onSessionExpired: props.onSessionExpired,
    participantId: props.participantId
  });

  return (
    <>
      <DateCompletedButton
        canDate={props.canDate}
        dateEligibility={dateEligibility}
        participantName={props.participantName}
      />
      <DateEligibilityControl
        canDate={false}
        dateEligibility={dateEligibility}
        participantId={props.participantId}
        participantName={props.participantName}
      />
    </>
  );
}

type ScoreAdjustmentFormHarnessProps = Omit<
  ComponentProps<typeof ScoreAdjustmentForm>,
  "dateEligibility"
>;

function ScoreAdjustmentFormHarness(props: ScoreAdjustmentFormHarnessProps) {
  const dateEligibility = useDateEligibilityMutation({
    adminToken: props.adminToken,
    onSessionExpired: props.onSessionExpired,
    participantId: props.participantId
  });

  return (
    <>
      <DateCompletedButton
        canDate={props.canDate}
        dateEligibility={dateEligibility}
        participantName={props.participantName}
      />
      <ScoreAdjustmentForm {...props} dateEligibility={dateEligibility} />
    </>
  );
}

afterEach(() => {
  cleanup();
  useMutationMock.mockReset();
  vi.restoreAllMocks();
});

describe("DateCompletedButton", () => {
  it("marks an eligible participant's date as completed", async () => {
    const setDateEligibility = vi.fn().mockResolvedValue({ canDate: false });
    useMutationMock.mockReturnValue(setDateEligibility);

    render(
      <DateCompletedButtonHarness
        adminToken="admin-token"
        canDate
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Date gehad met Noor" }));

    await waitFor(() => {
      expect(setDateEligibility).toHaveBeenCalledWith({
        adminToken: "admin-token",
        participantId,
        canDate: false
      });
    });
  });

  it("allows only one in-flight date completion", async () => {
    let resolveMutation!: (result: { canDate: false }) => void;
    const setDateEligibility = vi.fn().mockReturnValue(
      new Promise<{ canDate: false }>((resolve) => {
        resolveMutation = resolve;
      })
    );
    useMutationMock.mockReturnValue(setDateEligibility);

    render(
      <DateCompletedButtonHarness
        adminToken="admin-token"
        canDate
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );
    const button = screen.getByRole("button", { name: "Date gehad met Noor" });

    await act(async () => {
      button.click();
      button.click();
    });

    expect(setDateEligibility).toHaveBeenCalledTimes(1);
    await act(async () => resolveMutation({ canDate: false }));
  });

  it("allows only one in-flight date update across quick and manual controls", async () => {
    let resolveMutation!: (result: { canDate: false }) => void;
    const setDateEligibility = vi.fn().mockReturnValue(
      new Promise<{ canDate: false }>((resolve) => {
        resolveMutation = resolve;
      })
    );
    useMutationMock.mockReturnValue(setDateEligibility);

    render(
      <SharedDateControlsHarness
        adminToken="admin-token"
        canDate
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Date gehad met Noor" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Date gehad met Noor" }).hasAttribute("disabled"))
        .toBe(true);
      expect(screen.getByRole("checkbox", { name: "May date Tommie" }).getAttribute("aria-disabled"))
        .toBe("true");
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "May date Tommie" }));

    expect(setDateEligibility).toHaveBeenCalledTimes(1);
    expect(setDateEligibility).toHaveBeenCalledWith({
      adminToken: "admin-token",
      participantId,
      canDate: false
    });
    await act(async () => resolveMutation({ canDate: false }));
  });

  it("is disabled when the participant already completed a date", () => {
    useMutationMock.mockReturnValue(vi.fn());

    render(
      <DateCompletedButtonHarness
        adminToken="admin-token"
        canDate={false}
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    expect(screen.getByRole("button", { name: "Date geregistreerd voor Noor" }).hasAttribute("disabled"))
      .toBe(true);
  });

  it("shows ordinary errors and delegates expired sessions", async () => {
    const onSessionExpired = vi.fn();
    const setDateEligibility = vi
      .fn()
      .mockRejectedValueOnce(new Error("Date service unavailable."))
      .mockRejectedValueOnce(new Error("Admin session is missing or expired."));
    useMutationMock.mockReturnValue(setDateEligibility);

    render(
      <DateCompletedButtonHarness
        adminToken="admin-token"
        canDate
        onSessionExpired={onSessionExpired}
        participantId={participantId}
        participantName="Noor"
      />
    );
    const button = screen.getByRole("button", { name: "Date gehad met Noor" });

    fireEvent.click(button);
    expect(await screen.findByText("Date service unavailable.")).toBeTruthy();

    fireEvent.click(button);
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledOnce());
  });

  it("shows a fallback for non-Error failures", async () => {
    useMutationMock.mockReturnValue(vi.fn().mockRejectedValue("offline"));

    render(
      <DateCompletedButtonHarness
        adminToken="admin-token"
        canDate
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Date gehad met Noor" }));

    expect(await screen.findByText("Date status failed.")).toBeTruthy();
  });
});

describe("StartNewGameButton", () => {
  it("confirms and starts a new game with the admin token", async () => {
    const startNewGame = vi.fn().mockResolvedValue({ participantCount: 15, tommieMoney: 0 });
    useMutationMock.mockReturnValue(startNewGame);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <StartNewGameButton adminToken="admin-token" onSessionExpired={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel starten" }));

    await waitFor(() => {
      expect(startNewGame).toHaveBeenCalledWith({ adminToken: "admin-token" });
    });
  });

  it("does not start without confirmation", () => {
    const startNewGame = vi.fn();
    useMutationMock.mockReturnValue(startNewGame);
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(
      <StartNewGameButton adminToken="admin-token" onSessionExpired={vi.fn()} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel starten" }));

    expect(startNewGame).not.toHaveBeenCalled();
  });

  it("delegates expired sessions without showing a local error", async () => {
    const onSessionExpired = vi.fn();
    const startNewGame = vi
      .fn()
      .mockRejectedValue(new Error("Admin session is missing or expired."));
    useMutationMock.mockReturnValue(startNewGame);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <StartNewGameButton
        adminToken="admin-token"
        onSessionExpired={onSessionExpired}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Nieuw spel starten" }));

    await waitFor(() => {
      expect(onSessionExpired).toHaveBeenCalledOnce();
    });
    expect(screen.queryByText("Admin session is missing or expired.")).toBeNull();
  });
});

describe("ScoreAdjustmentForm", () => {
  it("offers a full set of scoring ranks and restores date eligibility for quick plays", async () => {
    const adjustScore = vi.fn().mockResolvedValue({ points: 47 });
    const playCard = vi.fn().mockResolvedValue({ points: 50, canDate: true });
    useMutationMock
      .mockReturnValueOnce(vi.fn())
      .mockReturnValueOnce(adjustScore)
      .mockReturnValueOnce(playCard)
      .mockReturnValue(vi.fn());

    render(
      <ScoreAdjustmentFormHarness
        adminToken="admin-token"
        canDate={false}
        currentScore={40}
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    expect(screen.queryByLabelText("Score adjustment")).toBeNull();
    expect(screen.queryByRole("checkbox", { name: "May date Tommie" })).toBeNull();
    for (const value of [2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      expect(screen.getByRole("button", { name: `Play ${value} for ${value} points` })).toBeTruthy();
    }
    for (const rank of ["ace", "jack", "queen", "king"]) {
      expect(screen.getByRole("button", { name: `Play ${rank} for 10 points` })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "Play jack for 10 points" }));

    await waitFor(() => {
      expect(playCard).toHaveBeenCalledWith({
        adminToken: "admin-token",
        participantId,
        points: 10
      });
    });
    expect(adjustScore).not.toHaveBeenCalled();
    expect(screen.queryByText(/Saved:/)).toBeNull();
  });

  it("keeps exact score and date controls inside manual correction", async () => {
    const adjustScore = vi.fn().mockResolvedValue({ points: 47 });
    useMutationMock.mockReturnValue(adjustScore);

    render(
      <ScoreAdjustmentFormHarness
        adminToken="admin-token"
        canDate={false}
        currentScore={40}
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Manual correction" }));
    expect(screen.getByRole("checkbox", { name: "May date Tommie" })).toBeTruthy();
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
    expect(screen.queryByText(/Saved:/)).toBeNull();
    expect(screen.queryByLabelText("Score adjustment")).toBeNull();
  });

  it("allows only one in-flight quick-card submission", async () => {
    let resolveMutation!: (result: { points: number; canDate: true }) => void;
    const playCard = vi.fn().mockReturnValue(
      new Promise<{ points: number; canDate: true }>((resolve) => {
        resolveMutation = resolve;
      })
    );
    useMutationMock
      .mockReturnValueOnce(vi.fn())
      .mockReturnValueOnce(vi.fn())
      .mockReturnValueOnce(playCard)
      .mockReturnValue(vi.fn());

    render(
      <ScoreAdjustmentFormHarness
        adminToken="admin-token"
        canDate={false}
        currentScore={40}
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Play 2 for 2 points" }));
    fireEvent.click(screen.getByRole("button", { name: "Play 3 for 3 points" }));

    expect(playCard).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Play 2 for 2 points" }).getAttribute("aria-disabled"))
      .toBe("true");

    await act(async () => resolveMutation({ points: 42, canDate: true }));
  });

  it("shows backend errors and delegates expired sessions", async () => {
    const onSessionExpired = vi.fn();
    const adjustScore = vi
      .fn()
      .mockRejectedValueOnce(new Error("Score service unavailable."))
      .mockRejectedValueOnce(new Error("Admin session is missing or expired."));
    useMutationMock.mockReturnValue(adjustScore);

    const view = render(
      <ScoreAdjustmentFormHarness
        adminToken="admin-token"
        canDate={false}
        currentScore={40}
        onSessionExpired={onSessionExpired}
        participantId={participantId}
        participantName="Noor"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Manual correction" }));
    const input = screen.getByLabelText("Score adjustment");
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.submit(input.closest("form")!);
    expect(await screen.findByText("Score service unavailable.")).toBeTruthy();

    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1));
    view.unmount();
  });

  it("keeps manual controls open while a date update is pending", async () => {
    let rejectDate!: (error: Error) => void;
    const setDateEligibility = vi.fn().mockReturnValue(
      new Promise<never>((_resolve, reject) => {
        rejectDate = reject;
      })
    );
    useMutationMock.mockReturnValue(setDateEligibility);

    render(
      <ScoreAdjustmentFormHarness
        adminToken="admin-token"
        canDate={false}
        currentScore={40}
        onSessionExpired={vi.fn()}
        participantId={participantId}
        participantName="Noor"
      />
    );

    const manualButton = screen.getByRole("button", { name: "Manual correction" });
    fireEvent.click(manualButton);
    fireEvent.click(screen.getByRole("checkbox", { name: "May date Tommie" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Manual correction" }).hasAttribute("disabled"))
        .toBe(true);
    });
    expect(screen.getByRole("checkbox", { name: "May date Tommie" })).toBeTruthy();

    await act(async () => rejectDate(new Error("Date service unavailable.")));
    expect(await screen.findByText("Date service unavailable.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Manual correction" }).hasAttribute("disabled"))
      .toBe(false);
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

    const view = render(<DateEligibilityControlHarness {...props} canDate={false} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "May date Tommie" }));
    await waitFor(() => {
      expect(setDateEligibility).toHaveBeenLastCalledWith({
        adminToken: "admin-token",
        participantId,
        canDate: true
      });
    });

    view.rerender(<DateEligibilityControlHarness {...props} canDate />);
    fireEvent.click(screen.getByRole("checkbox", { name: "May date Tommie" }));
    await waitFor(() => {
      expect(setDateEligibility).toHaveBeenLastCalledWith({
        adminToken: "admin-token",
        participantId,
        canDate: false
      });
    });
    expect(screen.queryByText(/Saved:/)).toBeNull();
  });

  it("offers four fixed money adjustments and submits the selected delta", async () => {
    const adjustMoney = vi.fn().mockResolvedValue({ tommieMoney: 2_000 });
    useMutationMock.mockReturnValue(adjustMoney);

    render(
      <MoneyAdjustmentForm
        adminToken="admin-token"
        currentTotal={1_500}
        onSessionExpired={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "− €1.000" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "− €500" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "+ €500" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "+ €1.000" }));

    await waitFor(() => {
      expect(adjustMoney).toHaveBeenCalledWith({
        adminToken: "admin-token",
        delta: 1_000
      });
    });
    expect(screen.queryByText(/Saved:/)).toBeNull();
  });

  it("allows only one in-flight money adjustment", async () => {
    let resolveMutation!: (result: { tommieMoney: number }) => void;
    const adjustMoney = vi.fn().mockReturnValue(
      new Promise<{ tommieMoney: number }>((resolve) => {
        resolveMutation = resolve;
      })
    );
    useMutationMock.mockReturnValue(adjustMoney);

    render(
      <MoneyAdjustmentForm
        adminToken="admin-token"
        currentTotal={1_500}
        onSessionExpired={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "+ €500" }));

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons.every((button) => !button.hasAttribute("disabled"))).toBe(true);
    expect(buttons.every((button) => button.getAttribute("aria-disabled") === "true")).toBe(true);
    expect(screen.getByRole("button", { name: "+ €500" })).toBeTruthy();
    expect(screen.queryByRole("status")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "+ €500" }));
    fireEvent.click(screen.getByRole("button", { name: "+ €1.000" }));
    expect(adjustMoney).toHaveBeenCalledTimes(1);

    await act(async () => resolveMutation({ tommieMoney: 2_000 }));
    await waitFor(() => {
      expect(screen.getAllByRole("button").every((button) => button.getAttribute("aria-disabled") === "false")).toBe(true);
    });
    expect(screen.queryByText(/Saved:/)).toBeNull();
  });

  it("shows money errors, re-enables controls, and delegates expired sessions", async () => {
    const onSessionExpired = vi.fn();
    const adjustMoney = vi
      .fn()
      .mockRejectedValueOnce(new Error("Money service unavailable."))
      .mockRejectedValueOnce(new Error("Admin session is missing or expired."));
    useMutationMock.mockReturnValue(adjustMoney);

    render(
      <MoneyAdjustmentForm
        adminToken="admin-token"
        currentTotal={1_500}
        onSessionExpired={onSessionExpired}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "+ €500" }));
    expect(await screen.findByText("Money service unavailable.")).toBeTruthy();
    expect(screen.getAllByRole("button").every((button) => !button.hasAttribute("disabled"))).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "− €500" }));
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1));
  });

  it("disables money corrections that would make the pot negative", () => {
    const adjustMoney = vi.fn();
    useMutationMock.mockReturnValue(adjustMoney);

    render(
      <MoneyAdjustmentForm
        adminToken="admin-token"
        currentTotal={400}
        onSessionExpired={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "− €1.000" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "− €500" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "+ €500" }).hasAttribute("disabled")).toBe(false);
    expect(adjustMoney).not.toHaveBeenCalled();
  });

  it("keeps participant profile fields in an edit dialog and closes after saving", async () => {
    let resolveUpdate!: () => void;
    const createParticipant = vi.fn();
    const updateParticipant = vi.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      })
    );
    const generateUploadUrl = vi.fn();
    const otherMutation = vi.fn();
    useMutationMock
      .mockReturnValueOnce(createParticipant)
      .mockReturnValueOnce(updateParticipant)
      .mockReturnValueOnce(generateUploadUrl)
      .mockReturnValue(otherMutation);

    render(
      <ParticipantManager
        adminToken="admin-token"
        onSessionExpired={vi.fn()}
        participants={[
          {
            _id: participantId,
            canDate: true,
            isActive: true,
            name: "Noor",
            photoUrl: null,
            points: 40
          }
        ]}
      />
    );

    const card = screen.getByRole("heading", { name: "Noor" }).closest('[data-slot="card"]');
    if (!(card instanceof HTMLElement)) throw new Error("Expected one unified participant card.");
    expect(within(card).getByRole("button", { name: "Play 2 for 2 points" })).toBeTruthy();
    expect(within(card).getByRole("button", { name: "Date gehad met Noor" })).toBeTruthy();
    expect(within(card).queryByRole("checkbox", { name: "May date Tommie" })).toBeNull();
    fireEvent.click(within(card).getByRole("button", { name: "Manual correction" }));
    expect(within(card).getByRole("checkbox", { name: "May date Tommie" })).toBeTruthy();
    expect(within(card).queryByLabelText("Naam")).toBeNull();
    expect(screen.queryByText("Op scorebord tonen")).toBeNull();

    fireEvent.click(within(card).getByRole("button", { name: "Edit Noor" }));

    const dialog = screen.getByRole("dialog", { name: "Edit Noor" });
    const nameInput = within(dialog).getByLabelText("Naam") as HTMLInputElement;
    expect(nameInput.value).toBe("Noor");
    expect(within(dialog).getByText("Op scorebord tonen")).toBeTruthy();

    fireEvent.change(nameInput, { target: { value: "Temporary" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close edit dialog" }));
    fireEvent.click(within(card).getByRole("button", { name: "Edit Noor" }));

    const reopenedDialog = screen.getByRole("dialog", { name: "Edit Noor" });
    expect((within(reopenedDialog).getByLabelText("Naam") as HTMLInputElement).value).toBe("Noor");
    fireEvent.change(within(reopenedDialog).getByLabelText("Naam"), {
      target: { value: "Noor Updated" }
    });
    fireEvent.click(within(reopenedDialog).getByRole("button", { name: "Profiel opslaan" }));

    await waitFor(() => {
      expect(updateParticipant).toHaveBeenCalledWith({
        adminToken: "admin-token",
        participantId,
        name: "Noor Updated",
        isActive: true,
        photoStorageId: undefined
      });
    });
    expect(
      within(reopenedDialog).getByRole("button", { name: "Close edit dialog" }).hasAttribute("disabled")
    ).toBe(true);
    expect(screen.getByRole("dialog", { name: "Edit Noor" })).toBeTruthy();

    await act(async () => resolveUpdate());
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit Noor" })).toBeNull());
  });

  it("shows profile save errors inside the open edit dialog", async () => {
    const updateParticipant = vi.fn().mockRejectedValue(new Error("Profile service unavailable."));
    useMutationMock
      .mockReturnValueOnce(vi.fn())
      .mockReturnValueOnce(updateParticipant)
      .mockReturnValueOnce(vi.fn())
      .mockReturnValue(vi.fn());

    render(
      <ParticipantManager
        adminToken="admin-token"
        onSessionExpired={vi.fn()}
        participants={[
          {
            _id: participantId,
            canDate: true,
            isActive: true,
            name: "Noor",
            photoUrl: null,
            points: 40
          }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Noor" }));
    const dialog = screen.getByRole("dialog", { name: "Edit Noor" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Profiel opslaan" }));

    expect(await within(dialog).findByText("Profile service unavailable.")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Edit Noor" })).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Close edit dialog" }).hasAttribute("disabled"))
      .toBe(false);
  });
});
