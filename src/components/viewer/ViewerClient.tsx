"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { getInitials } from "@/lib/text";

export function ViewerClient({ token }: { token: string }) {
  const dashboard = useQuery(api.viewer.dashboard, { token });

  if (dashboard === undefined) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h1">Loading...</CardTitle>
            <CardDescription>Fetching the live tracker.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!dashboard.authorized) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h1">Invalid QR code</CardTitle>
            <CardDescription>
              Ask the host for a fresh participant QR code.
            </CardDescription>
          </CardHeader>
        </Card>
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardDescription>Live tracker</CardDescription>
          <CardTitle as="h1" className="text-3xl">
            Wie wordt de vrouw van Tommie?
          </CardTitle>
        </CardHeader>
        {viewer ? (
          <CardContent>
            <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
              You are viewing as{" "}
              <span className="font-medium text-foreground">{viewer.name}</span>.
              Date status:
              <Badge variant={viewer.canDate ? "default" : "secondary"}>
              {viewer.canDate ? "Can date" : "Date spent"}
              </Badge>
            </p>
          </CardContent>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Tommie honeymoon money</CardTitle>
            <CardDescription>
              Target: EUR {target.toLocaleString("nl-BE")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="text-3xl font-semibold tracking-tight">
              EUR {money.toLocaleString("nl-BE")}
            </div>
            <Progress aria-label={`${progress}%`} value={progress} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Your score</CardTitle>
            <CardDescription>
              Physical card draws are entered by the host.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {viewer?.points ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant, index) => (
                <TableRow key={participant._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="lg">
                        {participant.photoUrl ? (
                          <AvatarImage src={participant.photoUrl} alt="" />
                        ) : null}
                        <AvatarFallback>
                          {getInitials(participant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {index + 1}. {participant.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{participant.points}</TableCell>
                  <TableCell>
                    <Badge variant={participant.canDate ? "default" : "secondary"}>
                      {participant.canDate ? "Can date" : "Spent"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Recent action</CardTitle>
        </CardHeader>
        <CardContent>
        {dashboard.events.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Money</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboard.events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>{event.type.replaceAll("_", " ")}</TableCell>
                  <TableCell>{event.pointsDelta ?? ""}</TableCell>
                  <TableCell>
                    {event.moneyDelta ? `EUR ${event.moneyDelta}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        )}
        </CardContent>
      </Card>
    </main>
  );
}
