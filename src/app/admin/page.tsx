"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { MoneyAdjustmentForm } from "@/components/admin/MoneyAdjustmentForm";
import { ParticipantManager } from "@/components/admin/ParticipantManager";
import { ResetStartingStateButton } from "@/components/admin/ResetStartingStateButton";
import {
  clearAdminToken,
  useAdminToken
} from "@/components/admin/useAdminToken";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  const adminToken = useAdminToken();
  const router = useRouter();
  const money = useQuery(api.settings.getTommieMoney, adminToken ? {} : "skip");
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
          {money ? (
            <MoneyAdjustmentForm
              adminToken={adminToken}
              currentTotal={money.tommieMoney}
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
    </main>
  );
}
