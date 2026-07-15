"use client";

import { useMutation } from "convex/react";
import { memo, type FormEvent, useRef, useState } from "react";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { DateEligibilityControl } from "@/components/admin/DateEligibilityControl";
import type { DateEligibilityMutation } from "@/components/admin/useDateEligibilityMutation";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isAdminSessionExpired } from "@/lib/admin-session";
import { parseAdjustment, projectedTotal } from "@/lib/adjustments";

const PLAYING_CARDS = [
  { label: "2", name: "2", points: 2 },
  { label: "3", name: "3", points: 3 },
  { label: "4", name: "4", points: 4 },
  { label: "5", name: "5", points: 5 },
  { label: "6", name: "6", points: 6 },
  { label: "7", name: "7", points: 7 },
  { label: "8", name: "8", points: 8 },
  { label: "9", name: "9", points: 9 },
  { label: "10", name: "10", points: 10 },
  { label: "A", name: "ace", points: 10 },
  { label: "J", name: "jack", points: 10 },
  { label: "Q", name: "queen", points: 10 },
  { label: "K", name: "king", points: 10 }
] as const;

type ScoreAdjustmentFormProps = {
  adminToken: string;
  canDate: boolean;
  currentScore: number;
  dateEligibility: DateEligibilityMutation;
  onSessionExpired: () => void;
  participantId: Id<"participants">;
  participantName: string;
};

export function ScoreAdjustmentForm({
  adminToken,
  canDate,
  currentScore,
  dateEligibility,
  onSessionExpired,
  participantId,
  participantName
}: ScoreAdjustmentFormProps) {
  const adjustScore = useMutation(api.trackerAdmin.adjustScore);
  const playCard = useMutation(api.trackerAdmin.playCard);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isManualOpen, setManualOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const isBusy = isSubmitting || dateEligibility.isSubmitting;
  const projection = isManualOpen ? projectedTotal(currentScore, input) : null;

  async function submitChange(change: () => Promise<unknown>) {
    if (isSubmittingRef.current || dateEligibility.isSubmitting) return;

    setError("");
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      await change();
      setInput("");
      setManualOpen(false);
    } catch (caught) {
      if (isAdminSessionExpired(caught)) {
        onSessionExpired();
        return;
      }
      const message = caught instanceof Error ? caught.message : "Score adjustment failed.";
      setError(message);
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function submitAdjustment(delta: number) {
    await submitChange(() => adjustScore({ adminToken, participantId, delta }));
  }

  async function submitCard(points: number) {
    await submitChange(() => playCard({ adminToken, participantId, points }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = parseAdjustment(input);
    if (parsed.value === null) {
      setError(parsed.error);
      return;
    }

    await submitAdjustment(parsed.value);
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Score adjustment</p>
          <p className="text-xs text-muted-foreground">Current: {currentScore}</p>
        </div>
        <Button
          aria-expanded={isManualOpen}
          disabled={isBusy}
          onClick={() => setManualOpen((open) => !open)}
          size="xs"
          type="button"
          variant="ghost"
        >
          Manual correction
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={`Playing cards for ${participantName}`}>
        {PLAYING_CARDS.map((card, index) => (
          <button
            aria-disabled={isBusy}
            aria-label={`Play ${card.name} for ${card.points} points`}
            className="group/card-button relative h-16 w-12 rounded-lg outline-none transition-transform hover:-translate-y-1 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-45"
            key={card.label}
            onClick={() => void submitCard(card.points)}
            type="button"
          >
            <PlayingCard isRed={index % 2 === 0} label={card.label} />
          </button>
        ))}
      </div>

      {isManualOpen ? (
        <div className="grid gap-4 rounded-2xl bg-muted/50 p-3 sm:grid-cols-2">
          <form className="grid gap-3" onSubmit={onSubmit}>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor={`score-${participantId}`}>Score adjustment</FieldLabel>
              <Input
                aria-invalid={!!error}
                disabled={isBusy}
                id={`score-${participantId}`}
                inputMode="numeric"
                onChange={(event) => {
                  setInput(event.target.value);
                  setError("");
                }}
                placeholder="+10 or -5"
                value={input}
              />
              <FieldDescription>
                Enter a signed correction
                {projection === null ? "" : ` · Projected: ${projection}`}
              </FieldDescription>
            </Field>
            <Button disabled={isBusy} type="submit">
              {isSubmitting ? "Saving…" : `Adjust ${participantName}`}
            </Button>
          </form>
          <div className="border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
            <DateEligibilityControl
              canDate={canDate}
              dateEligibility={dateEligibility}
              disabled={isSubmitting}
              participantId={participantId}
              participantName={participantName}
            />
          </div>
        </div>
      ) : null}

      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}

const PlayingCard = memo(function PlayingCard({ isRed, label }: { isRed: boolean; label: string }) {
  return (
    <svg
      aria-hidden="true"
      className="size-full overflow-visible drop-shadow-sm"
      viewBox="0 0 48 64"
    >
      <rect
        className="fill-stone-50 stroke-stone-300 transition-colors group-hover/card-button:fill-white"
        height="62"
        rx="6"
        width="46"
        x="1"
        y="1"
      />
      <CardCorner isRed={isRed} label={label} />
      {isRed ? (
        <path
          className="fill-red-600"
          d="M24 39c-6-5-11-9-11-15 0-4 3-7 7-7 2 0 4 1 4 3 1-2 3-3 5-3 4 0 7 3 7 7 0 6-6 10-12 15Z"
        />
      ) : (
        <path
          className="fill-stone-900"
          d="M24 16S13 25 13 31c0 4 3 7 7 7 2 0 3-1 4-3 0 4-2 7-4 9h8c-2-2-4-5-4-9 1 2 2 3 4 3 4 0 7-3 7-7 0-6-11-15-11-15Z"
        />
      )}
      <CardCorner isRed={isRed} label={label} transform="rotate(180 24 32)" />
    </svg>
  );
});

function CardCorner({
  isRed,
  label,
  transform,
}: {
  isRed: boolean;
  label: string;
  transform?: string;
}) {
  return (
    <text
      className={isRed ? "fill-red-600" : "fill-stone-900"}
      fontFamily="ui-sans-serif, system-ui, sans-serif"
      fontSize={label === "10" ? "9" : "11"}
      fontWeight="700"
      textAnchor="middle"
      transform={transform}
      x="9"
      y="14"
    >
      {label}
    </text>
  );
}
