import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ScoreboardParticipant } from "@/lib/scoreboard";
import { getInitials } from "@/lib/text";
import { WindowControls } from "@/components/scoreboard/WindowControls";

const PODIUM_DECORATIONS = ["👑", "🐬", "🍸"];

export function Podium({ participants }: { participants: ScoreboardParticipant[] }) {
  return (
    <section className="crt-podium-window" aria-labelledby="podium-title">
      <div className="crt-window-title">
        <h2 id="podium-title">Het podium</h2>
        <span>TOP LOVE FREQUENCIES</span>
        <WindowControls />
      </div>

      {participants.length === 0 ? (
        <div className="crt-empty-state">
          <span aria-hidden="true">📡</span>
          <div>
            <h3>Het podium staat klaar</h3>
            <p>Zodra er deelnemers actief zijn, verschijnen de koplopers hier.</p>
          </div>
        </div>
      ) : (
        <ol className="crt-podium">
          {participants.map((participant, index) => {
            const rank = index + 1;

            return (
              <li
                key={`${participant._id}-${participant.points}`}
                className={`crt-podium-card crt-podium-rank-${rank}`}
              >
                <span className="crt-podium-decoration" aria-hidden="true">
                  {PODIUM_DECORATIONS[index]}
                </span>
                <div className="crt-portrait-burst">
                  <Avatar className="crt-podium-avatar">
                    {participant.photoUrl ? (
                      <AvatarImage
                        src={participant.photoUrl}
                        alt={`Portret van ${participant.name}`}
                      />
                    ) : null}
                    <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="crt-podium-nameplate">
                  <span>{participant.name}</span>
                  <b>{participant.points} PT</b>
                </div>
                <div className="crt-podium-step">
                  <strong>{rank}</strong>
                  <span>{participant.canDate ? "DATE!" : "LOCKED"}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
