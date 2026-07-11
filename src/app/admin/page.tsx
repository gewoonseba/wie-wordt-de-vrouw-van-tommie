"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h1">Admin login required</CardTitle>
            <CardDescription>Login to manage the tracker.</CardDescription>
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

  const leaderboard = [...(participants ?? [])].sort(
    (a, b) => b.points - a.points
  );
  const money = settings?.tommieMoney ?? 0;
  const target = settings?.tommieTarget ?? 10000;
  const progress = Math.min(100, Math.round((money / target) * 100));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle as="h2">Pending physical draws</CardTitle>
            <CardDescription>Resolve these from the scoring screen.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {pendingDraws?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Date-ready players</CardTitle>
            <CardDescription>Players currently allowed to start a date.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
            {participants?.filter((participant) => participant.canDate).length ?? 0}
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
              {leaderboard.map((participant) => (
                <TableRow key={participant._id}>
                  <TableCell className="font-medium">{participant.name}</TableCell>
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
    </main>
  );
}
