"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { CardRank, CARD_RANKS, isCardRank } from "@/lib/game-rules";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

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

const DATE_TASKS = [
  "Koprol",
  "Handstand",
  "Blote poep laten zien",
  "Danske placeren",
  "Een mop vertellen"
];

const MONEY_SOURCES = [
  { value: "hiddenTask", label: "Hidden quiz task" },
  { value: "jokerUse", label: "Joker use" },
  { value: "standardChallenge", label: "Tommie challenge" },
  { value: "roundThreeWin", label: "Round 3 win" },
  { value: "dateMoment", label: "Date moment" },
  { value: "manual", label: "Manual adjustment" }
];

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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h1">Admin login required</CardTitle>
            <CardDescription>Login to manage scoring.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/admin/login" />}>
              Login
            </Button>
          </CardContent>
        </Card>
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      {error ? <FieldError>{error}</FieldError> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Resolve physical card draw</CardTitle>
            <CardDescription>Record cards from a pending or manual draw.</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={submitCardDraw}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="obligation">Pending draw</FieldLabel>
                <Select
                  value={obligationId || null}
                  onValueChange={(value) => setObligationId(value ?? "")}
                >
                  <SelectTrigger id="obligation" className="w-full">
                    <SelectValue placeholder="Manual draw" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {pendingDraws?.map((draw) => (
                        <SelectItem key={draw._id} value={draw._id}>
                          {participantById.get(draw.participantId)?.name ??
                            "Player"}{" "}
                          - {draw.cardCount} cards - {draw.activityLabel}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            {!selectedObligation ? (
              <>
                <Field>
                  <FieldLabel htmlFor="cardParticipant">Participant</FieldLabel>
                  <Select
                    value={cardParticipantId || null}
                    onValueChange={(value) => setCardParticipantId(value ?? "")}
                  >
                    <SelectTrigger id="cardParticipant" className="w-full">
                      <SelectValue placeholder="Select participant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {participants?.map((participant) => (
                          <SelectItem key={participant._id} value={participant._id}>
                            {participant.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cardReason">Reason</FieldLabel>
                  <Input
                    id="cardReason"
                    value={cardReason}
                    onChange={(event) => setCardReason(event.target.value)}
                  />
                </Field>
              </>
            ) : null}
              <Field>
                <FieldLabel htmlFor="cards">Cards drawn</FieldLabel>
                <Input
                id="cards"
                value={cardInput}
                onChange={(event) => setCardInput(event.target.value)}
                placeholder="A, 7, K"
              />
              </Field>
            <div className="flex flex-wrap gap-2" aria-label="Card ranks">
              {CARD_RANKS.map((rank) => (
                <Button
                  size="sm"
                  type="button"
                  key={rank}
                  variant="outline"
                  onClick={() =>
                    setCardInput((current) =>
                      current ? `${current}, ${rank}` : rank
                    )
                  }
                >
                  {rank}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">
                Save draw
              </Button>
              <Button type="button" variant="outline" onClick={() => setCardInput("")}>
                Clear cards
              </Button>
            </div>
            </FieldGroup>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Tommie Date</CardTitle>
            <CardDescription>Start and complete date tasks.</CardDescription>
          </CardHeader>
          <CardContent>
          <form onSubmit={submitDateStart}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="dateParticipant">
                  Eligible participant
                </FieldLabel>
                <Select
                  value={dateParticipantId || null}
                  onValueChange={(value) => setDateParticipantId(value ?? "")}
                >
                  <SelectTrigger id="dateParticipant" className="w-full">
                    <SelectValue placeholder="Select participant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {dateReadyPlayers?.map((participant) => (
                        <SelectItem key={participant._id} value={participant._id}>
                          {participant.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="dateTask">Task</FieldLabel>
                <Select
                  value={dateTask}
                  onValueChange={(value) => setDateTask(value ?? "")}
                >
                  <SelectTrigger id="dateTask" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DATE_TASKS.map((task) => (
                        <SelectItem key={task} value={task}>
                          {task}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!dateParticipantId}>
                Start date
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!dateParticipantId}
                onClick={() => finishDate(true)}
              >
                Mark success
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!dateParticipantId}
                onClick={() => finishDate(false)}
              >
                Mark failed
              </Button>
            </div>
            </FieldGroup>
          </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Quiz rewards</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={submitQuiz}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="quizLabel">Round label</FieldLabel>
                <Input
                  id="quizLabel"
                  value={quizLabel}
                  onChange={(event) => setQuizLabel(event.target.value)}
                />
              </Field>
            {teams?.map((team) => (
              <Field key={team._id}>
                <FieldLabel htmlFor={`quiz-${team._id}`}>
                  {team.name} score
                </FieldLabel>
                <Input
                  id={`quiz-${team._id}`}
                  name={`quiz-${team._id}`}
                  type="number"
                />
              </Field>
            ))}
            <Button type="submit">
              Create draw obligations
            </Button>
            </FieldGroup>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Mini-game rewards</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={submitMiniGame}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="miniLabel">Game label</FieldLabel>
                <Input
                  id="miniLabel"
                  value={miniGameLabel}
                  onChange={(event) => setMiniGameLabel(event.target.value)}
                />
              </Field>
            {teams?.map((team) => (
              <Field key={team._id}>
                <FieldLabel htmlFor={`mini-${team._id}`}>
                  {team.name} cards per person
                </FieldLabel>
                <Input
                  id={`mini-${team._id}`}
                  name={`mini-${team._id}`}
                  type="number"
                  min="0"
                  max="5"
                />
              </Field>
            ))}
            <Button type="submit">
              Create draw obligations
            </Button>
            </FieldGroup>
          </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Tommie money</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={submitMoney}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="moneySource">Source</FieldLabel>
                <Select
                  value={moneySource}
                  onValueChange={(value) => setMoneySource(value ?? "")}
                >
                  <SelectTrigger id="moneySource" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {MONEY_SOURCES.map((source) => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="moneyAmount">Amount</FieldLabel>
                <Input
                  id="moneyAmount"
                  type="number"
                  value={moneyAmount}
                  onChange={(event) => setMoneyAmount(Number(event.target.value))}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="moneyNote">Note</FieldLabel>
                <Input
                  id="moneyNote"
                  value={moneyNote}
                  onChange={(event) => setMoneyNote(event.target.value)}
                />
              </Field>
            <Button type="submit">
              Add money
            </Button>
            </FieldGroup>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Settings</CardTitle>
          </CardHeader>
          <CardContent>
          {settings ? (
            <form onSubmit={saveSettings}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="tommieTarget">Tommie target</FieldLabel>
                  <Input
                    id="tommieTarget"
                    name="tommieTarget"
                    type="number"
                    defaultValue={settings.tommieTarget}
                  />
                </Field>
              {Object.entries(settings.defaultPayouts).map(([key, value]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={key}>{key}</FieldLabel>
                  <Input
                    id={key}
                    name={key}
                    type="number"
                    defaultValue={Number(value)}
                  />
                </Field>
              ))}
              <Button type="submit">
                Save settings
              </Button>
              </FieldGroup>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Recent events</CardTitle>
        </CardHeader>
        <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Money</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((event) => (
              <TableRow key={event._id}>
                <TableCell>{event.type}</TableCell>
                <TableCell>{event.pointsDelta ?? ""}</TableCell>
                <TableCell>{event.moneyDelta ?? ""}</TableCell>
                <TableCell>
                  <code className="break-all text-xs">
                    {JSON.stringify(event.payload)}
                  </code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
    </main>
  );
}
