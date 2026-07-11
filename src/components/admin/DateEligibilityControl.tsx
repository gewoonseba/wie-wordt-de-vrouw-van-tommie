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
  onSessionExpired: () => void;
  participantId: Id<"participants">;
  participantName: string;
};

export function DateEligibilityControl({
  adminToken,
  canDate,
  onSessionExpired,
  participantId,
  participantName
}: DateEligibilityControlProps) {
  const setDateEligibility = useMutation(api.trackerAdmin.setDateEligibility);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  async function save(desiredState: boolean) {
    if (isSubmitting) return;
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await setDateEligibility({ adminToken, participantId, canDate: desiredState });
      setSuccess(desiredState ? "Saved: date allowed." : "Saved: no date allowed.");
    } catch (caught) {
      if (isAdminSessionExpired(caught)) {
        onSessionExpired();
        return;
      }
      const message = caught instanceof Error ? caught.message : "Date status failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Field data-disabled={isSubmitting} data-invalid={!!error} orientation="horizontal">
      <Checkbox
        aria-invalid={!!error}
        checked={canDate}
        disabled={isSubmitting}
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
        {success ? <p aria-live="polite" className="text-sm text-muted-foreground">{success}</p> : null}
      </FieldContent>
    </Field>
  );
}
