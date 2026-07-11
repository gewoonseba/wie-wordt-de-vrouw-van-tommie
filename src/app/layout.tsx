import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Tommie Tracker",
  description: "Realtime bachelor party game tracker"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
