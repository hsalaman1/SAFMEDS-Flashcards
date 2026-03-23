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

// ── Fluency Strategies Quiz (Quiz with Prompts) ─────────────────────

export type PromptQuestionType = 'typed' | 'trueFalse' | 'matching' | 'fillBlank'

export interface PromptQuestion {
  type: PromptQuestionType
  cards: Card[]                    // 1 card for typed/trueFalse/fillBlank, 4 for matching
  // trueFalse-specific
  displayedTerm?: string
  displayedDefinition?: string
  isCorrectPairing?: boolean
  // fillBlank-specific
  maskedTerm?: string              // e.g. "R___________t"
}

export interface PromptAnswerResult {
  type: PromptQuestionType
  cards: Card[]
  wasCorrect: boolean
  usedHint: boolean
  timeMs: number
  userAnswer: string
}

export interface PromptQuizSession {
  id: string
  date: string
  deckLabel: string
  totalQuestions: number
  correct: number
  incorrect: number
  accuracyPct: number
  correctPerMin: number
  questionsPerMin: number
  totalSeconds: number
  questionTypeBreakdown: Record<PromptQuestionType, { correct: number; total: number }>
}
