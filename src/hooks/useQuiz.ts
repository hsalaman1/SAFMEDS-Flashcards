import { useState, useCallback } from 'react'
import type { Card, QuizSession } from '@/lib/types'
import { shuffleArray, generateId } from '@/lib/utils'
import { loadQuizSessions, saveQuizSessions } from '@/lib/storage'

export interface QuizQuestion {
  card: Card           // The correct card (definition comes from card.answer)
  choices: string[]    // 4 term strings, shuffled
  correctTerm: string  // card.term — used to check the answer
}

export type QuizPhase = 'pre' | 'active' | 'post'

export interface AnswerResult {
  question: QuizQuestion
  selected: string
  wasCorrect: boolean
}

function buildQuestion(card: Card, allCards: Card[]): QuizQuestion {
  const others = allCards.filter((c) => c.id !== card.id)
  const distractors = shuffleArray(others)
    .slice(0, 3)
    .map((c) => c.term)
  const choices = shuffleArray([card.term, ...distractors])
  return { card, choices, correctTerm: card.term }
}

export function useQuiz(activeDeck: Card[]) {
  const [phase, setPhase] = useState<QuizPhase>('pre')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [sessions, setSessions] = useState<QuizSession[]>(() => loadQuizSessions())

  const startQuiz = useCallback(() => {
    if (activeDeck.length < 4) return
    const shuffled = shuffleArray(activeDeck)
    const qs = shuffled.map((card) => buildQuestion(card, activeDeck))
    setQuestions(qs)
    setQuestionIndex(0)
    setSelected(null)
    setResults([])
    setPhase('active')
  }, [activeDeck])

  const selectAnswer = useCallback(
    (term: string) => {
      if (selected !== null) return
      setSelected(term)
      const q = questions[questionIndex]
      const wasCorrect = term === q.correctTerm
      setResults((prev) => [...prev, { question: q, selected: term, wasCorrect }])
    },
    [selected, questions, questionIndex]
  )

  const nextQuestion = useCallback(() => {
    const next = questionIndex + 1
    if (next >= questions.length) {
      setPhase('post')
    } else {
      setQuestionIndex(next)
      setSelected(null)
    }
  }, [questionIndex, questions.length])

  const saveSession = useCallback(() => {
    const correct = results.filter((r) => r.wasCorrect).length
    const total = results.length
    const session: QuizSession = {
      id: generateId(),
      date: new Date().toISOString(),
      deckLabel: `All selected (${activeDeck.length} cards)`,
      totalQuestions: total,
      correct,
      incorrect: total - correct,
      accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }
    const updated = [session, ...sessions]
    setSessions(updated)
    saveQuizSessions(updated)
    return session
  }, [results, sessions, activeDeck.length])

  const resetQuiz = useCallback(() => {
    setPhase('pre')
    setSelected(null)
    setResults([])
    setQuestionIndex(0)
  }, [])

  const currentQuestion = questions[questionIndex] ?? null
  const isAnswered = selected !== null

  return {
    phase,
    currentQuestion,
    questionIndex,
    totalQuestions: questions.length,
    selected,
    isAnswered,
    results,
    sessions,
    startQuiz,
    selectAnswer,
    nextQuestion,
    saveSession,
    resetQuiz,
  }
}
