"use client";

import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { generateToken } from "@/lib/tokens";

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
      await login({ passcode, sessionToken });
      window.localStorage.setItem("adminToken", sessionToken);
      window.dispatchEvent(new Event("admin-token-change"));
      router.push("/admin");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page narrow">
      <section className="panel">
        <p className="eyebrow">Admin login</p>
        <h1>Enter the host passcode</h1>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="passcode">Passcode</label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              autoFocus
            />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}
