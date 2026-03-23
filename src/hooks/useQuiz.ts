import { useState, useCallback, useRef, useEffect } from 'react'
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
  timeMs: number       // milliseconds taken to answer this question
}

function buildQuestion(card: Card, allCards: Card[]): QuizQuestion {
  const others = allCards.filter((c) => c.id !== card.id)
  const distractors = shuffleArray(others)
    .slice(0, 3)
    .map((c) => c.term)
  const choices = shuffleArray([card.term, ...distractors])
  return { card, choices, correctTerm: card.term }
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function useQuiz(activeDeck: Card[]) {
  const [phase, setPhase] = useState<QuizPhase>('pre')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [results, setResults] = useState<AnswerResult[]>([])
  const [sessions, setSessions] = useState<QuizSession[]>(() => loadQuizSessions())
  const [elapsed, setElapsed] = useState(0)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const questionStartTimeRef = useRef<number>(0)
  const finalElapsedRef = useRef<number>(0)

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startQuiz = useCallback(() => {
    if (activeDeck.length < 4) return
    const shuffled = shuffleArray(activeDeck)
    const qs = shuffled.map((card) => buildQuestion(card, activeDeck))
    const now = Date.now()
    startTimeRef.current = now
    questionStartTimeRef.current = now
    finalElapsedRef.current = 0

    setQuestions(qs)
    setQuestionIndex(0)
    setSelected(null)
    setResults([])
    setElapsed(0)
    setPhase('active')

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000))
    }, 1000)
  }, [activeDeck])

  const selectAnswer = useCallback(
    (term: string) => {
      if (selected !== null) return
      setSelected(term)
      const q = questions[questionIndex]
      const wasCorrect = term === q.correctTerm
      const timeMs = Date.now() - questionStartTimeRef.current
      setResults((prev) => [...prev, { question: q, selected: term, wasCorrect, timeMs }])
    },
    [selected, questions, questionIndex]
  )

  const nextQuestion = useCallback(() => {
    const next = questionIndex + 1
    questionStartTimeRef.current = Date.now()
    if (next >= questions.length) {
      // Stop timer and capture final elapsed
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      const final = Math.floor((Date.now() - startTimeRef.current) / 1000)
      finalElapsedRef.current = final
      setElapsed(final)
      setPhase('post')
    } else {
      setQuestionIndex(next)
      setSelected(null)
    }
  }, [questionIndex, questions.length])

  const saveSession = useCallback(() => {
    const correct = results.filter((r) => r.wasCorrect).length
    const total = results.length
    const totalSeconds = finalElapsedRef.current
    const minutes = totalSeconds > 0 ? totalSeconds / 60 : 1
    const session: QuizSession = {
      id: generateId(),
      date: new Date().toISOString(),
      deckLabel: `All selected (${activeDeck.length} cards)`,
      totalQuestions: total,
      correct,
      incorrect: total - correct,
      accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
      correctPerMin: parseFloat((correct / minutes).toFixed(1)),
      questionsPerMin: parseFloat((total / minutes).toFixed(1)),
      totalSeconds,
    }
    const updated = [session, ...sessions]
    setSessions(updated)
    saveQuizSessions(updated)
    return session
  }, [results, sessions, activeDeck.length])

  const resetQuiz = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setPhase('pre')
    setSelected(null)
    setResults([])
    setQuestionIndex(0)
    setElapsed(0)
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
    elapsed,
    startQuiz,
    selectAnswer,
    nextQuestion,
    saveSession,
    resetQuiz,
  }
}
