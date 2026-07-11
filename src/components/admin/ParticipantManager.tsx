"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation } from "convex/react";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/text";

type Participant = {
  _id: Id<"participants">;
  name: string;
  photoUrl: string | null;
  isActive: boolean;
};

type ParticipantManagerProps = {
  adminToken: string;
  participants: Participant[];
  onSessionExpired: () => void;
};

async function uploadPhoto(uploadUrl: string, photo: File) {
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": photo.type || "image/png" },
    body: photo
  });
  if (!response.ok) {
    throw new Error("Photo upload failed.");
  }
  const body = (await response.json()) as { storageId?: Id<"_storage"> };
  if (!body.storageId) {
    throw new Error("Photo upload did not return a storage ID.");
  }
  return body.storageId;
}

export function ParticipantManager({
  adminToken,
  participants,
  onSessionExpired
}: ParticipantManagerProps) {
  const createParticipant = useMutation(api.participants.create);
  const updateParticipant = useMutation(api.participants.update);
  const generateUploadUrl = useMutation(api.participants.generatePhotoUploadUrl);
  const [newName, setNewName] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleError(error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save participant.";
    if (message.includes("Admin session is missing or expired")) {
      onSessionExpired();
      return;
    }
    setError(message);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsCreating(true);
    try {
      let photoStorageId: Id<"_storage"> | undefined;
      if (newPhoto) {
        photoStorageId = await uploadPhoto(
          await generateUploadUrl({ adminToken }),
          newPhoto
        );
      }
      await createParticipant({ adminToken, name: newName, photoStorageId });
      setNewName("");
      setNewPhoto(null);
      event.currentTarget.reset();
    } catch (error) {
      handleError(error);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section aria-labelledby="roster-management" className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold tracking-tight" id="roster-management">
          Deelnemers beheren
        </h2>
        <p className="text-sm text-muted-foreground">
          Voeg deelnemers toe, wijzig hun naam of foto en bepaal wie op het scorebord staat.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle as="h3">Nieuwe deelnemer</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={create}>
            <div className="grid gap-2">
              <Label htmlFor="new-participant-name">Naam</Label>
              <Input
                id="new-participant-name"
                maxLength={80}
                onChange={(event) => setNewName(event.target.value)}
                required
                value={newName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-participant-photo">Foto</Label>
              <Input
                accept="image/*"
                id="new-participant-photo"
                onChange={(event) => setNewPhoto(event.target.files?.[0] ?? null)}
                type="file"
              />
            </div>
            <Button disabled={isCreating} type="submit">
              {isCreating ? "Opslaan…" : "Toevoegen"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {participants.map((participant) => (
          <ParticipantEditor
            adminToken={adminToken}
            generateUploadUrl={generateUploadUrl}
            key={participant._id}
            onError={handleError}
            participant={participant}
            updateParticipant={updateParticipant}
          />
        ))}
      </div>
    </section>
  );
}

function ParticipantEditor({
  adminToken,
  generateUploadUrl,
  onError,
  participant,
  updateParticipant
}: {
  adminToken: string;
  generateUploadUrl: (args: { adminToken: string }) => Promise<string>;
  onError: (error: unknown) => void;
  participant: Participant;
  updateParticipant: (args: {
    adminToken: string;
    participantId: Id<"participants">;
    name: string;
    isActive: boolean;
    photoStorageId?: Id<"_storage">;
  }) => Promise<unknown>;
}) {
  const [name, setName] = useState(participant.name);
  const [isActive, setIsActive] = useState(participant.isActive);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      const photoStorageId = photo
        ? await uploadPhoto(await generateUploadUrl({ adminToken }), photo)
        : undefined;
      await updateParticipant({
        adminToken,
        participantId: participant._id,
        name,
        isActive,
        photoStorageId
      });
      setPhoto(null);
      event.currentTarget.reset();
    } catch (error) {
      onError(error);
    } finally {
      setIsSaving(false);
    }
  }

  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    setPhoto(event.target.files?.[0] ?? null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            {participant.photoUrl ? <AvatarImage alt="" src={participant.photoUrl} /> : null}
            <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle as="h3">{participant.name}</CardTitle>
            <CardDescription>{participant.isActive ? "Actief" : "Verborgen"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={save}>
          <div className="grid gap-2">
            <Label htmlFor={`participant-name-${participant._id}`}>Naam</Label>
            <Input
              id={`participant-name-${participant._id}`}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`participant-photo-${participant._id}`}>Vervang foto</Label>
            <Input
              accept="image/*"
              id={`participant-photo-${participant._id}`}
              onChange={changePhoto}
              type="file"
            />
          </div>
          <Label className="flex items-center gap-2" htmlFor={`participant-active-${participant._id}`}>
            <Checkbox
              checked={isActive}
              id={`participant-active-${participant._id}`}
              onCheckedChange={(checked) => setIsActive(checked === true)}
            />
            Op scorebord tonen
          </Label>
          <Button disabled={isSaving} type="submit" variant="outline">
            {isSaving ? "Opslaan…" : "Wijzigingen opslaan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
