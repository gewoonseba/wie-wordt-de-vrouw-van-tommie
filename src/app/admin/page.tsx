"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { DateEligibilityControl } from "@/components/admin/DateEligibilityControl";
import { MoneyAdjustmentForm } from "@/components/admin/MoneyAdjustmentForm";
import { ParticipantManager } from "@/components/admin/ParticipantManager";
import { ResetStartingStateButton } from "@/components/admin/ResetStartingStateButton";
import { ScoreAdjustmentForm } from "@/components/admin/ScoreAdjustmentForm";
import {
  clearAdminToken,
  useAdminToken
} from "@/components/admin/useAdminToken";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getInitials } from "@/lib/text";

export default function AdminDashboardPage() {
  const adminToken = useAdminToken();
  const router = useRouter();
  const scoreboard = useQuery(api.scoreboard.get, adminToken ? {} : "skip");
  const participants = useQuery(api.participants.listForAdmin, adminToken ? { adminToken } : "skip");

  function onSessionExpired() {
    clearAdminToken();
    router.replace("/admin/login");
  }

  if (!adminToken) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h1">Admin login required</CardTitle>
            <CardDescription>
              Log in to update scores, date eligibility, and Tommie&apos;s pot.
            </CardDescription>
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />

      <Card>
        <CardHeader>
          <CardTitle as="h2">Tommie&apos;s pot</CardTitle>
          <CardDescription>
            Add newly earned money or enter a negative correction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scoreboard ? (
            <MoneyAdjustmentForm
              adminToken={adminToken}
              currentTotal={scoreboard.tommieMoney}
              onSessionExpired={onSessionExpired}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Loading current total…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Startstand</CardTitle>
          <CardDescription>
            Herstel alle punten, date-statussen en Tommie&apos;s pot naar de ingestelde beginstand.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetStartingStateButton
            adminToken={adminToken}
            onSessionExpired={onSessionExpired}
          />
        </CardContent>
      </Card>

      {participants ? (
        <ParticipantManager
          adminToken={adminToken}
          onSessionExpired={onSessionExpired}
          participants={participants}
        />
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Deelnemersbeheer laden…</p>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="participant-controls" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight" id="participant-controls">
            Participants
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter signed score adjustments and set the exact date status.
          </p>
        </div>

        {!scoreboard ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Loading participants…</p>
            </CardContent>
          </Card>
        ) : scoreboard.participants.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle as="h3">No active participants</CardTitle>
              <CardDescription>
                Prepare the event roster in Convex before using this control room.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {scoreboard.participants.map((participant) => (
              <Card key={participant._id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar size="lg">
                      {participant.photoUrl ? (
                        <AvatarImage alt="" src={participant.photoUrl} />
                      ) : null}
                      <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle as="h3" className="truncate">
                        {participant.name}
                      </CardTitle>
                      <CardDescription>{participant.points} points</CardDescription>
                    </div>
                    <Badge variant={participant.canDate ? "default" : "secondary"}>
                      {participant.canDate ? "Date allowed" : "No date"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.7fr)]">
                  <ScoreAdjustmentForm
                    adminToken={adminToken}
                    currentScore={participant.points}
                    onSessionExpired={onSessionExpired}
                    participantId={participant._id}
                    participantName={participant.name}
                  />
                  <DateEligibilityControl
                    adminToken={adminToken}
                    canDate={participant.canDate}
                    onSessionExpired={onSessionExpired}
                    participantId={participant._id}
                    participantName={participant.name}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
