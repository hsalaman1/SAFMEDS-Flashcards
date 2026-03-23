import { CheckCircle, XCircle, RotateCcw, Trophy, Download, Clock } from 'lucide-react'
import type { Card } from '@/lib/types'
import { useQuiz, formatElapsed } from '@/hooks/useQuiz'
import { exportQuizToXlsx } from '@/lib/xlsx-export'
import { cn } from '@/lib/utils'

interface Props {
  activeDeck: Card[]
  onSessionSaved?: () => void
}

export function MultipleChoiceView({ activeDeck, onSessionSaved }: Props) {
  const {
    phase,
    currentQuestion,
    questionIndex,
    totalQuestions,
    selected,
    isAnswered,
    results,
    elapsed,
    startQuiz,
    selectAnswer,
    nextQuestion,
    saveSession,
    resetQuiz,
  } = useQuiz(activeDeck)

  // ── PRE ──────────────────────────────────────────────────────────
  if (phase === 'pre') {
    const notEnough = activeDeck.length < 4
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🎯</p>
          <h2 className="text-2xl font-bold text-white mb-1">Multiple Choice Quiz</h2>
          <p className="text-zinc-400 text-sm max-w-xs">
            See the definition — pick the correct term from 4 choices. Your speed and accuracy are both tracked.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 w-full max-w-sm flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Cards in deck</span>
            <span className="text-white font-medium">{activeDeck.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Questions</span>
            <span className="text-white font-medium">{activeDeck.length} (one per card)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Format</span>
            <span className="text-white font-medium">Definition → Term</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Tracking</span>
            <span className="text-white font-medium">Accuracy + Speed (correct/min)</span>
          </div>
        </div>

        {notEnough && (
          <p className="text-amber-400 text-sm text-center max-w-xs">
            Need at least 4 cards selected (for answer choices). Go to Card Library and check more cards.
          </p>
        )}

        <button
          onClick={startQuiz}
          disabled={notEnough}
          className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors shadow-lg"
        >
          Start Quiz
        </button>
      </div>
    )
  }

  // ── POST ─────────────────────────────────────────────────────────
  if (phase === 'post') {
    const correct = results.filter((r) => r.wasCorrect).length
    const total = results.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const minutes = elapsed > 0 ? elapsed / 60 : 1
    const correctPerMin = parseFloat((correct / minutes).toFixed(1))
    const questionsPerMin = parseFloat((total / minutes).toFixed(1))
    const missed = results.filter((r) => !r.wasCorrect)
    const avgTimeSec = total > 0
      ? (results.reduce((sum, r) => sum + r.timeMs, 0) / total / 1000).toFixed(1)
      : '0'

    function handleSave() {
      saveSession()
      onSessionSaved?.()
      resetQuiz()
    }

    function handleExport() {
      exportQuizToXlsx({
        date: new Date().toISOString(),
        deckLabel: `All selected (${activeDeck.length} cards)`,
        totalQuestions: total,
        correct,
        incorrect: total - correct,
        accuracyPct: pct,
        correctPerMin,
        questionsPerMin,
        totalSeconds: elapsed,
        cardResults: results.map((r) => ({
          term: r.question.correctTerm,
          definition: r.question.card.answer,
          yourAnswer: r.selected,
          correct: r.wasCorrect,
          timeSeconds: r.timeMs / 1000,
        })),
      })
    }

    return (
      <div className="flex flex-col items-center h-full gap-5 overflow-y-auto py-2">
        <div className="text-center">
          <p className="text-5xl mb-2">
            {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}
          </p>
          <h2 className="text-2xl font-bold text-white">Quiz Complete</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {total} questions · {formatElapsed(elapsed)}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          <StatCard label="Accuracy" value={`${pct}%`} color="text-teal-400" />
          <StatCard label="Correct / min" value={String(correctPerMin)} color="text-green-400" sub="fluency score" />
          <StatCard label="Questions / min" value={String(questionsPerMin)} color="text-blue-400" sub="total speed" />
          <StatCard label="Avg time / card" value={`${avgTimeSec}s`} color="text-zinc-300" />
        </div>

        {/* Correct / Incorrect counts */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 w-full max-w-md text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-zinc-400">Correct</span>
            <span className="text-green-400 font-medium">{correct}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-zinc-400">Incorrect</span>
            <span className="text-red-400 font-medium">{total - correct}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Total time</span>
            <span className="text-white font-medium">{formatElapsed(elapsed)}</span>
          </div>
        </div>

        {/* Missed cards */}
        {missed.length > 0 && (
          <div className="w-full max-w-md">
            <p className="text-sm text-zinc-400 mb-2 font-medium">
              Needs work ({missed.length} card{missed.length !== 1 ? 's' : ''}):
            </p>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 divide-y divide-zinc-800 max-h-48 overflow-y-auto">
              {missed.map((r, i) => (
                <div key={i} className="p-3 text-xs">
                  <p className="text-white font-medium">{r.question.correctTerm}</p>
                  <p className="text-zinc-500 mt-0.5 line-clamp-2">{r.question.card.answer}</p>
                  <p className="text-red-400 mt-0.5">You chose: {r.selected}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center pb-4">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium border border-zinc-700 transition-colors"
          >
            <Download size={15} />
            Export to Excel
          </button>
          <button
            onClick={resetQuiz}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium border border-zinc-700 transition-colors"
          >
            <RotateCcw size={15} />
            Try Again
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            <Trophy size={15} />
            Save & Done
          </button>
        </div>
      </div>
    )
  }

  // ── ACTIVE ───────────────────────────────────────────────────────
  if (!currentQuestion) return null

  const { card, choices, correctTerm } = currentQuestion
  const correctCount = results.filter((r) => r.wasCorrect).length
  const incorrectCount = results.filter((r) => !r.wasCorrect).length

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header: progress + timer + score */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <span className="flex items-center gap-1.5 text-zinc-300 font-mono tabular-nums">
          <Clock size={13} className="text-zinc-500" />
          {formatElapsed(elapsed)}
        </span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle size={14} />
            {correctCount}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <XCircle size={14} />
            {incorrectCount}
          </span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-teal-500 transition-all duration-300"
          style={{ width: `${(questionIndex / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        {/* Definition card */}
        <div className="w-full max-w-xl">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 text-center">
            {card.chapter !== null ? `Chapter ${card.chapter} — ` : ''}What is this term?
          </p>
          <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 text-center">
            <p className="text-lg text-zinc-200 leading-relaxed">{card.answer}</p>
          </div>
        </div>

        {/* 4 choices */}
        <div className="grid grid-cols-1 gap-3 w-full max-w-xl">
          {choices.map((choice) => {
            const isSelected = selected === choice
            const isCorrect = choice === correctTerm

            let style = 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
            if (isAnswered) {
              if (isCorrect) {
                style = 'bg-green-900/40 border-green-600 text-green-300'
              } else if (isSelected && !isCorrect) {
                style = 'bg-red-900/40 border-red-600 text-red-300'
              } else {
                style = 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
              }
            }

            return (
              <button
                key={choice}
                onClick={() => selectAnswer(choice)}
                disabled={isAnswered}
                className={cn(
                  'flex items-center justify-between w-full px-5 py-3.5 rounded-xl border text-sm font-medium text-left transition-colors',
                  style,
                  !isAnswered && 'cursor-pointer',
                  isAnswered && 'cursor-default'
                )}
              >
                <span>{choice}</span>
                {isAnswered && isCorrect && (
                  <CheckCircle size={16} className="text-green-400 flex-shrink-0 ml-2" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle size={16} className="text-red-400 flex-shrink-0 ml-2" />
                )}
              </button>
            )
          })}
        </div>

        {/* Next button */}
        {isAnswered && (
          <button
            onClick={nextQuestion}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors"
          >
            {questionIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string
  value: string
  color: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-center">
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>}
    </div>
  )
}
