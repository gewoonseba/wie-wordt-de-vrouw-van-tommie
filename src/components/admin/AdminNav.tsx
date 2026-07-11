"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";
import {
  clearAdminToken,
  useAdminToken
} from "@/components/admin/useAdminToken";
import { Button } from "@/components/ui/button";

export function AdminNav() {
  const adminToken = useAdminToken();
  const revokeSession = useMutation(api.authTokens.logout);
  const router = useRouter();

  async function logout() {
    try {
      if (adminToken) {
        await revokeSession({ adminToken });
      }
    } catch (error) {
      console.error("Failed to revoke the admin session", error);
    } finally {
      clearAdminToken();
      router.push("/admin/login");
    }
  }

  return (
    <header className="flex flex-col gap-4 border-b bg-background px-4 py-4 text-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Control room</h1>
      </div>
      <Button type="button" onClick={() => void logout()} variant="outline">
        Logout
      </Button>
    </header>
  );
}
