"use client";

import type { DateEligibilityMutation } from "@/components/admin/useDateEligibilityMutation";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";

type DateCompletedButtonProps = {
  canDate: boolean;
  dateEligibility: DateEligibilityMutation;
  participantName: string;
};

export function DateCompletedButton({
  canDate,
  dateEligibility,
  participantName
}: DateCompletedButtonProps) {
  const { error, isSubmitting, save } = dateEligibility;

  return (
    <div className="grid justify-items-end gap-1">
      <Button
        aria-label={canDate ? `Date gehad met ${participantName}` : `Date geregistreerd voor ${participantName}`}
        disabled={!canDate || isSubmitting}
        onClick={() => void save(false)}
        size="xs"
        type="button"
        variant="outline"
      >
        {isSubmitting ? "Opslaan…" : canDate ? "Date gehad" : "Date geregistreerd"}
      </Button>
      {error ? <FieldError className="text-right text-xs">{error}</FieldError> : null}
    </div>
  );
}
