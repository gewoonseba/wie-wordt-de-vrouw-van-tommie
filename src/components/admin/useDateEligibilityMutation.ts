"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { isAdminSessionExpired } from "@/lib/admin-session";

type UseDateEligibilityMutationProps = {
  adminToken: string;
  onSessionExpired: () => void;
  participantId: Id<"participants">;
};

export function useDateEligibilityMutation({
  adminToken,
  onSessionExpired,
  participantId
}: UseDateEligibilityMutationProps) {
  const setDateEligibility = useMutation(api.trackerAdmin.setDateEligibility);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  async function save(canDate: boolean) {
    if (isSubmittingRef.current) return;

    setError("");
    isSubmittingRef.current = true;
    setSubmitting(true);
    try {
      await setDateEligibility({ adminToken, participantId, canDate });
    } catch (caught) {
      if (isAdminSessionExpired(caught)) {
        onSessionExpired();
        return;
      }
      setError(caught instanceof Error ? caught.message : "Date status failed.");
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  }

  return { error, isSubmitting, save };
}

export type DateEligibilityMutation = ReturnType<typeof useDateEligibilityMutation>;
