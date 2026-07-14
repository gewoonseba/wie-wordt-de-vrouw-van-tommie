"use client";

import { useState } from "react";
import { useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

type ResetStartingStateButtonProps = {
  adminToken: string;
  onSessionExpired: () => void;
};

export function ResetStartingStateButton({
  adminToken,
  onSessionExpired
}: ResetStartingStateButtonProps) {
  const reset = useMutation(api.trackerAdmin.resetToStartingState);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resetStartingState() {
    if (
      !window.confirm(
        "Reset all participant scores and date flags, and set Tommie's pot back to €1,000?"
      )
    ) {
      return;
    }

    setError(null);
    setIsResetting(true);
    try {
      await reset({ adminToken });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not reset the event state.";
      if (message.includes("Admin session is missing or expired")) {
        onSessionExpired();
        return;
      }
      setError(message);
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button disabled={isResetting} onClick={() => void resetStartingState()} type="button" variant="destructive">
        {isResetting ? "Resetten…" : "Startstand herstellen"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
