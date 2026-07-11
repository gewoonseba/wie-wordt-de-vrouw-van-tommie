import { describe, expect, it } from "vitest";
import { generateToken, hashToken } from "@/lib/tokens";

describe("tokens", () => {
  it("generates token-like strings without ambiguous characters", () => {
    const token = generateToken();

    expect(token).toHaveLength(32);
    expect(token).not.toMatch(/[IOl01]/);
  });

  it("hashes tokens deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});
