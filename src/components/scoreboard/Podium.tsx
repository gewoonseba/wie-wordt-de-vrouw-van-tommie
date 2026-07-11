import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getInitials } from "@/lib/text";
import { cn } from "@/lib/utils";
import type { ScoreboardParticipant } from "@/lib/scoreboard";

const PODIUM_SLOTS = [
  {
    placement: "md:col-start-2 md:row-start-1 md:-translate-y-6",
    label: "1e plaats",
    badgeVariant: "default" as const,
    cardClassName: "md:min-h-80"
  },
  {
    placement: "md:col-start-1 md:row-start-1",
    label: "2e plaats",
    badgeVariant: "secondary" as const,
    cardClassName: undefined
  },
  {
    placement: "md:col-start-3 md:row-start-1",
    label: "3e plaats",
    badgeVariant: "outline" as const,
    cardClassName: undefined
  }
];

export function Podium({ participants }: { participants: ScoreboardParticipant[] }) {
  return (
    <section aria-labelledby="podium-title" className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-primary">De koplopers</p>
        <h2 id="podium-title" className="font-heading text-2xl font-medium">
          Het podium
        </h2>
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle as="h3">Het podium staat klaar</CardTitle>
            <CardDescription>
              Zodra er deelnemers actief zijn, verschijnen de koplopers hier.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ol className="grid gap-4 md:grid-cols-3 md:items-end md:pt-6">
          {participants.map((participant, index) => {
            const slot = PODIUM_SLOTS[index];
            return (
            <li
              key={participant._id}
              className={cn("min-w-0", slot.placement)}
            >
              <Card className={cn("h-full", slot.cardClassName)}>
                <CardHeader className="items-center text-center">
                  <Badge variant={slot.badgeVariant}>
                    {slot.label}
                  </Badge>
                  <Avatar className="size-20">
                    {participant.photoUrl ? (
                      <AvatarImage
                        src={participant.photoUrl}
                        alt={`Portret van ${participant.name}`}
                      />
                    ) : null}
                    <AvatarFallback className="text-xl">
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle as="h3" className="text-xl">
                    {participant.name}
                  </CardTitle>
                  <CardDescription>Nummer {index + 1}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-3 text-center">
                  <p className="text-4xl font-semibold tracking-tight">
                    {participant.points}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      punten
                    </span>
                  </p>
                  <Badge variant={participant.canDate ? "default" : "secondary"}>
                    {participant.canDate ? "Mag op date" : "Geen date"}
                  </Badge>
                </CardContent>
              </Card>
            </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
