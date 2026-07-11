"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { setAdminToken } from "@/components/admin/useAdminToken";
import { generateToken } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const LOGIN_TIMEOUT_MS = 8000;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useMutation(api.authTokens.login);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const sessionToken = generateToken(40);
      await Promise.race([
        login({ passcode, sessionToken }),
        new Promise((_, reject) =>
          window.setTimeout(
            () =>
              reject(
                new Error(
                  "Login timed out while connecting to Convex. Refresh the page and confirm the local Convex server is running."
                )
              ),
            LOGIN_TIMEOUT_MS
          )
        )
      ]);
      setAdminToken(sessionToken);
      router.push("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardDescription>Admin login</CardDescription>
          <CardTitle as="h1">Enter the host passcode</CardTitle>
        </CardHeader>
        <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="passcode">Passcode</FieldLabel>
              <Input
                aria-invalid={!!error}
                id="passcode"
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                autoFocus
              />
              {error ? <FieldError>{error}</FieldError> : null}
            </Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </FieldGroup>
        </form>
        </CardContent>
      </Card>
    </main>
  );
}
