import { useState, useEffect } from 'react'
import type { Card } from '@/lib/types'
import { useTimer } from '@/hooks/useTimer'
import { shuffleArray, cn } from '@/lib/utils'
import { exportPracticeToXlsx } from '@/lib/xlsx-export'
import { CheckCircle, XCircle, RefreshCw, RotateCcw, Download, Zap, Keyboard } from 'lucide-react'

interface SessionResult {
  corrects: number
  errors: number
  duration: number
  deckLabel: string
  /** Per-card results for spaced repetition tracking */
  cardResults?: { cardId: string; correct: boolean }[]
}

interface Props {
  activeDeck: Card[]
  onSessionComplete: (result: SessionResult) => void
  /** When set, practice only these cards (e.g. missed cards from previous session) */
  overrideDeck?: Card[]
  /** Callback to clear the override deck */
  onClearOverride?: () => void
}

type Phase = 'pre' | 'active' | 'post'

interface CardState {
  card: Card
  revealed: boolean
  result: 'correct' | 'error' | null
}

export function SessionView({ activeDeck, onSessionComplete, overrideDeck, onClearOverride }: Props) {
  const effectiveDeck = overrideDeck && overrideDeck.length > 0 ? overrideDeck : activeDeck
  const [phase, setPhase] = useState<Phase>(overrideDeck && overrideDeck.length > 0 ? 'pre' : 'pre')
  const [deck, setDeck] = useState<Card[]>([])
  const [cardIndex, setCardIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState<CardState[]>([])
  const [corrects, setCorrects] = useState(0)
  const [errors, setErrors] = useState(0)
  const [sessionDuration, setSessionDuration] = useState(60)
  const [completedDuration, setCompletedDuration] = useState(60)

  const { display, state: timerState, urgency, start, reset, remaining } = useTimer(60)

  // When timer hits done, finish session
  useEffect(() => {
    if (timerState === 'done' && phase === 'active') {
      setCompletedDuration(sessionDuration)
      setPhase('post')
    }
  }, [timerState, phase, sessionDuration])

  // ── Keyboard shortcuts during active phase ──────────────────────
  useEffect(() => {
    if (phase !== 'active') return

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault()
        if (!revealed) {
          setRevealed(true)
        }
      } else if (revealed) {
        if (e.code === 'ArrowLeft' || e.key === '1') {
          e.preventDefault()
          markResult('error')
        } else if (e.code === 'ArrowRight' || e.key === '2') {
          e.preventDefault()
          markResult('correct')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [phase, revealed, deck, cardIndex, results, corrects, errors])

  function startSession() {
    const shuffled = shuffleArray(effectiveDeck)
    setDeck(shuffled)
    setCardIndex(0)
    setRevealed(false)
    setResults([])
    setCorrects(0)
    setErrors(0)
    setSessionDuration(60)
    setPhase('active')
    start()
  }

  function reveal() {
    setRevealed(true)
  }

  function markResult(result: 'correct' | 'error') {
    const card = deck[cardIndex]
    if (!card) return

    const newResults = [...results, { card, revealed, result }]
    setResults(newResults)

    const newCorrects = result === 'correct' ? corrects + 1 : corrects
    const newErrors = result === 'error' ? errors + 1 : errors
    setCorrects(newCorrects)
    setErrors(newErrors)

    // Check if last card
    const nextIndex = cardIndex + 1
    if (nextIndex >= deck.length) {
      // Reshuffle and continue (free-operant — can keep going until timer)
      const reshuffled = shuffleArray(effectiveDeck)
      setDeck(reshuffled)
      setCardIndex(0)
    } else {
      setCardIndex(nextIndex)
    }
    setRevealed(false)
  }

  function endEarly() {
    const elapsed = 60 - remaining
    setCompletedDuration(elapsed > 0 ? elapsed : 60)
    setPhase('post')
    reset()
  }

  function saveAndFinish() {
    const markedResults = results.filter((r) => r.result !== null)
    onSessionComplete({
      corrects,
      errors,
      duration: completedDuration,
      deckLabel: overrideDeck ? `Missed cards review (${effectiveDeck.length} cards)` : `All selected (${activeDeck.length} cards)`,
      cardResults: markedResults.map((r) => ({
        cardId: r.card.id,
        correct: r.result === 'correct',
      })),
    })
    if (onClearOverride) onClearOverride()
    setPhase('pre')
    reset()
  }

  function practiceAgain() {
    setPhase('pre')
    reset()
  }

  function practiceMissedCards() {
    const missedCardIds = new Set(
      results.filter((r) => r.result === 'error').map((r) => r.card.id)
    )
    const missedDeck = effectiveDeck.filter((c) => missedCardIds.has(c.id))
    if (missedDeck.length === 0) return

    // Start a new session immediately with only missed cards
    const shuffled = shuffleArray(missedDeck)
    setDeck(shuffled)
    setCardIndex(0)
    setRevealed(false)
    setResults([])
    setCorrects(0)
    setErrors(0)
    setSessionDuration(60)
    setCompletedDuration(60)
    setPhase('active')
    reset()
    setTimeout(() => start(), 0)
  }

  const currentCard = deck[cardIndex]

  // ── PRE-SESSION ──────────────────────────────────────────────────
  if (phase === 'pre') {
    if (effectiveDeck.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <p className="text-5xl">📚</p>
          <h2 className="text-xl font-semibold text-white">No cards selected</h2>
          <p className="text-zinc-400 text-sm max-w-xs">
            Go to the Card Library and check the cards you want to practice.
          </p>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="text-center">
          <p className="text-5xl mb-4">⏱</p>
          <h2 className="text-2xl font-bold text-white mb-1">Ready to Practice</h2>
          <p className="text-zinc-400">SAFMEDS — Say All Fast a Minute Every Day Shuffled</p>
        </div>

        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 w-full max-w-sm flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Cards in deck</span>
            <span className="text-white font-medium">{effectiveDeck.length}</span>
          </div>
          {overrideDeck && overrideDeck.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Mode</span>
              <span className="text-amber-400 font-medium">Missed Cards Review</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Duration</span>
            <span className="text-white font-medium">1 minute</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Protocol</span>
            <span className="text-white font-medium">See → Say → Verify</span>
          </div>
        </div>

        <div className="text-xs text-zinc-500 max-w-xs text-center leading-relaxed">
          View each card, say the answer aloud, flip to check, then mark Correct or Missed.
          Cards reshuffle when you reach the end. Session ends after 1 minute.
        </div>

        <div className="flex gap-3">
          {overrideDeck && onClearOverride && (
            <button
              onClick={onClearOverride}
              className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700 transition-colors"
            >
              Back to Full Deck
            </button>
          )}
          <button
            onClick={startSession}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-lg transition-colors shadow-lg"
          >
            Start Session
          </button>
        </div>
      </div>
    )
  }

  // ── POST-SESSION ─────────────────────────────────────────────────
  if (phase === 'post') {
    const minutes = completedDuration / 60
    const cRpm = parseFloat((corrects / minutes).toFixed(1))
    const eRpm = parseFloat((errors / minutes).toFixed(1))
    const tRpm = parseFloat(((corrects + errors) / minutes).toFixed(1))

    const markedResults = results.filter((r) => r.result !== null)
    const correctCards = markedResults.filter((r) => r.result === 'correct')
    const missedCards = markedResults.filter((r) => r.result === 'error')

    // Deduplicate missed cards by ID (a card might be missed multiple times in reshuffles)
    const uniqueMissedIds = new Set(missedCards.map((r) => r.card.id))
    const uniqueMissedCount = uniqueMissedIds.size

    function handleExport() {
      exportPracticeToXlsx({
        date: new Date().toISOString(),
        deckLabel: `All selected (${activeDeck.length} cards)`,
        corrects,
        errors,
        duration: completedDuration,
        correctsRpm: cRpm,
        errorsRpm: eRpm,
        totalRpm: tRpm,
        cardResults: markedResults.map((r) => ({
          term: r.card.term,
          definition: r.card.answer,
          result: r.result === 'correct' ? 'Correct' : 'Missed',
        })),
      })
    }

    return (
      <div className="flex flex-col items-center h-full gap-5 overflow-y-auto py-2">
        <div className="text-center">
          <p className="text-5xl mb-2">🎯</p>
          <h2 className="text-2xl font-bold text-white">Session Complete</h2>
          <p className="text-zinc-400 text-sm mt-1">{completedDuration}s · {markedResults.length} cards answered</p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <StatCard label="Corrects/min" value={String(cRpm)} color="text-green-400" />
          <StatCard label="Errors/min" value={String(eRpm)} color="text-red-400" />
          <StatCard label="Total/min" value={String(tRpm)} color="text-teal-400" />
        </div>

        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 w-full max-w-md text-sm text-zinc-400">
          <div className="flex justify-between mb-1">
            <span>Correct responses</span>
            <span className="text-green-400 font-medium">{corrects}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Errors</span>
            <span className="text-red-400 font-medium">{errors}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span className="text-white font-medium">{completedDuration}s</span>
          </div>
        </div>

        {/* Missed cards */}
        {missedCards.length > 0 && (
          <div className="w-full max-w-md">
            <p className="text-sm text-zinc-400 mb-2 font-medium">
              Needs work ({missedCards.length} card{missedCards.length !== 1 ? 's' : ''}):
            </p>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 divide-y divide-zinc-800 max-h-40 overflow-y-auto">
              {missedCards.map((r, i) => (
                <div key={i} className="p-3 text-xs">
                  <p className="text-white font-medium">{r.card.term}</p>
                  <p className="text-zinc-500 mt-0.5 line-clamp-2">{r.card.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct cards — collapsed by default */}
        {correctCards.length > 0 && (
          <div className="w-full max-w-md">
            <p className="text-sm text-zinc-400 mb-2 font-medium">
              <span className="text-green-400">✓</span> Got it ({correctCards.length}):
            </p>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 divide-y divide-zinc-800 max-h-32 overflow-y-auto">
              {correctCards.map((r, i) => (
                <div key={i} className="px-3 py-2 text-xs text-zinc-500">
                  {r.card.term}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center pb-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium border border-zinc-700 transition-colors"
          >
            <Download size={15} />
            Export to Excel
          </button>
          {uniqueMissedCount > 0 && (
            <button
              onClick={practiceMissedCards}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 text-sm font-medium border border-amber-700 transition-colors"
            >
              <Zap size={15} />
              Practice Missed ({uniqueMissedCount})
            </button>
          )}
          <button
            onClick={practiceAgain}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium border border-zinc-700 transition-colors"
          >
            <RotateCcw size={15} />
            Practice Again
          </button>
          <button
            onClick={saveAndFinish}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            <CheckCircle size={15} />
            Save to History
          </button>
        </div>
      </div>
    )
  }

  // ── ACTIVE SESSION ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-4">
      {/* Timer bar */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'text-3xl font-mono font-bold tabular-nums transition-colors',
            urgency === 'critical' && 'text-red-400',
            urgency === 'warning' && 'text-amber-400',
            urgency === 'normal' && 'text-white'
          )}
        >
          {display}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle size={14} />
            {corrects}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <XCircle size={14} />
            {errors}
          </span>
          <button
            onClick={endEarly}
            className="text-zinc-500 hover:text-white text-xs transition-colors"
          >
            End early
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000',
            urgency === 'critical' ? 'bg-red-500' : urgency === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
          )}
          style={{ width: `${((60 - remaining) / 60) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="w-full max-w-xl">
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 min-h-48 flex flex-col items-center justify-center p-8 text-center">
            {currentCard ? (
              <>
                <p className="text-2xl font-semibold text-white leading-snug">
                  {currentCard.term}
                </p>
                {currentCard.chapter !== null && (
                  <p className="text-xs text-zinc-600 mt-2">Chapter {currentCard.chapter}</p>
                )}
                {revealed && (
                  <div className="mt-6 pt-6 border-t border-zinc-700 w-full">
                    <p className="text-base text-zinc-300 leading-relaxed">
                      {currentCard.answer}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <RefreshCw size={24} className="text-zinc-600 animate-spin" />
            )}
          </div>
        </div>

        {/* Action buttons */}
        {!revealed ? (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={reveal}
              className="px-8 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700 transition-colors text-sm"
            >
              Flip Card
            </button>
            <p className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Keyboard size={11} /> Space to flip
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-4">
              <button
                onClick={() => markResult('error')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-900/40 hover:bg-red-800/60 border border-red-700 text-red-300 font-medium transition-colors"
              >
                <XCircle size={18} />
                Missed
              </button>
              <button
                onClick={() => markResult('correct')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-900/40 hover:bg-green-800/60 border border-green-700 text-green-300 font-medium transition-colors"
              >
                <CheckCircle size={18} />
                Got It
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Keyboard size={11} /> ← or 1 = Missed · → or 2 = Got It
            </p>
          </div>
        )}

        <p className="text-xs text-zinc-600">
          Card {cardIndex + 1} of {deck.length} · {corrects + errors} total responses
        </p>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-center">
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  )
}
