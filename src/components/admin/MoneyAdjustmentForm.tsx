"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { isAdminSessionExpired } from "@/lib/admin-session";
import { parseAdjustment, projectedTotal } from "@/lib/adjustments";
import { formatEuro } from "@/lib/scoreboard";

type MoneyAdjustmentFormProps = {
  adminToken: string;
  currentTotal: number;
  onSessionExpired: () => void;
};

export function MoneyAdjustmentForm({ adminToken, currentTotal, onSessionExpired }: MoneyAdjustmentFormProps) {
  const adjustMoney = useMutation(api.trackerAdmin.adjustMoney);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const projection = projectedTotal(currentTotal, input);

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
      const result = await adjustMoney({ adminToken, delta: parsed.value });
      setInput("");
      setSuccess(`Saved: ${formatEuro(result.tommieMoney)}.`);
    } catch (caught) {
      if (isAdminSessionExpired(caught)) {
        onSessionExpired();
        return;
      }
      const message = caught instanceof Error ? caught.message : "Money adjustment failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="money-adjustment">Money adjustment</FieldLabel>
          <Input
            aria-invalid={!!error}
            disabled={isSubmitting}
            id="money-adjustment"
            inputMode="numeric"
            onChange={(event) => {
              setInput(event.target.value);
              setError("");
              setSuccess("");
            }}
            placeholder="+500 or -100"
            value={input}
          />
          <FieldDescription>
            Current: {formatEuro(currentTotal)}
            {projection === null ? "" : ` · Projected: ${formatEuro(projection)}`}
          </FieldDescription>
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving…" : "Adjust pot"}
        </Button>
        {success ? <p aria-live="polite" className="text-sm text-muted-foreground">{success}</p> : null}
      </FieldGroup>
    </form>
  );
}
