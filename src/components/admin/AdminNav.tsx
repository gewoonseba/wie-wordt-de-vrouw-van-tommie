"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function AdminNav() {
  const router = useRouter();

  function logout() {
    window.localStorage.removeItem("adminToken");
    window.dispatchEvent(new Event("admin-token-change"));
    router.push("/admin/login");
  }

  return (
    <header className="flex flex-col gap-4 border-b bg-background px-4 py-4 text-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Control room</h1>
      </div>
      <Button type="button" onClick={logout} variant="outline">
        Logout
      </Button>
    </header>
  );
}
