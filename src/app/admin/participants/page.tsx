"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { createParticipantUrl, generateToken } from "@/lib/tokens";

export default function ParticipantsPage() {
  const adminToken = useAdminToken();
  const participants = useQuery(
    api.participants.list,
    adminToken ? { adminToken } : "skip"
  );
  const teams = useQuery(api.teams.list, adminToken ? { adminToken } : "skip");
  const createParticipant = useMutation(api.participants.create);
  const updateParticipant = useMutation(api.participants.update);
  const setPhoto = useMutation(api.participants.setPhoto);
  const createParticipantToken = useMutation(
    api.authTokens.createParticipantToken
  );
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createTeam = useMutation(api.teams.create);
  const updateMembers = useMutation(api.teams.updateMembers);

  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [generatedUrls, setGeneratedUrls] = useState<Record<string, string>>({});
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const baseUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return process.env.NEXT_PUBLIC_APP_URL ?? "";
    }
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }, []);

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

  async function onCreateParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }
    await createParticipant({ adminToken, name: name.trim() });
    setName("");
  }

  async function onCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teamName.trim()) {
      return;
    }
    await createTeam({ adminToken, name: teamName.trim() });
    setTeamName("");
  }

  async function onGenerateQr(participantId: string) {
    const rawToken = generateToken(40);
    await createParticipantToken({
      adminToken,
      participantId: participantId as any,
      rawToken
    });
    setGeneratedUrls((current) => ({
      ...current,
      [participantId]: createParticipantUrl(baseUrl, rawToken)
    }));
  }

  async function onUploadPhoto(participantId: string, file: File) {
    const uploadUrl = await generateUploadUrl({ adminToken });
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file
    });
    const { storageId } = await result.json();
    await setPhoto({
      adminToken,
      participantId: participantId as any,
      storageId
    });
  }

  async function toggleTeamMember(participantId: string, isChecked: boolean) {
    const team = teams?.find((candidate) => candidate._id === selectedTeamId);
    if (!team) {
      return;
    }
    const nextIds = isChecked
      ? [...new Set([...team.participantIds, participantId])]
      : team.participantIds.filter((id) => id !== participantId);
    await updateMembers({
      adminToken,
      teamId: team._id,
      participantIds: nextIds as any
    });
  }

  return (
    <main className="page">
      <AdminNav />
      <div className="grid">
        <section className="panel">
          <h2>Add participant</h2>
          <form onSubmit={onCreateParticipant}>
            <div className="field">
              <label htmlFor="participantName">Name</label>
              <input
                id="participantName"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Gaetan"
              />
            </div>
            <button className="primary" type="submit">
              Add player
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Create team</h2>
          <form onSubmit={onCreateTeam}>
            <div className="field">
              <label htmlFor="teamName">Team name</label>
              <input
                id="teamName"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                placeholder="Team Pisang"
              />
            </div>
            <button className="primary" type="submit">
              Create team
            </button>
          </form>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Team assignment</h2>
        <div className="field">
          <label htmlFor="teamSelect">Team</label>
          <select
            id="teamSelect"
            value={selectedTeamId}
            onChange={(event) => setSelectedTeamId(event.target.value)}
          >
            <option value="">Select a team</option>
            {teams?.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        {selectedTeamId ? (
          <div className="card-list">
            {participants?.map((participant) => {
              const selectedTeam = teams?.find(
                (team) => team._id === selectedTeamId
              );
              const isMember =
                selectedTeam?.participantIds.includes(participant._id) ?? false;
              return (
                <label className="pill" key={participant._id}>
                  <input
                    type="checkbox"
                    checked={isMember}
                    onChange={(event) =>
                      toggleTeamMember(participant._id, event.target.checked)
                    }
                    style={{ width: "auto", minHeight: 0 }}
                  />
                  {participant.name}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="muted">Select a team to edit its members.</p>
        )}
      </section>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Participants</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Points</th>
              <th>Date</th>
              <th>Photo upload</th>
              <th>QR token</th>
            </tr>
          </thead>
          <tbody>
            {participants?.map((participant) => (
              <tr key={participant._id}>
                <td>
                  {participant.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="avatar"
                      alt=""
                      src={participant.photoUrl}
                    />
                  ) : (
                    <div className="avatar" />
                  )}
                </td>
                <td>
                  <input
                    value={participant.name}
                    onChange={(event) =>
                      updateParticipant({
                        adminToken,
                        participantId: participant._id,
                        name: event.target.value,
                        currentTeamId: participant.currentTeamId,
                        canDate: participant.canDate
                      })
                    }
                  />
                </td>
                <td>{participant.points}</td>
                <td>
                  <button
                    type="button"
                    onClick={() =>
                      updateParticipant({
                        adminToken,
                        participantId: participant._id,
                        name: participant.name,
                        currentTeamId: participant.currentTeamId,
                        canDate: !participant.canDate
                      })
                    }
                  >
                    {participant.canDate ? "Can date" : "Spent"}
                  </button>
                </td>
                <td>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        onUploadPhoto(participant._id, file);
                      }
                    }}
                  />
                </td>
                <td>
                  <button type="button" onClick={() => onGenerateQr(participant._id)}>
                    Generate QR
                  </button>
                  {generatedUrls[participant._id] ? (
                    <div style={{ marginTop: 10 }}>
                      <QRCodeSVG value={generatedUrls[participant._id]} size={96} />
                      <p className="muted" style={{ wordBreak: "break-all" }}>
                        {generatedUrls[participant._id]}
                      </p>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
