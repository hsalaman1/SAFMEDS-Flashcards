export interface Card {
  id: string;
  term: string;
  answer: string;
  chapter: number | null;
  termNumber: number | null;
  included: boolean;
}

export interface Session {
  id: string;
  date: string;        // ISO 8601
  deckLabel: string;
  corrects: number;
  errors: number;
  duration: number;    // seconds
  correctsRpm: number;
  errorsRpm: number;
  totalRpm: number;
}

export interface AppData {
  cards: Card[];
  sessions: Session[];
  fluencyAim: number;
}

export interface QuizSession {
  id: string
  date: string        // ISO 8601
  deckLabel: string
  totalQuestions: number
  correct: number
  incorrect: number
  accuracyPct: number
  correctPerMin: number
  questionsPerMin: number
  totalSeconds: number
}

/** Spaced repetition: per-card performance tracking (Leitner boxes) */
export interface CardPerformance {
  cardId: string
  box: number          // Leitner box 1-5 (1 = needs most review)
  timesCorrect: number
  timesMissed: number
  lastSeen: string     // ISO 8601
  nextReview: string   // ISO 8601 — when card is due
}

/** Daily streak tracking */
export interface StreakData {
  /** Dates on which at least one session was completed (YYYY-MM-DD) */
  activeDates: string[]
}
