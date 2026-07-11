import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16 text-foreground">
      <section className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardDescription>Vrijgezellen Tommie</CardDescription>
            <CardTitle as="h1" className="text-3xl">
              Wie wordt de vrouw van Tommie?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="max-w-xl text-muted-foreground">
              Live scores, date eligibility, physical card draw tracking, and
              Tommie&apos;s honeymoon money target in one realtime dashboard.
            </p>
          </CardContent>
          <CardFooter>
            <Button nativeButton={false} render={<Link href="/admin" />}>
              Admin dashboard
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
