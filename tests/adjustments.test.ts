import { describe, expect, it } from "vitest";

import { parseAdjustment, projectedTotal } from "@/lib/adjustments";

describe("parseAdjustment", () => {
  it.each([
    ["25", 25],
    ["+25", 25],
    ["-8", -8],
    [" 12 ", 12]
  ])("parses %s as a signed integer", (input, expected) => {
    expect(parseAdjustment(input)).toEqual({ value: expected, error: null });
  });

  it.each(["", "   ", "0", "+0", "1.5", "NaN", "Infinity", "1e3"])(
    "rejects %j",
    (input) => {
      const result = parseAdjustment(input);

      expect(result.value).toBeNull();
      expect(result.error).toBeTruthy();
    }
  );

  it("rejects integers outside JavaScript's safe range", () => {
    expect(parseAdjustment("9007199254740992").value).toBeNull();
  });
});

describe("projectedTotal", () => {
  it("adds a valid signed adjustment to the current total", () => {
    expect(projectedTotal(40, "+5")).toBe(45);
    expect(projectedTotal(40, "-5")).toBe(35);
  });

  it("returns null until the input is valid", () => {
    expect(projectedTotal(40, "")).toBeNull();
    expect(projectedTotal(40, "1.5")).toBeNull();
  });
});
