import { useState, useCallback, useRef, useEffect } from 'react'
import type { Card, PromptQuestion, PromptQuestionType, PromptAnswerResult, PromptQuizSession } from '@/lib/types'
import { shuffleArray, generateId } from '@/lib/utils'
import { generateMask, generateHint } from '@/lib/answer-check'
import { loadPromptQuizSessions, savePromptQuizSessions } from '@/lib/storage'

export type PromptQuizPhase = 'pre' | 'active' | 'post'

// ── Question builders ────────────────────────────────────────────────

function buildTypedQuestion(card: Card): PromptQuestion {
  return { type: 'typed', cards: [card] }
}

function buildTrueFalseQuestion(card: Card, allCards: Card[]): PromptQuestion {
  const isCorrect = Math.random() < 0.5
  if (isCorrect) {
    return {
      type: 'trueFalse',
      cards: [card],
      displayedTerm: card.term,
      displayedDefinition: card.answer,
      isCorrectPairing: true,
    }
  }
  // Pick a wrong definition, preferring same chapter
  const sameChapter = allCards.filter((c) => c.id !== card.id && c.chapter === card.chapter)
  const pool = sameChapter.length > 0 ? sameChapter : allCards.filter((c) => c.id !== card.id)
  const wrong = pool[Math.floor(Math.random() * pool.length)]
  return {
    type: 'trueFalse',
    cards: [card],
    displayedTerm: card.term,
    displayedDefinition: wrong.answer,
    isCorrectPairing: false,
  }
}

function buildMatchingQuestion(cards: Card[]): PromptQuestion {
  return { type: 'matching', cards }
}

function buildFillBlankQuestion(card: Card): PromptQuestion {
  return { type: 'fillBlank', cards: [card], maskedTerm: generateMask(card.term) }
}

/**
 * Build a mixed set of prompt questions from the active deck.
 * Distribution: ~35% typed, 20% T/F, 20% matching (batches of 4), 25% fill-blank.
 */
function buildPromptQuestions(deck: Card[]): PromptQuestion[] {
  const shuffled = shuffleArray(deck)
  const questions: PromptQuestion[] = []
  let i = 0

  // Assign cards to question types in order through the shuffled deck
  while (i < shuffled.length) {
    const remaining = shuffled.length - i

    // If we have 4+ remaining and haven't used matching much, create a matching batch
    if (remaining >= 4 && questions.filter((q) => q.type === 'matching').length * 4 < deck.length * 0.2) {
      questions.push(buildMatchingQuestion(shuffled.slice(i, i + 4)))
      i += 4
      continue
    }

    const card = shuffled[i]
    const roll = Math.random()
    if (roll < 0.35) {
      questions.push(buildTypedQuestion(card))
    } else if (roll < 0.55) {
      questions.push(buildTrueFalseQuestion(card, deck))
    } else {
      questions.push(buildFillBlankQuestion(card))
    }
    i++
  }

  return shuffleArray(questions)
}

// ── Hook ─────────────────────────────────────────────────────────────

