"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

function getConvexUrl() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    if (typeof window === "undefined") {
      return "https://placeholder.convex.cloud";
    }

    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL environment variable.");
  }

  return url;
}

export function Providers({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    return new ConvexReactClient(getConvexUrl());
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
