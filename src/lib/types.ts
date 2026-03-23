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
}
