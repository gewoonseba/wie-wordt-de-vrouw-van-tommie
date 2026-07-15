"use client";

import type { Id } from "../../../convex/_generated/dataModel";
import type { DateEligibilityMutation } from "@/components/admin/useDateEligibilityMutation";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";

type DateEligibilityControlProps = {
  canDate: boolean;
  dateEligibility: DateEligibilityMutation;
  disabled?: boolean;
  participantId: Id<"participants">;
  participantName: string;
};

export function DateEligibilityControl({
  canDate,
  dateEligibility,
  disabled = false,
  participantId,
  participantName
}: DateEligibilityControlProps) {
  const { error, isSubmitting, save } = dateEligibility;

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
      </FieldContent>
    </Field>
  );
}
