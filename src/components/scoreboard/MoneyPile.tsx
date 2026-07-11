import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  formatEuro,
  getMoneyPileLayerCount,
  MAX_MONEY_PILE_LAYERS
} from "@/lib/scoreboard";

export function MoneyPile({ amount }: { amount: number }) {
  const layerCount = getMoneyPileLayerCount(amount);
  const layers = Array.from({ length: layerCount }, (_, index) => index);

  return (
    <Card className="h-full">
      <CardHeader className="text-center">
        <CardDescription>Door Tommie verdiend</CardDescription>
        <CardTitle as="h2" className="text-2xl">
          Tommie&apos;s pot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-5">
        <output
          className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl"
          aria-live="polite"
        >
          {formatEuro(amount)}
        </output>

        <div className="flex min-h-40 w-full max-w-sm flex-col justify-end" aria-hidden="true">
          {layerCount === 0 ? (
            <div className="mx-auto h-2 w-32 rounded-full bg-muted" />
          ) : (
            <div className="grid grid-cols-5 items-end gap-1 px-4">
              {layers.map((layer) => (
                <span
                  key={layer}
                  className="h-5 rounded-full bg-primary shadow-sm ring-1 ring-primary-foreground/20 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-reduce:animate-none"
                />
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {layerCount === 0
            ? "De pot is nog leeg."
            : layerCount === MAX_MONEY_PILE_LAYERS
              ? "De geldstapel zit op zijn visuele maximum."
              : "Elke laag staat voor € 500."}
        </p>
      </CardContent>
    </Card>
  );
}
