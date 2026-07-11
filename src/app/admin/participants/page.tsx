"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../../../../convex/_generated/api";
import { AdminNav } from "@/components/admin/AdminNav";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { createParticipantUrl, generateToken } from "@/lib/tokens";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
import { getInitials } from "@/lib/text";

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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle as="h1">Admin login required</CardTitle>
            <CardDescription>Login to manage participants.</CardDescription>
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <AdminNav />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Add participant</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={onCreateParticipant}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="participantName">Name</FieldLabel>
                <Input
                  id="participantName"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Gaetan"
                />
              </Field>
              <Button type="submit">Add player</Button>
            </FieldGroup>
          </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">Create team</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={onCreateTeam}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="teamName">Team name</FieldLabel>
                <Input
                  id="teamName"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="Team Pisang"
                />
              </Field>
              <Button type="submit">Create team</Button>
            </FieldGroup>
          </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Team assignment</CardTitle>
          <CardDescription>Select a team and toggle its members.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="teamSelect">Team</FieldLabel>
            <Select
              value={selectedTeamId || null}
              onValueChange={(value) => setSelectedTeamId(value ?? "")}
            >
              <SelectTrigger id="teamSelect" className="w-full">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {teams?.map((team) => (
                    <SelectItem key={team._id} value={team._id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        {selectedTeamId ? (
          <div className="flex flex-wrap gap-3">
            {participants?.map((participant) => {
              const selectedTeam = teams?.find(
                (team) => team._id === selectedTeamId
              );
              const isMember =
                selectedTeam?.participantIds.includes(participant._id) ?? false;
              return (
                <Field
                  className="w-auto rounded-3xl border bg-card px-3 py-2"
                  key={participant._id}
                  orientation="horizontal"
                >
                  <Checkbox
                    aria-label={`Include ${participant.name} in selected team`}
                    checked={isMember}
                    onCheckedChange={(checked) =>
                      toggleTeamMember(participant._id, checked)
                    }
                  />
                  <FieldLabel>{participant.name}</FieldLabel>
                </Field>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a team to edit its members.
          </p>
        )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle as="h2">Participants</CardTitle>
        </CardHeader>
        <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Photo upload</TableHead>
              <TableHead>QR token</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants?.map((participant) => (
              <TableRow key={participant._id}>
                <TableCell>
                  <Avatar size="lg">
                    {participant.photoUrl ? (
                      <AvatarImage alt="" src={participant.photoUrl} />
                    ) : null}
                    <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Name for ${participant.name}`}
                    className="min-w-40"
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
                </TableCell>
                <TableCell>{participant.points}</TableCell>
                <TableCell>
                  <Button
                    aria-label={`Set date status for ${participant.name}`}
                    type="button"
                    variant={participant.canDate ? "default" : "secondary"}
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
                  </Button>
                </TableCell>
                <TableCell>
                  <Input
                    aria-label={`Upload photo for ${participant.name}`}
                    className="min-w-52"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        onUploadPhoto(participant._id, file);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    aria-label={`Generate QR token for ${participant.name}`}
                    type="button"
                    onClick={() => onGenerateQr(participant._id)}
                  >
                    Generate QR
                  </Button>
                  {generatedUrls[participant._id] ? (
                    <div className="mt-3 flex max-w-72 flex-col gap-2">
                      <QRCodeSVG value={generatedUrls[participant._id]} size={96} />
                      <p className="break-all text-xs text-muted-foreground">
                        {generatedUrls[participant._id]}
                      </p>
                      <Badge variant="secondary">Generated</Badge>
                    </div>
                  ) : null}
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
