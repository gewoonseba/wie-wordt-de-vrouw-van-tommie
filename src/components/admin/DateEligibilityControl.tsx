"use client";

import { useMutation } from "convex/react";
import { useState } from "react";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { isAdminSessionExpired } from "@/lib/admin-session";

type DateEligibilityControlProps = {
  adminToken: string;
  canDate: boolean;
  disabled?: boolean;
  onPendingChange?: (pending: boolean) => void;
  onSessionExpired: () => void;
  participantId: Id<"participants">;
  participantName: string;
};

export function DateEligibilityControl({
  adminToken,
  canDate,
  disabled = false,
  onPendingChange,
  onSessionExpired,
  participantId,
  participantName
}: DateEligibilityControlProps) {
  const setDateEligibility = useMutation(api.trackerAdmin.setDateEligibility);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  async function save(desiredState: boolean) {
    if (isSubmitting) return;
    setError("");
    setSubmitting(true);
    onPendingChange?.(true);
    try {
      await setDateEligibility({ adminToken, participantId, canDate: desiredState });
    } catch (caught) {
      if (isAdminSessionExpired(caught)) {
        onSessionExpired();
        return;
      }
      const message = caught instanceof Error ? caught.message : "Date status failed.";
      setError(message);
    } finally {
      setSubmitting(false);
      onPendingChange?.(false);
    }
  }

  const isDisabled = disabled || isSubmitting;

  return (
    <Field data-disabled={isDisabled} data-invalid={!!error} orientation="horizontal">
      <Checkbox
        aria-invalid={!!error}
        checked={canDate}
        disabled={isDisabled}
        id={`date-${participantId}`}
        onCheckedChange={(checked) => void save(checked)}
      />
      <FieldContent>
        <FieldLabel htmlFor={`date-${participantId}`}>May date Tommie</FieldLabel>
        <FieldDescription>
          Set {participantName}&apos;s exact eligibility state.
          {isSubmitting ? " Saving…" : ""}
        </FieldDescription>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}
