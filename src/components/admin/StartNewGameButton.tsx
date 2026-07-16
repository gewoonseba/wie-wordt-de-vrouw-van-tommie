"use client";

import { useState } from "react";
import { useMutation } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

type StartNewGameButtonProps = {
  adminToken: string;
  onSessionExpired: () => void;
};

export function StartNewGameButton({
  adminToken,
  onSessionExpired
}: StartNewGameButtonProps) {
  const startNewGame = useMutation(api.trackerAdmin.startNewGame);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmAndStartNewGame() {
    if (
      !window.confirm(
        "Start a new game? This sets all participant scores and Tommie's pot to zero, and enables every date flag."
      )
    ) {
      return;
    }

    setError(null);
    setIsStarting(true);
    try {
      await startNewGame({ adminToken });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start a new game.";
      if (message.includes("Admin session is missing or expired")) {
        onSessionExpired();
        return;
      }
      setError(message);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        disabled={isStarting}
        onClick={() => void confirmAndStartNewGame()}
        type="button"
        variant="destructive"
      >
        {isStarting ? "Nieuw spel starten…" : "Nieuw spel starten"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
