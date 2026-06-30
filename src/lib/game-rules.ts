export const CARD_RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "A",
  "J",
  "Q",
  "K"
] as const;

export type CardRank = (typeof CARD_RANKS)[number];

export type CardScore = {
  rank: CardRank;
  points: number;
  isDateCard: boolean;
};

export type CardDrawResult = {
  cards: CardScore[];
  pointsAwarded: number;
  dateCardsDrawn: number;
  canDateAfter: boolean;
};

export type TeamScore = {
  teamId: string;
  score: number;
};

export type TeamReward = {
  teamId: string;
  rewardCards: number;
  rank: number;
  tiedTeamIds: string[];
};

const DATE_CARD_RANKS = new Set<CardRank>(["A", "J", "Q", "K"]);

export function isCardRank(value: string): value is CardRank {
  return (CARD_RANKS as readonly string[]).includes(value);
}

export function scoreCard(rank: CardRank): CardScore {
  const isDateCard = DATE_CARD_RANKS.has(rank);
  return {
    rank,
    points: isDateCard ? 10 : Number(rank),
    isDateCard
  };
}

export function scoreCardDraw(
  ranks: CardRank[],
  canDateBefore: boolean
): CardDrawResult {
  const cards = ranks.map(scoreCard);
  const pointsAwarded = cards.reduce((sum, card) => sum + card.points, 0);
  const dateCardsDrawn = cards.filter((card) => card.isDateCard).length;

  return {
    cards,
    pointsAwarded,
    dateCardsDrawn,
    canDateAfter: dateCardsDrawn > 0 ? true : canDateBefore
  };
}

export function consumeDateFlag(canDateBefore: boolean): boolean {
  if (!canDateBefore) {
    throw new Error("Player cannot start a date while canDate is false.");
  }

  return false;
}

export function calculateQuizRewards(teamScores: TeamScore[]): TeamReward[] {
  const sorted = [...teamScores].sort((a, b) => b.score - a.score);
  const rewardSlots = [3, 2, 1];
  const rewards: TeamReward[] = [];

  let slotIndex = 0;
  while (slotIndex < sorted.length) {
    const score = sorted[slotIndex].score;
    const tied = sorted.filter((team) => team.score === score);
    const tiedStart = slotIndex;
    const tiedEnd = tiedStart + tied.length;
    const coveredSlots = rewardSlots.slice(tiedStart, tiedEnd);
    const rewardCards = Math.floor(
      coveredSlots.reduce((sum, value) => sum + value, 0) / tied.length
    );
    const rank = tiedStart + 1;
    const tiedTeamIds = tied.map((team) => team.teamId);

    for (const team of tied) {
      rewards.push({
        teamId: team.teamId,
        rewardCards,
        rank,
        tiedTeamIds
      });
    }

    slotIndex = tiedEnd;
  }

  return rewards;
}

export function expandTeamRewardToParticipants(
  participantIds: string[],
  rewardCards: number
) {
  return participantIds.map((participantId) => ({
    participantId,
    cardCount: rewardCards
  }));
}
