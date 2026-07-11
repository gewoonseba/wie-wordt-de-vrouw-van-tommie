"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isAdminSessionExpired } from "@/lib/admin-session";
import { parseAdjustment, projectedTotal } from "@/lib/adjustments";

type ScoreAdjustmentFormProps = {
  adminToken: string;
  currentScore: number;
  onSessionExpired: () => void;
  participantId: Id<"participants">;
  participantName: string;
};

export function ScoreAdjustmentForm({
  adminToken,
  currentScore,
  onSessionExpired,
  participantId,
  participantName
}: ScoreAdjustmentFormProps) {
  const adjustScore = useMutation(api.trackerAdmin.adjustScore);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const projection = projectedTotal(currentScore, input);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = parseAdjustment(input);
    if (parsed.value === null) {
      setError(parsed.error);
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const result = await adjustScore({ adminToken, participantId, delta: parsed.value });
      setInput("");
      setSuccess(`Saved: ${result.points} points.`);
    } catch (caught) {
      if (isAdminSessionExpired(caught)) {
        onSessionExpired();
        return;
      }
      const message = caught instanceof Error ? caught.message : "Score adjustment failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={`score-${participantId}`}>Score adjustment</FieldLabel>
          <Input
            aria-invalid={!!error}
            disabled={isSubmitting}
            id={`score-${participantId}`}
            inputMode="numeric"
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="+10 or -5"
            value={input}
          />
          <FieldDescription>
            Current: {currentScore}
            {projection === null ? "" : ` · Projected: ${projection}`}
          </FieldDescription>
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving…" : `Adjust ${participantName}`}
        </Button>
        {success ? <p aria-live="polite" className="text-sm text-muted-foreground">{success}</p> : null}
      </FieldGroup>
    </form>
  );
}
