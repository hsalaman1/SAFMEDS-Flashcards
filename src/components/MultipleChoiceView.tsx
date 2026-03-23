import { CheckCircle, XCircle, RotateCcw, Trophy } from 'lucide-react'
import type { Card } from '@/lib/types'
import { useQuiz } from '@/hooks/useQuiz'
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
            See the definition — pick the correct term from 4 choices.
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
    const missed = results.filter((r) => !r.wasCorrect)

    function handleSave() {
      saveSession()
      onSessionSaved?.()
      resetQuiz()
    }

    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="text-center">
          <p className="text-5xl mb-3">
            {pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚'}
          </p>
          <h2 className="text-2xl font-bold text-white">Quiz Complete</h2>
          <p className="text-zinc-400 text-sm mt-1">{total} questions answered</p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
          <StatCard label="Correct" value={String(correct)} color="text-green-400" />
          <StatCard label="Incorrect" value={String(total - correct)} color="text-red-400" />
          <StatCard label="Accuracy" value={`${pct}%`} color="text-teal-400" />
        </div>

        {missed.length > 0 && (
          <div className="w-full max-w-md">
            <p className="text-sm text-zinc-400 mb-2 font-medium">Missed items ({missed.length}):</p>
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

        <div className="flex gap-3">
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
      {/* Progress header */}
      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Question {questionIndex + 1} of {totalQuestions}</span>
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

        {/* Next button — only after answering */}
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

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-center">
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  )
}
