import type { CSSProperties } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ScoreboardParticipant } from "@/lib/scoreboard";
import { getInitials } from "@/lib/text";

const ROW_COLORS = ["#ff2ca4", "#43e9ff", "#a8ff19", "#ff8b19", "#be5cff"];

export function RankingList({
  participants,
  onSelect
}: {
  participants: ScoreboardParticipant[];
  onSelect: (participantId: ScoreboardParticipant["_id"]) => void;
}) {
  const maxPoints = Math.max(1, ...participants.map((participant) => participant.points));

  return (
    <section className="crt-ranking-window">
      <div className="crt-window-title crt-window-title-grid">
        <h2>Volledige stand</h2>
        <span>NAME</span><span>LOVE POWER</span><span>STATUS</span><span>SCORE</span>
      </div>

      {participants.length === 0 ? (
        <div className="crt-ranking-empty">Er zijn nog geen actieve deelnemers.</div>
      ) : (
        <ol className="crt-ranking-list">
          {participants.map((participant, index) => {
            const meter = Math.max(4, (participant.points / maxPoints) * 100);
            const rowStyle = {
              "--row-color": ROW_COLORS[index % ROW_COLORS.length],
              "--meter": `${meter}%`
            } as CSSProperties;

            return (
              <li
                key={`${participant._id}-${participant.points}-${participant.canDate}`}
              >
                <button
                  type="button"
                  className="crt-ranking-row"
                  style={rowStyle}
                  aria-label={`Bekijk ${participant.name}`}
                  onClick={() => onSelect(participant._id)}
                >
                  <span className="crt-rank-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="crt-ranking-name">
                    <Avatar className="crt-ranking-avatar">
                      {participant.photoUrl ? <AvatarImage src={participant.photoUrl} alt="" /> : null}
                      <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                    </Avatar>
                    <strong>{participant.name}</strong>
                  </span>
                  <span className="crt-power-meter" aria-hidden="true"><span /></span>
                  <span className={participant.canDate ? "crt-date-badge is-hot" : "crt-date-badge"}>
                    {participant.canDate ? "Mag op date" : "Geen date"}
                  </span>
                  <span className="crt-points">
                    {participant.points}<small>PT</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
