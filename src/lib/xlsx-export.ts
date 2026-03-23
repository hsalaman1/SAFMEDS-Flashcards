import * as XLSX from 'xlsx'

export interface QuizResultRow {
  term: string
  definition: string
  yourAnswer: string
  correct: boolean
  timeSeconds: number
}

export interface PracticeResultRow {
  term: string
  definition: string
  result: 'Correct' | 'Missed'
}

export function exportQuizToXlsx(params: {
  date: string
  deckLabel: string
  totalQuestions: number
  correct: number
  incorrect: number
  accuracyPct: number
  correctPerMin: number
  questionsPerMin: number
  totalSeconds: number
  cardResults: QuizResultRow[]
}): void {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Summary ──────────────────────────────────────────
  const summaryRows = [
    ['SAFMEDS Quiz Results'],
    [],
    ['Date', new Date(params.date).toLocaleString()],
    ['Deck', params.deckLabel],
    ['Total Questions', params.totalQuestions],
    ['Correct', params.correct],
    ['Incorrect', params.incorrect],
    ['Accuracy', `${params.accuracyPct}%`],
    ['Correct / min', params.correctPerMin],
    ['Questions / min', params.questionsPerMin],
    ['Total Time', formatDuration(params.totalSeconds)],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // ── Sheet 2: Card Results ─────────────────────────────────────
  const header = ['Term', 'Definition', 'Your Answer', 'Result', 'Time (sec)']
  const dataRows = params.cardResults.map((r) => [
    r.term,
    r.definition,
    r.yourAnswer,
    r.correct ? 'Correct ✓' : 'Missed ✗',
    (r.timeSeconds).toFixed(1),
  ])
  const cardSheet = XLSX.utils.aoa_to_sheet([header, ...dataRows])
  cardSheet['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 30 }, { wch: 12 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, cardSheet, 'Card Results')

  // ── Sheet 3: Missed Only ──────────────────────────────────────
  const missedRows = params.cardResults.filter((r) => !r.correct)
  if (missedRows.length > 0) {
    const missedData = missedRows.map((r) => [r.term, r.definition, r.yourAnswer])
    const missedSheet = XLSX.utils.aoa_to_sheet([
      ['Term', 'Correct Definition', 'What You Picked'],
      ...missedData,
    ])
    missedSheet['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, missedSheet, 'Missed Cards')
  }

  const dateStr = new Date(params.date).toISOString().slice(0, 10)
  XLSX.writeFile(wb, `SAFMEDS_Quiz_${dateStr}.xlsx`)
}

export function exportPracticeToXlsx(params: {
  date: string
  deckLabel: string
  corrects: number
  errors: number
  duration: number
  correctsRpm: number
  errorsRpm: number
  totalRpm: number
  cardResults: PracticeResultRow[]
}): void {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Summary ──────────────────────────────────────────
  const summaryRows = [
    ['SAFMEDS Practice Results'],
    [],
    ['Date', new Date(params.date).toLocaleString()],
    ['Deck', params.deckLabel],
    ['Duration', `${params.duration}s`],
    ['Corrects', params.corrects],
    ['Errors', params.errors],
    ['Corrects / min', params.correctsRpm],
    ['Errors / min', params.errorsRpm],
    ['Total / min', params.totalRpm],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

  // ── Sheet 2: Card Results ─────────────────────────────────────
  const header = ['Term', 'Definition', 'Result']
  const dataRows = params.cardResults.map((r) => [
    r.term,
    r.definition,
    r.result === 'Correct' ? 'Correct ✓' : 'Missed ✗',
  ])
  const cardSheet = XLSX.utils.aoa_to_sheet([header, ...dataRows])
  cardSheet['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, cardSheet, 'Card Results')

  // ── Sheet 3: Missed Only ──────────────────────────────────────
  const missedRows = params.cardResults.filter((r) => r.result === 'Missed')
  if (missedRows.length > 0) {
    const missedSheet = XLSX.utils.aoa_to_sheet([
      ['Term', 'Definition'],
      ...missedRows.map((r) => [r.term, r.definition]),
    ])
    missedSheet['!cols'] = [{ wch: 30 }, { wch: 60 }]
    XLSX.utils.book_append_sheet(wb, missedSheet, 'Missed Cards')
  }

  const dateStr = new Date(params.date).toISOString().slice(0, 10)
  XLSX.writeFile(wb, `SAFMEDS_Practice_${dateStr}.xlsx`)
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