export function usePromptQuiz(activeDeck: Card[]) {
  const [phase, setPhase] = useState<PromptQuizPhase>('pre')
  const [questions, setQuestions] = useState<PromptQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [results, setResults] = useState<PromptAnswerResult[]>([])
  const [sessions, setSessions] = useState<PromptQuizSession[]>(() => loadPromptQuizSessions())
  const [elapsed, setElapsed] = useState(0)
  const [isAnswered, setIsAnswered] = useState(false)
  const [lastResult, setLastResult] = useState<'correct' | 'close' | 'wrong' | null>(null)
  const [hintUsed, setHintUsed] = useState(false)
  const [hintText, setHintText] = useState<string | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const questionStartRef = useRef(0)
  const finalElapsedRef = useRef(0)
  // Track re-queue counts per card id to cap at 2
  const requeueCountRef = useRef<Record<string, number>>({})
  // Mutable queue for adaptive re-queuing (separate from display questions)
  const queueRef = useRef<PromptQuestion[]>([])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startQuiz = useCallback(() => {
    if (activeDeck.length < 4) return
    const qs = buildPromptQuestions(activeDeck)
    const now = Date.now()
    startTimeRef.current = now
    questionStartRef.current = now
    finalElapsedRef.current = 0
    requeueCountRef.current = {}
    queueRef.current = [...qs]

    setQuestions(qs)
    setQuestionIndex(0)
    setResults([])
    setElapsed(0)
    setIsAnswered(false)
    setLastResult(null)
    setHintUsed(false)
    setHintText(null)
    setPhase('active')

    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - now) / 1000))
    }, 1000)
  }, [activeDeck])

  const currentQuestion = queueRef.current[questionIndex] ?? questions[questionIndex] ?? null

  const submitAnswer = useCallback(
    (answer: string, wasCorrect: boolean) => {
      if (isAnswered) return
      const q = currentQuestion
      if (!q) return

      const timeMs = Date.now() - questionStartRef.current
      const result: PromptAnswerResult = {
        type: q.type,
        cards: q.cards,
        wasCorrect,
        usedHint: hintUsed,
        timeMs,
        userAnswer: answer,
      }
      setResults((prev) => [...prev, result])
      setIsAnswered(true)
      setLastResult(wasCorrect ? 'correct' : 'wrong')

      // Adaptive re-queuing: if wrong, insert this question again later
      if (!wasCorrect) {
        const cardId = q.cards[0].id
        const count = requeueCountRef.current[cardId] ?? 0
        if (count < 2) {
          requeueCountRef.current[cardId] = count + 1
          const insertAt = Math.min(
            questionIndex + 3 + Math.floor(Math.random() * 3),
            queueRef.current.length
          )
          queueRef.current.splice(insertAt, 0, q)
        }
      }
    },
    [isAnswered, currentQuestion, hintUsed, questionIndex]
  )

  const requestHint = useCallback(() => {
    if (!currentQuestion || isAnswered) return
    const term = currentQuestion.cards[0].term
    setHintUsed(true)
    setHintText(generateHint(term))
  }, [currentQuestion, isAnswered])

  const nextQuestion = useCallback(() => {
    const next = questionIndex + 1
    questionStartRef.current = Date.now()

    if (next >= queueRef.current.length) {
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
      setIsAnswered(false)
      setLastResult(null)
      setHintUsed(false)
      setHintText(null)
    }
  }, [questionIndex])

  const saveSession = useCallback(() => {
    const correct = results.filter((r) => r.wasCorrect).length
    const total = results.length
    const totalSeconds = finalElapsedRef.current
    const minutes = totalSeconds > 0 ? totalSeconds / 60 : 1

    const breakdown: Record<PromptQuestionType, { correct: number; total: number }> = {
      typed: { correct: 0, total: 0 },
      trueFalse: { correct: 0, total: 0 },
      matching: { correct: 0, total: 0 },
      fillBlank: { correct: 0, total: 0 },
    }
    for (const r of results) {
      breakdown[r.type].total++
      if (r.wasCorrect) breakdown[r.type].correct++
    }

    const session: PromptQuizSession = {
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
      questionTypeBreakdown: breakdown,
    }
    const updated = [session, ...sessions]
    setSessions(updated)
    savePromptQuizSessions(updated)
    return session
  }, [results, sessions, activeDeck.length])

  const resetQuiz = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    queueRef.current = []
    requeueCountRef.current = {}
    setPhase('pre')
    setQuestionIndex(0)
    setResults([])
    setElapsed(0)
    setIsAnswered(false)
    setLastResult(null)
    setHintUsed(false)
    setHintText(null)
  }, [])

  return {
    phase,
    currentQuestion,
    questionIndex,
    totalQuestions: queueRef.current.length || questions.length,
    isAnswered,
    lastResult,
    results,
    elapsed,
    hintText,
    hintAvailable: !hintUsed && !isAnswered && currentQuestion?.type !== 'trueFalse' && currentQuestion?.type !== 'matching',
    startQuiz,
    submitAnswer,
    requestHint,
    nextQuestion,
    saveSession,
    resetQuiz,
  }
}
