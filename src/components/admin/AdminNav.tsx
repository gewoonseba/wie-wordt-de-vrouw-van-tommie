"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function getAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem("adminToken") ?? "";
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = [
    { href: "/admin", label: "Dashboard", active: pathname === "/admin" },
    {
      href: "/admin/participants",
      label: "Participants",
      active: pathname.includes("/participants"),
    },
    {
      href: "/admin/scoring",
      label: "Scoring",
      active: pathname.includes("/scoring"),
    },
  ];

  function logout() {
    window.localStorage.removeItem("adminToken");
    window.dispatchEvent(new Event("admin-token-change"));
    router.push("/admin/login");
  }

  return (
    <header className="flex flex-col gap-4 border-b bg-background px-4 py-4 text-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Tommie Tracker</h1>
      </div>
      <nav
        aria-label="Admin navigation"
        className="flex flex-wrap items-center gap-2"
      >
        {navItems.map((item) => (
          <Button
            aria-current={item.active ? "page" : undefined}
            className={cn(item.active && "pointer-events-none")}
            key={item.href}
            nativeButton={false}
            render={<Link href={item.href} />}
            variant={item.active ? "default" : "ghost"}
          >
            {item.label}
          </Button>
        ))}
        <Button type="button" onClick={logout} variant="outline">
          Logout
        </Button>
      </nav>
    </header>
  );
}
