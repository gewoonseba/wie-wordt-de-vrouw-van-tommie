"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { isAdminSessionExpired } from "@/lib/admin-session";
import { formatEuro } from "@/lib/scoreboard";

type MoneyAdjustmentFormProps = {
  adminToken: string;
  currentTotal: number;
  onSessionExpired: () => void;
};

const MONEY_ADJUSTMENTS = [-1_000, -500, 500, 1_000] as const;

function formatAdjustment(delta: number) {
  const amount = formatEuro(Math.abs(delta)).replace(/\s/g, "");
  return `${delta < 0 ? "−" : "+"} ${amount}`;
}

export function MoneyAdjustmentForm({ adminToken, currentTotal, onSessionExpired }: MoneyAdjustmentFormProps) {
  const adjustMoney = useMutation(api.trackerAdmin.adjustMoney);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  async function applyAdjustment(delta: number) {
    if (isSubmittingRef.current || currentTotal + delta < 0) return;

    setError("");
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      await adjustMoney({ adminToken, delta });
    } catch (caught) {
      if (isAdminSessionExpired(caught)) {
        onSessionExpired();
        return;
      }
      const message = caught instanceof Error ? caught.message : "Money adjustment failed.";
      setError(message);
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MONEY_ADJUSTMENTS.map((delta) => (
          <Button
            aria-disabled={isSubmitting || currentTotal + delta < 0}
            disabled={currentTotal + delta < 0}
            key={delta}
            onClick={() => void applyAdjustment(delta)}
            type="button"
            variant={delta < 0 ? "outline" : "default"}
          >
            {formatAdjustment(delta)}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Current: {formatEuro(currentTotal)}</p>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
