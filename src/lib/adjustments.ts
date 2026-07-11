export type AdjustmentResult =
  | { value: number; error: null }
  | { value: null; error: string };

const SIGNED_INTEGER_PATTERN = /^[+-]?\d+$/;

export function parseAdjustment(input: string): AdjustmentResult {
  const normalized = input.trim();

  if (!SIGNED_INTEGER_PATTERN.test(normalized)) {
    return { value: null, error: "Enter a whole-number adjustment." };
  }

  const value = Number(normalized);
  if (!Number.isSafeInteger(value)) {
    return { value: null, error: "Adjustment is outside the supported range." };
  }
  if (value === 0) {
    return { value: null, error: "Adjustment cannot be zero." };
  }

  return { value, error: null };
}

export function projectedTotal(current: number, input: string) {
  const result = parseAdjustment(input);
  return result.value === null ? null : current + result.value;
}
