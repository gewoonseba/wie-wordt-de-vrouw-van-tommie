"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { CardRank, CARD_RANKS, isCardRank } from "@/lib/game-rules";

function parseCards(input: string): CardRank[] {
  return input
    .split(/[,\s]+/)
    .map((card) => card.trim().toUpperCase())
    .filter(Boolean)
    .map((card) => {
      if (!isCardRank(card)) {
        throw new Error(`Unknown card rank: ${card}`);
      }
      return card;
    });
}

export default function ScoringPage() {
  const adminToken = useAdminToken();
  const participants = useQuery(
    api.participants.list,
    adminToken ? { adminToken } : "skip"
  );
  const teams = useQuery(api.teams.list, adminToken ? { adminToken } : "skip");
  const pendingDraws = useQuery(
    api.scoring.listPendingDraws,
    adminToken ? { adminToken } : "skip"
  );
  const events = useQuery(
    api.scoring.recentEvents,
    adminToken ? { adminToken, limit: 20 } : "skip"
  );
  const settings = useQuery(
    api.settings.getAdmin,
    adminToken ? { adminToken } : "skip"
  );

  const recordCardDraw = useMutation(api.scoring.recordCardDraw);
  const startDate = useMutation(api.scoring.startDate);
  const completeDate = useMutation(api.scoring.completeDate);
  const recordQuizRewards = useMutation(api.scoring.recordQuizRewards);
  const recordMiniGameRewards = useMutation(api.scoring.recordMiniGameRewards);
  const addTommieMoney = useMutation(api.scoring.addTommieMoney);
  const updateSettings = useMutation(api.settings.update);

  const [cardParticipantId, setCardParticipantId] = useState("");
  const [cardInput, setCardInput] = useState("");
  const [cardReason, setCardReason] = useState("Manual card draw");
  const [obligationId, setObligationId] = useState("");
  const [dateParticipantId, setDateParticipantId] = useState("");
  const [dateTask, setDateTask] = useState("Een mop vertellen");
  const [moneySource, setMoneySource] = useState("standardChallenge");
  const [moneyAmount, setMoneyAmount] = useState(500);
  const [moneyNote, setMoneyNote] = useState("");
  const [quizLabel, setQuizLabel] = useState("Quiz round");
  const [miniGameLabel, setMiniGameLabel] = useState("Mini-game");
  const [error, setError] = useState("");

  const participantById = useMemo<Map<string, any>>(() => {
    return new Map(
      ((participants ?? []) as any[]).map((participant) => [
        participant._id,
        participant
      ])
    );
  }, [participants]);

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

  async function submitCardDraw(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const selectedObligation = pendingDraws?.find(
        (draw) => draw._id === obligationId
      );
      const participantId =
        selectedObligation?.participantId ?? cardParticipantId;

      if (!participantId) {
        throw new Error("Select a participant or pending draw.");
      }

      await recordCardDraw({
        adminToken,
        participantId: participantId as any,
        cards: parseCards(cardInput),
        reason: selectedObligation?.activityLabel ?? cardReason,
        obligationId: obligationId ? (obligationId as any) : undefined
      });
      setCardInput("");
      setObligationId("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Card draw failed.");
    }
  }

  async function submitDateStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await startDate({
        adminToken,
        participantId: dateParticipantId as any,
        task: dateTask
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Date start failed.");
    }
  }

  async function finishDate(success: boolean) {
    setError("");
    try {
      await completeDate({
        adminToken,
        participantId: dateParticipantId as any,
        task: dateTask,
        success,
        awardTommieMoney: success
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Date completion failed.");
    }
  }

  async function submitQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const scores =
      teams?.map((team) => ({
        teamId: team._id,
        score: Number(form.get(`quiz-${team._id}`) ?? 0)
      })) ?? [];

    await recordQuizRewards({ adminToken, label: quizLabel, scores });
  }

  async function submitMiniGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rewards =
      teams?.map((team) => ({
        teamId: team._id,
        cardCount: Number(form.get(`mini-${team._id}`) ?? 0)
      })) ?? [];

    await recordMiniGameRewards({ adminToken, label: miniGameLabel, rewards });
  }

  async function submitMoney(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addTommieMoney({
      adminToken,
      source: moneySource,
      amount: moneyAmount,
      note: moneyNote || undefined
    });
    setMoneyNote("");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) {
      return;
    }
    const form = new FormData(event.currentTarget);
    await updateSettings({
      adminToken,
      tommieTarget: Number(form.get("tommieTarget")),
      defaultPayouts: {
        hiddenTask: Number(form.get("hiddenTask")),
        jokerUse: Number(form.get("jokerUse")),
        standardChallenge: Number(form.get("standardChallenge")),
        roundThreeWin: Number(form.get("roundThreeWin")),
        dateMoment: Number(form.get("dateMoment"))
      }
    });
  }

  const selectedObligation = pendingDraws?.find(
    (draw) => draw._id === obligationId
  );
  const dateReadyPlayers = participants?.filter((participant) => participant.canDate);

  return (
    <main className="page">
      <AdminNav />
      {error ? <p className="error">{error}</p> : null}

      <div className="grid">
        <section className="panel">
          <h2>Resolve physical card draw</h2>
          <form onSubmit={submitCardDraw}>
            <div className="field">
              <label htmlFor="obligation">Pending draw</label>
              <select
                id="obligation"
                value={obligationId}
                onChange={(event) => setObligationId(event.target.value)}
              >
                <option value="">Manual draw</option>
                {pendingDraws?.map((draw) => (
                  <option key={draw._id} value={draw._id}>
                    {participantById.get(draw.participantId)?.name ?? "Player"} -{" "}
                    {draw.cardCount} cards - {draw.activityLabel}
                  </option>
                ))}
              </select>
            </div>
            {!selectedObligation ? (
              <>
                <div className="field">
                  <label htmlFor="cardParticipant">Participant</label>
                  <select
                    id="cardParticipant"
                    value={cardParticipantId}
                    onChange={(event) => setCardParticipantId(event.target.value)}
                  >
                    <option value="">Select participant</option>
                    {participants?.map((participant) => (
                      <option key={participant._id} value={participant._id}>
                        {participant.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="cardReason">Reason</label>
                  <input
                    id="cardReason"
                    value={cardReason}
                    onChange={(event) => setCardReason(event.target.value)}
                  />
                </div>
              </>
            ) : null}
            <div className="field">
              <label htmlFor="cards">Cards drawn</label>
              <input
                id="cards"
                value={cardInput}
                onChange={(event) => setCardInput(event.target.value)}
                placeholder="A, 7, K"
              />
            </div>
            <div className="card-list" aria-label="Card ranks">
              {CARD_RANKS.map((rank) => (
                <button
                  className="card-button"
                  type="button"
                  key={rank}
                  onClick={() =>
                    setCardInput((current) =>
                      current ? `${current}, ${rank}` : rank
                    )
                  }
                >
                  {rank}
                </button>
              ))}
            </div>
            <div className="actions">
              <button className="primary" type="submit">
                Save draw
              </button>
              <button type="button" onClick={() => setCardInput("")}>
                Clear cards
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Tommie Date</h2>
          <form onSubmit={submitDateStart}>
            <div className="field">
              <label htmlFor="dateParticipant">Eligible participant</label>
              <select
                id="dateParticipant"
                value={dateParticipantId}
                onChange={(event) => setDateParticipantId(event.target.value)}
              >
                <option value="">Select participant</option>
                {dateReadyPlayers?.map((participant) => (
                  <option key={participant._id} value={participant._id}>
                    {participant.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dateTask">Task</label>
              <select
                id="dateTask"
                value={dateTask}
                onChange={(event) => setDateTask(event.target.value)}
              >
                <option>Koprol</option>
                <option>Handstand</option>
                <option>Blote poep laten zien</option>
                <option>Danske placeren</option>
                <option>Een mop vertellen</option>
              </select>
            </div>
            <div className="actions">
              <button className="primary" type="submit" disabled={!dateParticipantId}>
                Start date
              </button>
              <button
                type="button"
                disabled={!dateParticipantId}
                onClick={() => finishDate(true)}
              >
                Mark success
              </button>
              <button
                type="button"
                disabled={!dateParticipantId}
                onClick={() => finishDate(false)}
              >
                Mark failed
              </button>
            </div>
          </form>
        </section>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>Quiz rewards</h2>
          <form onSubmit={submitQuiz}>
            <div className="field">
              <label htmlFor="quizLabel">Round label</label>
              <input
                id="quizLabel"
                value={quizLabel}
                onChange={(event) => setQuizLabel(event.target.value)}
              />
            </div>
            {teams?.map((team) => (
              <div className="field" key={team._id}>
                <label htmlFor={`quiz-${team._id}`}>{team.name} score</label>
                <input id={`quiz-${team._id}`} name={`quiz-${team._id}`} type="number" />
              </div>
            ))}
            <button className="primary" type="submit">
              Create draw obligations
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Mini-game rewards</h2>
          <form onSubmit={submitMiniGame}>
            <div className="field">
              <label htmlFor="miniLabel">Game label</label>
              <input
                id="miniLabel"
                value={miniGameLabel}
                onChange={(event) => setMiniGameLabel(event.target.value)}
              />
            </div>
            {teams?.map((team) => (
              <div className="field" key={team._id}>
                <label htmlFor={`mini-${team._id}`}>{team.name} cards per person</label>
                <input
                  id={`mini-${team._id}`}
                  name={`mini-${team._id}`}
                  type="number"
                  min="0"
                  max="5"
                />
              </div>
            ))}
            <button className="primary" type="submit">
              Create draw obligations
            </button>
          </form>
        </section>
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="panel">
          <h2>Tommie money</h2>
          <form onSubmit={submitMoney}>
            <div className="field">
              <label htmlFor="moneySource">Source</label>
              <select
                id="moneySource"
                value={moneySource}
                onChange={(event) => setMoneySource(event.target.value)}
              >
                <option value="hiddenTask">Hidden quiz task</option>
                <option value="jokerUse">Joker use</option>
                <option value="standardChallenge">Tommie challenge</option>
                <option value="roundThreeWin">Round 3 win</option>
                <option value="dateMoment">Date moment</option>
                <option value="manual">Manual adjustment</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="moneyAmount">Amount</label>
              <input
                id="moneyAmount"
                type="number"
                value={moneyAmount}
                onChange={(event) => setMoneyAmount(Number(event.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="moneyNote">Note</label>
              <input
                id="moneyNote"
                value={moneyNote}
                onChange={(event) => setMoneyNote(event.target.value)}
              />
            </div>
            <button className="primary" type="submit">
              Add money
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Settings</h2>
          {settings ? (
            <form onSubmit={saveSettings}>
              <div className="field">
                <label htmlFor="tommieTarget">Tommie target</label>
                <input
                  id="tommieTarget"
                  name="tommieTarget"
                  type="number"
                  defaultValue={settings.tommieTarget}
                />
              </div>
              {Object.entries(settings.defaultPayouts).map(([key, value]) => (
                <div className="field" key={key}>
                  <label htmlFor={key}>{key}</label>
                  <input
                    id={key}
                    name={key}
                    type="number"
                    defaultValue={Number(value)}
                  />
                </div>
              ))}
              <button className="primary" type="submit">
                Save settings
              </button>
            </form>
          ) : (
            <p className="muted">Loading settings...</p>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Recent events</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Points</th>
              <th>Money</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {events?.map((event) => (
              <tr key={event._id}>
                <td>{event.type}</td>
                <td>{event.pointsDelta ?? ""}</td>
                <td>{event.moneyDelta ?? ""}</td>
                <td>
                  <code>{JSON.stringify(event.payload)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
