"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties
} from "react";

import type { ScoreboardParticipant } from "@/lib/scoreboard";

const JURY_CARDS = [
  "De jury wil even kwijt: charisma telt dubbel na 23:00.",
  "De VAR bekijkt of die laatste danspas technisch gezien een punt waard was.",
  "Tommie knikt mysterieus. Niemand weet waarom. +7 aura.",
  "De snackcommissie heeft gesproken: bitterballen zijn een geldige strategie.",
  "Een onafhankelijke bron meldt dat de vibes buitenaards zijn.",
  "De jury vraagt om stilte voor een zeer dramatische slok water.",
  "Breaking: een paardenmeisje is gespot. De odds verschuiven direct."
];

const CONFETTI = ["✦", "✹", "♥", "☻", "✿", "★", "⚡", "◒", "☄"];
const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const CURSOR_SPARKS = ["🪩", "💘", "🍟", "✨", "🦄", "💥"];

type CursorSpark = {
  id: number;
  x: number;
  y: number;
  emoji: string;
};

export function ScoreboardChaos({
  participants,
  tommieMoney
}: {
  participants: ScoreboardParticipant[];
  tommieMoney: number;
}) {
  const [isDisco, setIsDisco] = useState(false);
  const [isTurbo, setIsTurbo] = useState(false);
  const [isCursorCursed, setIsCursorCursed] = useState(false);
  const [juryCardIndex, setJuryCardIndex] = useState<number | null>(null);
  const [titleTaps, setTitleTaps] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ x: -100, y: -100 });
  const [cursorTrail, setCursorTrail] = useState<CursorSpark[]>([]);
  const previousScores = useRef<Map<string, number> | null>(null);
  const konamiProgress = useRef(0);
  const lastCursorTrail = useRef(0);
  const nextCursorSparkId = useRef(0);

  const leader = participants[0];
  const tommieMeter = useMemo(() => {
    const points = leader?.points ?? 0;
    return Math.min(100, Math.max(12, Math.round(28 + points * 0.9 + tommieMoney / 180)));
  }, [leader?.points, tommieMoney]);

  useEffect(() => {
    const currentScores = new Map(participants.map(({ _id, points }) => [_id, points]));
    const previous = previousScores.current;

    if (previous) {
      const climber = participants.find(({ _id, points }) => points > (previous.get(_id) ?? points));
      if (climber) {
        const gained = climber.points - (previous.get(climber._id) ?? climber.points);
        setAnnouncement(`${climber.name} pakt ${gained} punt${gained === 1 ? "" : "en"}! De zaal doet alsof dit de finale is.`);
        setIsTurbo(true);
      }
    }

    previousScores.current = currentScores;
  }, [participants]);

  useEffect(() => {
    if (!isTurbo) return;
    const timer = window.setTimeout(() => setIsTurbo(false), 2100);
    return () => window.clearTimeout(timer);
  }, [isTurbo]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const expected = KONAMI[konamiProgress.current];
      konamiProgress.current = event.key === expected ? konamiProgress.current + 1 : event.key === KONAMI[0] ? 1 : 0;

      if (konamiProgress.current === KONAMI.length) {
        konamiProgress.current = 0;
        setIsDisco(true);
        setIsTurbo(true);
        setAnnouncement("CHEATCODE ONTDEKT: de Tommie-tunnel is geopend. Iedereen is nu verdacht veel main character.");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isCursorCursed) return;

    const addCursorSpark = (x: number, y: number) => {
      const id = nextCursorSparkId.current;
      nextCursorSparkId.current += 1;
      setCursorTrail((trail) => [
        ...trail.slice(-11),
        { id, x, y, emoji: CURSOR_SPARKS[id % CURSOR_SPARKS.length] }
      ]);
    };

    const handlePointerMove = (event: PointerEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
      const now = performance.now();
      if (now - lastCursorTrail.current > 55) {
        lastCursorTrail.current = now;
        addCursorSpark(event.clientX, event.clientY);
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      addCursorSpark(event.clientX, event.clientY);
      setIsTurbo(true);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isCursorCursed]);

  const startDisco = () => {
    setIsDisco((active) => !active);
    setIsTurbo(true);
    setAnnouncement(isDisco ? "Discobal geparkeerd. De buren mogen weer slapen." : "Discobal gestart. De woonkamer is nu officieel een stadion.");
  };

  const drawJuryCard = () => {
    setJuryCardIndex((index) => (index === null ? 0 : (index + 1) % JURY_CARDS.length));
    setIsTurbo(true);
  };

  const toggleCursorChaos = () => {
    if (isCursorCursed) {
      setCursorTrail([]);
    }
    setIsCursorCursed((active) => !active);
    setAnnouncement(
      isCursorCursed
        ? "Cursor gered. Hij gaat weer normaal doen. Voorlopig."
        : "Cursed cursor geactiveerd. Klikken is nu een levensstijl."
    );
  };

  const unlockTapSecret = () => {
    const nextTaps = titleTaps + 1;
    setTitleTaps(nextTaps);
    if (nextTaps === 5) {
      setIsDisco(true);
      setIsTurbo(true);
      setAnnouncement("Vijf tikken! Tommie heeft je officieel toegevoegd aan de geheime jury.");
    }
  };

  return (
    <>
      <div className="scoreboard-aurora" aria-hidden="true" />
      {isTurbo ? (
        <div className="scoreboard-confetti" aria-hidden="true">
          {Array.from({ length: 30 }, (_, index) => (
            <span key={index} style={{ "--confetti-index": index } as CSSProperties}>
              {CONFETTI[index % CONFETTI.length]}
            </span>
          ))}
        </div>
      ) : null}
      {isCursorCursed ? (
        <div className="scoreboard-cursor-layer" aria-hidden="true">
          {cursorTrail.map((spark) => (
            <span
              key={spark.id}
              className="scoreboard-cursor-spark"
              style={{ transform: `translate3d(${spark.x}px, ${spark.y}px, 0)` }}
            >
              {spark.emoji}
            </span>
          ))}
          <span
            className="scoreboard-cursor"
            style={{ transform: `translate3d(${cursorPosition.x}px, ${cursorPosition.y}px, 0)` }}
          >
            🪩
          </span>
        </div>
      ) : null}

      <section className={isDisco ? "scoreboard-hero scoreboard-hero--disco" : "scoreboard-hero"} aria-label="Chaos bedieningspaneel">
        <div className="scoreboard-chaos-console">
          <p>JURY OP EIGEN RISICO</p>
          <button className="scoreboard-title" type="button" onClick={unlockTapSecret}>
            Wie wordt de vrouw van Tommie?
          </button>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <button className="scoreboard-action" type="button" onClick={startDisco} aria-pressed={isDisco}>
              {isDisco ? "Parkeer de discobal" : "Start de discobal"}
            </button>
            <button className="scoreboard-action scoreboard-action--secondary" type="button" onClick={drawJuryCard}>
              Trek een jurykaart
            </button>
            <button
              className="scoreboard-action scoreboard-action--cursor"
              type="button"
              onClick={toggleCursorChaos}
              aria-pressed={isCursorCursed}
            >
              {isCursorCursed ? "Red de cursor" : "Activeer de cursed cursor"}
            </button>
          </div>
          <p className="min-h-5 text-sm font-medium text-primary" aria-live="polite">
            {juryCardIndex === null ? "" : JURY_CARDS[juryCardIndex]}
          </p>
        </div>
      </section>

      <section className="scoreboard-sidequests" aria-label="Live commentaar">
        <div className="scoreboard-meter">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold">Tommie-ometer</span>
            <span>{tommieMeter}% volslagen onderbuikgevoel</span>
          </div>
          <div className="scoreboard-meter-track" role="meter" aria-label="Tommie-ometer" aria-valuemin={0} aria-valuemax={100} aria-valuenow={tommieMeter}>
            <span style={{ width: `${tommieMeter}%` }} />
          </div>
        </div>
        <p className="scoreboard-prophecy">
          {leader ? `De glazen bol wijst vandaag naar ${leader.name}, maar de glazen bol heeft ook drie espresso martini's op.` : "De glazen bol is nog aan het opwarmen."}
        </p>
      </section>

      <p className="sr-only" aria-live="assertive">{announcement}</p>
    </>
  );
}
