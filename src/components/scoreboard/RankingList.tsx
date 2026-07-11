import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { ScoreboardParticipant } from "@/lib/scoreboard";
import { getInitials } from "@/lib/text";

export function RankingList({ participants }: { participants: ScoreboardParticipant[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-2xl">
          Volledige stand
        </CardTitle>
        <CardDescription>
          Iedereen, in dezelfde volgorde als het podium.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Er zijn nog geen actieve deelnemers.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {participants.map((participant, index) => (
              <li
                key={participant._id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-muted p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
              >
                <span className="w-7 text-center text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar size="lg">
                    {participant.photoUrl ? (
                      <AvatarImage src={participant.photoUrl} alt="" />
                    ) : null}
                    <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-medium">{participant.name}</span>
                </div>
                <Badge
                  className="col-span-2 col-start-2 justify-self-start sm:col-span-1 sm:col-start-auto"
                  variant={participant.canDate ? "default" : "secondary"}
                >
                  {participant.canDate ? "Mag op date" : "Geen date"}
                </Badge>
                <p className="col-start-3 row-start-1 text-right text-lg font-semibold sm:col-start-auto sm:row-start-auto">
                  {participant.points}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">
                    pt
                  </span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
