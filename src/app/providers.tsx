"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

function getConfiguredConvexUrl() {
  return process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
}

function getSameOriginConvexUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:3000/convex";
  }

  return `${window.location.origin}/convex`;
}

export function Providers({ children }: { children: ReactNode }) {
  const configuredConvexUrl = getConfiguredConvexUrl();
  const convexUrl =
    configuredConvexUrl === "same-origin"
      ? getSameOriginConvexUrl()
      : configuredConvexUrl;

  const convex = useMemo(() => {
    return convexUrl ? new ConvexReactClient(convexUrl) : null;
  }, [convexUrl]);

  if (!convex) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-8">
        <section className="flex flex-col gap-3 rounded-4xl bg-card p-6 text-card-foreground shadow-md ring-1 ring-foreground/5">
          <h1 className="font-heading text-xl font-medium">
            Convex is not configured
          </h1>
          <p className="text-sm text-muted-foreground">
            Start the local services with <code>npm run dev:all</code>, then
            refresh this page so <code>NEXT_PUBLIC_CONVEX_URL</code> is
            available.
          </p>
        </section>
      </main>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
