import type { Card, Session, AppData, QuizSession } from './types'

const KEYS = {
  cards: 'safmeds_cards',
  sessions: 'safmeds_sessions',
  fluencyAim: 'safmeds_fluency_aim',
  quizSessions: 'safmeds_quiz_sessions',
} as const

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadCards(): Card[] {
  return parseJson<Card[]>(localStorage.getItem(KEYS.cards), [])
}

export function saveCards(cards: Card[]): void {
  localStorage.setItem(KEYS.cards, JSON.stringify(cards))
}

export function loadSessions(): Session[] {
  return parseJson<Session[]>(localStorage.getItem(KEYS.sessions), [])
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(KEYS.sessions, JSON.stringify(sessions))
}

export function loadFluencyAim(): number {
  return parseJson<number>(localStorage.getItem(KEYS.fluencyAim), 80)
}

export function saveFluencyAim(aim: number): void {
  localStorage.setItem(KEYS.fluencyAim, JSON.stringify(aim))
}

export function exportAllData(): string {
  const data: AppData = {
    cards: loadCards(),
    sessions: loadSessions(),
    fluencyAim: loadFluencyAim(),
  }
  return JSON.stringify(data, null, 2)
}

export function importAllData(json: string): AppData {
  const data = JSON.parse(json) as AppData
  saveCards(data.cards ?? [])
  saveSessions(data.sessions ?? [])
  saveFluencyAim(data.fluencyAim ?? 80)
  return data
}

export function loadQuizSessions(): QuizSession[] {
  return parseJson<QuizSession[]>(localStorage.getItem(KEYS.quizSessions), [])
}

export function saveQuizSessions(sessions: QuizSession[]): void {
  localStorage.setItem(KEYS.quizSessions, JSON.stringify(sessions))
}

export function exportSessionsCSV(sessions: Session[]): string {
  const header = 'Date,Deck,Corrects/min,Errors/min,Total/min,Duration(s),Corrects,Errors'
  const rows = sessions.map((s) =>
    [
      s.date,
      `"${s.deckLabel}"`,
      s.correctsRpm.toFixed(1),
      s.errorsRpm.toFixed(1),
      s.totalRpm.toFixed(1),
      s.duration,
      s.corrects,
      s.errors,
    ].join(',')
  )
  return [header, ...rows].join('\n')
}
