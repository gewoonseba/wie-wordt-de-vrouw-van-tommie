"use client";

import { useEffect, useId } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ScoreboardParticipant } from "@/lib/scoreboard";
import { getInitials } from "@/lib/text";

export function ParticipantDetailModal({
  participant,
  rank,
  onClose
}: {
  participant: ScoreboardParticipant;
  rank: number;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="crt-modal-backdrop" onMouseDown={onClose}>
      <section
        className="crt-profile-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="crt-profile-titlebar">
          <span aria-hidden="true">💘</span>
          <h2 id={titleId}>{participant.name} details</h2>
          <button type="button" aria-label="Sluit details" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="crt-profile-body">
          <div className="crt-profile-portrait">
            <span className="crt-profile-starburst" aria-hidden="true" />
            <Avatar className="crt-profile-avatar">
              {participant.photoUrl ? (
                <AvatarImage
                  src={participant.photoUrl}
                  alt={`Portret van ${participant.name}`}
                />
              ) : null}
              <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
            </Avatar>
            <strong>RANK #{String(rank).padStart(2, "0")}</strong>
          </div>

          <div className="crt-profile-readout">
            <p className="crt-profile-label">LOVE POWER ANALYSIS</p>
            <p className="crt-profile-score">{participant.points} POINTS</p>
            <div className="crt-profile-meter" aria-hidden="true">
              <span />
            </div>
            <p
              className={
                participant.canDate
                  ? "crt-profile-date is-hot"
                  : "crt-profile-date"
              }
            >
              <span aria-hidden="true">{participant.canDate ? "💋" : "🔒"}</span>
              {participant.canDate ? "MAG OP DATE MET TOMMIE" : "GEEN DATE MET TOMMIE"}
            </p>
            <div className="crt-profile-system-copy">
              <span>SUBJECT: {participant.name.toUpperCase()}</span>
              <span>STATUS: LIVE SIGNAL LOCKED</span>
              <span>DATABASE: TOMMIE_LOVE.DAT</span>
            </div>
          </div>
        </div>

        <footer className="crt-profile-footer">
          <span>♥ LOVE•VISION PROFILE VIEWER v2.0 ♥</span>
          <button type="button" onClick={onClose}>OK</button>
        </footer>
      </section>
    </div>
  );
}
