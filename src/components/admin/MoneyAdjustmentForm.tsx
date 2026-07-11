"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { parseAdjustment, projectedTotal } from "@/lib/adjustments";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(amount);

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
      setSuccess(`Saved: ${formatMoney(result.tommieMoney)}.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Money adjustment failed.";
      if (message.includes("session is missing or expired")) {
        onSessionExpired();
        return;
      }
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
            Current: {formatMoney(currentTotal)}
            {projection === null ? "" : ` · Projected: ${formatMoney(projection)}`}
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
