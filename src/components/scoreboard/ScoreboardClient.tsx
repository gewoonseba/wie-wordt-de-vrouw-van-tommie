"use client";

import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useState
} from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import {
  CrtBarrelFilterDefs,
  CrtShaderOverlay
} from "@/components/scoreboard/CrtShaderOverlay";
import { MoneyPile } from "@/components/scoreboard/MoneyPile";
import { ParticipantDetailModal } from "@/components/scoreboard/ParticipantDetailModal";
import { Podium } from "@/components/scoreboard/Podium";
import { RankingList } from "@/components/scoreboard/RankingList";
import { WindowControls } from "@/components/scoreboard/WindowControls";
import { rankParticipants, selectPodium } from "@/lib/scoreboard";
import type { ScoreboardParticipant } from "@/lib/scoreboard";

function BroadcastFrame({
  children,
  overlay
}: {
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <main className="crt-broadcast">
      <div className="crt-cabinet">
        <div className="crt-glass">
          <CrtBarrelFilterDefs />
          <div className="crt-screen-content">
            <div className="crt-desktop-bar" aria-hidden="true">
              <span className="crt-app-icon">💘</span>
              <span>TOMMIE.EXE — LIVE SATELLITE FEED</span>
              <WindowControls />
            </div>
            {children}
          </div>
          <CrtShaderOverlay />
          <div className="crt-glass-glare" aria-hidden="true" />
          {overlay}
        </div>

        <div className="crt-hardware" aria-hidden="true">
          <div>LOVE•VISION 2000</div>
          <div className="crt-hardware-lights">
            <span />
            <span />
            <b>POWER</b>
          </div>
        </div>
      </div>
    </main>
  );
}

function ScoreboardStatus({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <BroadcastFrame>
      <div className="crt-status">
        <div className="crt-status-window">
          <div className="crt-window-title">
            <span>⚠ SIGNAL STATUS</span>
            <WindowControls />
          </div>
          <div className="crt-status-content">
            <span className="crt-status-orb" aria-hidden="true">📡</span>
            <div>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>
          <div className="crt-loading-bar" aria-hidden="true"><span /></div>
        </div>
      </div>
    </BroadcastFrame>
  );
}

class ScoreboardErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Public scoreboard failed to render", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <ScoreboardStatus
          title="De stand kon niet worden geladen"
          description="Vernieuw de pagina. Blijft dit gebeuren, vraag dan de host om hulp."
        />
      );
    }

    return this.props.children;
  }
}

function DateTelemetry({ eligibleCount }: { eligibleCount: number }) {
  const active = eligibleCount > 0;

  return (
    <aside className="crt-date-panel">
      <div className="crt-window-title crt-window-title-hot">
        <span>DATE MODE</span>
        <WindowControls />
      </div>
      <div className="crt-date-panel-content">
        <p className="crt-date-state">{active ? "ACTIVATED" : "STANDBY"}</p>
        <div className="crt-radar" aria-hidden="true">
          <span className="crt-radar-beam" />
          <b>♥</b>
        </div>
        <p className="crt-date-count">
          <span className="crt-date-zap" aria-hidden="true">⚡</span>
          <strong>{eligibleCount} </strong>
          <span className="crt-date-count-label">
            DATE SIGNALS!
            <small>LOVE OVERLOAD</small>
          </span>
          <span className="crt-date-zap" aria-hidden="true">⚡</span>
        </p>
        <div className={active ? "crt-toggle is-active" : "crt-toggle"} aria-hidden="true">
          <span />
        </div>
      </div>
    </aside>
  );
}

function ScoreboardContent() {
  const scoreboard = useQuery(api.scoreboard.get);
  const [selectedParticipantId, setSelectedParticipantId] =
    useState<ScoreboardParticipant["_id"] | null>(null);
  const closeParticipant = useCallback(() => setSelectedParticipantId(null), []);

  useEffect(() => {
    if (
      scoreboard !== undefined &&
      selectedParticipantId !== null &&
      !scoreboard.participants.some(
        (participant) => participant._id === selectedParticipantId
      )
    ) {
      const removedParticipantId = selectedParticipantId;
      queueMicrotask(() => {
        setSelectedParticipantId((currentParticipantId) =>
          currentParticipantId === removedParticipantId ? null : currentParticipantId
        );
      });
    }
  }, [scoreboard, selectedParticipantId]);

  if (scoreboard === undefined) {
    return (
      <ScoreboardStatus
        title="De live stand komt eraan…"
        description="Scores en Tommie's pot worden opgehaald."
      />
    );
  }

  const rankedParticipants = rankParticipants(scoreboard.participants);
  const podiumParticipants = selectPodium(rankedParticipants);
  const eligibleCount = rankedParticipants.filter((participant) => participant.canDate).length;
  const selectedParticipant = rankedParticipants.find(
    (participant) => participant._id === selectedParticipantId
  );

  return (
    <BroadcastFrame
      overlay={
        selectedParticipant ? (
          <ParticipantDetailModal
            participant={selectedParticipant}
            rank={
              rankedParticipants.findIndex(
                (participant) => participant._id === selectedParticipant._id
              ) + 1
            }
            onClose={closeParticipant}
          />
        ) : null
      }
    >
      <div className="crt-program">
        <div className="crt-sky" aria-hidden="true">
          <span className="crt-laser crt-laser-a" />
          <span className="crt-laser crt-laser-b" />
          <span className="crt-rainbow" />
          <span className="crt-cupid">👼</span>
          <span className="crt-unicorn">🦄</span>
          <span className="crt-star crt-star-a">✦</span>
          <span className="crt-star crt-star-b">✧</span>
          <span className="crt-star crt-star-c">✦</span>
        </div>

        <header className="crt-hero">
          <p className="crt-kicker">LIVE VANUIT HET VRIJGEZELLENFEEST</p>
          <h1 className="crt-logo" aria-label="Wie Wordt de Vrouw van Tommie">
            <span>WIE WORDT DE VROUW VAN</span>
            <strong>TOMMIE</strong>
          </h1>
          <div className="crt-telemetry-strip">
            <span>♥</span>
            <b>LOVE TELEMETRY v1.99</b>
            <span>♥</span>
          </div>
        </header>

        <div className="crt-dashboard">
          <div className="crt-left-column">
            <MoneyPile amount={scoreboard.tommieMoney} />
            <div className="crt-equalizer" aria-hidden="true">
              {Array.from({ length: 14 }, (_, index) => (
                <i key={index} style={{ height: `${22 + ((index * 29) % 70)}%` }} />
              ))}
            </div>
          </div>

          <div className="crt-main-column">
            <Podium participants={podiumParticipants} onSelect={setSelectedParticipantId} />
            <RankingList
              participants={rankedParticipants}
              onSelect={setSelectedParticipantId}
            />
          </div>

          <div className="crt-right-column">
            <DateTelemetry eligibleCount={eligibleCount} />
            <div className="crt-command-pad" aria-hidden="true">
              <span>💋</span><span>♥</span><span>🍸</span>
              <span>⚡</span><span>★</span><span>☠</span>
            </div>
          </div>
        </div>

        <footer className="crt-taskbar" aria-hidden="true">
          <b><span>💘</span> START</b>
          <span>📈</span><span>🌍</span><span>📡</span><span>💾</span><span>🎛️</span>
          <i>● TRANSMITTING</i>
        </footer>
      </div>
    </BroadcastFrame>
  );
}

export function ScoreboardClient() {
  return (
    <ScoreboardErrorBoundary>
      <ScoreboardContent />
    </ScoreboardErrorBoundary>
  );
}
