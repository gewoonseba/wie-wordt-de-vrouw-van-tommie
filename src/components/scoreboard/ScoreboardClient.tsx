"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyPile } from "@/components/scoreboard/MoneyPile";
import { Podium } from "@/components/scoreboard/Podium";
import { RankingList } from "@/components/scoreboard/RankingList";
import { rankParticipants, selectPodium } from "@/lib/scoreboard";

function ScoreboardStatus({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle as="h1">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </main>
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

function ScoreboardContent() {
  const scoreboard = useQuery(api.scoreboard.get);

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

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <Card>
        <CardHeader className="text-center">
          <CardDescription>Live vanuit het vrijgezellenfeest</CardDescription>
          <CardTitle as="h1" className="text-3xl sm:text-5xl">
            Wie wordt de vrouw van Tommie?
          </CardTitle>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            De stand wordt automatisch bijgewerkt.
          </p>
        </CardHeader>
      </Card>

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <Podium participants={podiumParticipants} />
        <MoneyPile amount={scoreboard.tommieMoney} />
      </div>

      <RankingList participants={rankedParticipants} />
    </main>
  );
}

export function ScoreboardClient() {
  return (
    <ScoreboardErrorBoundary>
      <ScoreboardContent />
    </ScoreboardErrorBoundary>
  );
}
