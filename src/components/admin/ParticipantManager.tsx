"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { IconEdit, IconX } from "@tabler/icons-react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { DateCompletedButton } from "@/components/admin/DateCompletedButton";
import { ScoreAdjustmentForm } from "@/components/admin/ScoreAdjustmentForm";
import { useDateEligibilityMutation } from "@/components/admin/useDateEligibilityMutation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isAdminSessionExpired } from "@/lib/admin-session";
import { getInitials } from "@/lib/text";

type Participant = FunctionReturnType<typeof api.participants.listForAdmin>[number];

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
    if (isAdminSessionExpired(error)) {
      onSessionExpired();
      return;
    }
    const message = error instanceof Error ? error.message : "Could not save participant.";
    setError(message);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
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
      form.reset();
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
          Deelnemers
        </h2>
        <p className="text-sm text-muted-foreground">
          Beheer profiel, score, date-status en zichtbaarheid per deelnemer.
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

      <div className="flex flex-col gap-4">
        {participants.map((participant) => (
          <ParticipantEditor
            adminToken={adminToken}
            generateUploadUrl={generateUploadUrl}
            key={participant._id}
            onSessionExpired={onSessionExpired}
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
  onSessionExpired,
  participant,
  updateParticipant
}: {
  adminToken: string;
  generateUploadUrl: (args: { adminToken: string }) => Promise<string>;
  onSessionExpired: () => void;
  participant: Participant;
  updateParticipant: (args: {
    adminToken: string;
    participantId: Id<"participants">;
    name: string;
    isActive: boolean;
    photoStorageId?: Id<"_storage">;
  }) => Promise<unknown>;
}) {
  const dateEligibility = useDateEligibilityMutation({
    adminToken,
    onSessionExpired,
    participantId: participant._id
  });
  const [name, setName] = useState(participant.name);
  const [isActive, setIsActive] = useState(participant.isActive);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editError, setEditError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setEditError("");
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
      form.reset();
      setEditOpen(false);
    } catch (error) {
      if (isAdminSessionExpired(error)) {
        onSessionExpired();
        return;
      }
      setEditError(error instanceof Error ? error.message : "Could not save participant.");
    } finally {
      setIsSaving(false);
    }
  }

  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    setPhoto(event.target.files?.[0] ?? null);
  }

  function changeEditOpen(open: boolean) {
    if (isSaving) return;
    setEditOpen(open);
    if (open) {
      setName(participant.name);
      setIsActive(participant.isActive);
    }
    setEditError("");
    setPhoto(null);
  }

  return (
    <Dialog.Root onOpenChange={changeEditOpen} open={isEditOpen}>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Avatar size="lg">
              {participant.photoUrl ? <AvatarImage alt="" src={participant.photoUrl} /> : null}
              <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle as="h3" className="truncate">{participant.name}</CardTitle>
              <CardDescription>{participant.points} points</CardDescription>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Badge variant={participant.isActive ? "secondary" : "outline"}>
                {participant.isActive ? "Actief" : "Verborgen"}
              </Badge>
              <Badge variant={participant.canDate ? "default" : "secondary"}>
                {participant.canDate ? "Date allowed" : "No date"}
              </Badge>
              <DateCompletedButton
                canDate={participant.canDate}
                dateEligibility={dateEligibility}
                participantName={participant.name}
              />
              <Dialog.Trigger
                render={<Button size="icon-xs" type="button" variant="ghost" />}
              >
                <IconEdit />
                <span className="sr-only">Edit {participant.name}</span>
              </Dialog.Trigger>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScoreAdjustmentForm
            adminToken={adminToken}
            canDate={participant.canDate}
            currentScore={participant.points}
            dateEligibility={dateEligibility}
            onSessionExpired={onSessionExpired}
            participantId={participant._id}
            participantName={participant.name}
          />
        </CardContent>
      </Card>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
          <Dialog.Popup className="relative grid w-full max-w-md gap-5 rounded-4xl bg-card p-6 text-card-foreground shadow-2xl ring-1 ring-foreground/10 transition-[scale,opacity] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="pr-10">
              <Dialog.Title className="font-heading text-lg font-semibold">
                Edit {participant.name}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Update profile details and scoreboard visibility.
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close edit dialog"
              className="absolute right-4 top-4"
              disabled={isSaving}
              render={<Button size="icon-sm" type="button" variant="ghost" />}
            >
              <IconX />
            </Dialog.Close>

            <form className="grid content-start gap-4" onSubmit={save}>
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
              <Button disabled={isSaving} type="submit">
                {isSaving ? "Opslaan…" : "Profiel opslaan"}
              </Button>
              {editError ? <FieldError>{editError}</FieldError> : null}
            </form>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
