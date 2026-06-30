"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function ViewerClient({ token }: { token: string }) {
  const dashboard = useQuery(api.viewer.dashboard, { token });

  if (dashboard === undefined) {
    return (
      <main className="page narrow">
        <section className="panel">
          <h1>Loading...</h1>
        </section>
      </main>
    );
  }

  if (!dashboard.authorized) {
    return (
      <main className="page narrow">
        <section className="panel">
          <h1>Invalid QR code</h1>
          <p className="muted">Ask the host for a fresh participant QR code.</p>
        </section>
      </main>
    );
  }

  const participants = [...dashboard.participants].sort(
    (a, b) => b.points - a.points
  );
  const viewer = participants.find(
    (participant) => participant._id === dashboard.viewerParticipantId
  );
  const money = dashboard.settings.tommieMoney;
  const target = dashboard.settings.tommieTarget;
  const progress = Math.min(100, Math.round((money / target) * 100));

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Live tracker</p>
        <h1>Wie wordt de vrouw van Tommie?</h1>
        {viewer ? (
          <p>
            You are viewing as <strong>{viewer.name}</strong>. Date status:{" "}
            <span className={viewer.canDate ? "pill ok" : "pill warn"}>
              {viewer.canDate ? "Can date" : "Date spent"}
            </span>
          </p>
        ) : null}
      </section>

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>Tommie honeymoon money</h2>
          <div className="score">EUR {money.toLocaleString("nl-BE")}</div>
          <p className="muted">Target: EUR {target.toLocaleString("nl-BE")}</p>
          <div className="money-bar" aria-label={`${progress}%`}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="panel">
          <h2>Your score</h2>
          <div className="score">{viewer?.points ?? 0}</div>
          <p className="muted">Physical card draws are entered by the host.</p>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Leaderboard</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Points</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant, index) => (
              <tr key={participant._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {participant.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="avatar" src={participant.photoUrl} alt="" />
                    ) : (
                      <div className="avatar" />
                    )}
                    <strong>
                      {index + 1}. {participant.name}
                    </strong>
                  </div>
                </td>
                <td>{participant.points}</td>
                <td>
                  <span className={participant.canDate ? "pill ok" : "pill"}>
                    {participant.canDate ? "Can date" : "Spent"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Recent action</h2>
        {dashboard.events.length ? (
          <table className="table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Points</th>
                <th>Money</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.events.map((event) => (
                <tr key={event._id}>
                  <td>{event.type.replaceAll("_", " ")}</td>
                  <td>{event.pointsDelta ?? ""}</td>
                  <td>{event.moneyDelta ? `EUR ${event.moneyDelta}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No events yet.</p>
        )}
      </section>
    </main>
  );
}
