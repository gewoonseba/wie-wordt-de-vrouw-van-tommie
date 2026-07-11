import { describe, expect, it } from "vitest";

import { isAdminSessionExpired } from "@/lib/admin-session";

describe("isAdminSessionExpired", () => {
  it("recognizes the Convex admin-session error with request context", () => {
    expect(
      isAdminSessionExpired(
        new Error(
          "[CONVEX M(trackerAdmin:adjustScore)] [Request ID: abc] Server Error: Admin session is missing or expired."
        )
      )
    ).toBe(true);
  });

  it.each([
    new Error("Participant not found."),
    "Admin session is missing or expired.",
    null,
    undefined
  ])("does not classify %j as an expired Error", (error) => {
    expect(isAdminSessionExpired(error)).toBe(false);
  });
});
