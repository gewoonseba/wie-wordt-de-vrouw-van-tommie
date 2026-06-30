"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAdminToken } from "@/components/admin/useAdminToken";

export default function AdminDashboardPage() {
  const adminToken = useAdminToken();
  const participants = useQuery(
    api.participants.list,
    adminToken ? { adminToken } : "skip"
  );
  const settings = useQuery(
    api.settings.getAdmin,
    adminToken ? { adminToken } : "skip"
  );
  const pendingDraws = useQuery(
    api.scoring.listPendingDraws,
    adminToken ? { adminToken } : "skip"
  );

  if (!adminToken) {
    return (
      <main className="page narrow">
        <section className="panel">
          <h1>Admin login required</h1>
          <Link className="button" href="/admin/login">
            Login
          </Link>
        </section>
      </main>
    );
  }

  const leaderboard = [...(participants ?? [])].sort(
    (a, b) => b.points - a.points
  );
  const money = settings?.tommieMoney ?? 0;
  const target = settings?.tommieTarget ?? 10000;
  const progress = Math.min(100, Math.round((money / target) * 100));

  return (
    <main className="page">
      <AdminNav />
      <div className="grid">
        <section className="panel">
          <h2>Tommie honeymoon money</h2>
          <div className="score">EUR {money.toLocaleString("nl-BE")}</div>
          <p className="muted">Target: EUR {target.toLocaleString("nl-BE")}</p>
          <div className="money-bar" aria-label={`${progress}%`}>
            <div style={{ width: `${progress}%` }} />
          </div>
        </section>
        <section className="panel">
          <h2>Pending physical draws</h2>
          <div className="score">{pendingDraws?.length ?? 0}</div>
          <p className="muted">Resolve these from the scoring screen.</p>
        </section>
        <section className="panel">
          <h2>Date-ready players</h2>
          <div className="score">
            {participants?.filter((participant) => participant.canDate).length ?? 0}
          </div>
          <p className="muted">Players currently allowed to start a date.</p>
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
            {leaderboard.map((participant) => (
              <tr key={participant._id}>
                <td>{participant.name}</td>
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
    </main>
  );
}
