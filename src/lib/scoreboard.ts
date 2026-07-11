export const MONEY_PER_PILE_LAYER = 500;
export const MAX_MONEY_PILE_LAYERS = 20;

export type ScoreboardParticipant = {
  _id: string;
  name: string;
  photoUrl: string | null;
  points: number;
  canDate: boolean;
  createdAt: number;
};

const euroFormatter = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

export function rankParticipants<T extends ScoreboardParticipant>(
  participants: readonly T[]
): T[] {
  return [...participants].sort((left, right) => {
    return (
      right.points - left.points ||
      left.createdAt - right.createdAt ||
      left._id.localeCompare(right._id)
    );
  });
}

export function selectPodium<T extends ScoreboardParticipant>(
  rankedParticipants: readonly T[]
): T[] {
  return rankedParticipants.slice(0, 3);
}

export function getMoneyPileLayerCount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.min(
    MAX_MONEY_PILE_LAYERS,
    Math.ceil(amount / MONEY_PER_PILE_LAYER)
  );
}

export function formatEuro(amount: number): string {
  return euroFormatter.format(amount);
}
