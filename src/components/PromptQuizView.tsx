import { CheckCircle, XCircle, RotateCcw, Trophy, Clock } from 'lucide-react'
import type { Card } from '@/lib/types'
import { usePromptQuiz } from '@/hooks/usePromptQuiz'
import { formatElapsed } from '@/hooks/useQuiz'
import { TypedRecallQuestion } from '@/components/prompt-questions/TypedRecallQuestion'
import { TrueFalseQuestion } from '@/components/prompt-questions/TrueFalseQuestion'
import { MatchingQuestion } from '@/components/prompt-questions/MatchingQuestion'
import { FillBlankQuestion } from '@/components/prompt-questions/FillBlankQuestion'
import { cn } from '@/lib/utils'

interface Props {
  activeDeck: Card[]
  onBack: () => void
}

const TYPE_LABELS: Record<string, string> = {
  typed: 'Typed Recall',
  trueFalse: 'True / False',
  matching: 'Matching',
  fillBlank: 'Fill in the Blank',
}

export function PromptQuizView({ activeDeck, onBack }: Props) {
  const {
    phase,
    currentQuestion,
    questionIndex,
    totalQuestions,
    isAnswered,
    results,
    elapsed,
    hintText,
    hintAvailable,
    startQuiz,
    submitAnswer,
    requestHint,
    nextQuestion,
    saveSession,
    resetQuiz,
  } = usePromptQuiz(activeDeck)

  // ── PRE ────────────────────────────────────────────────────────────
  if (phase === 'pre') {
    const notEnough = activeDeck.length < 4
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🧩</p>
          <h2 className="text-2xl font-bold text-white mb-1">Fluency Strategies Quiz</h2>
          <p className="text-zinc-400 text-sm max-w-sm">
            Mixed question types to build fluency: typed recall, true/false, matching, and fill-in-the-blank. Hints available when you need them.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-6 w-full max-w-sm flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Cards in deck</span>
            <span className="text-white font-medium">{activeDeck.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Question types</span>
            <span className="text-white font-medium">4 mixed</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Hints</span>
            <span className="text-white font-medium">Available (first letter + length)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Missed items</span>
            <span className="text-white font-medium">Re-queued for practice</span>
          </div>
        </div>

        {notEnough && (
          <p className="text-amber-400 text-sm text-center max-w-xs">
            Need at least 4 cards selected. Go to Card Library and check more cards.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium border border-zinc-700 transition-colors"
          >
            Back
          </button>
          <button
            onClick={startQuiz}
            disabled={notEnough}
            className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition-colors shadow-lg"
          >
            Start Quiz
          </button>
        </div>
      </div>
    )
  }

  // ── POST ───────────────────────────────────────────────────────────
  if (phase === 'post') {
    const correct = results.filter((r) => r.wasCorrect).length
    const total = results.length
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    const minutes = elapsed > 0 ? elapsed / 60 : 1
    const correctPerMin = parseFloat((correct / minutes).toFixed(1))
    const questionsPerMin = parseFloat((total / minutes).toFixed(1))
    const missed = results.filter((r) => !r.wasCorrect)

    // Build breakdown
    const breakdown: Record<string, { correct: number; total: number }> = {}
    for (const r of results) {
      if (!breakdown[r.type]) breakdown[r.type] = { correct: 0, total: 0 }
      breakdown[r.type].total++
      if (r.wasCorrect) breakdown[r.type].correct++
    }

    function handleSave() {
      saveSession()
      resetQuiz()
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
          <StatCard label="Hints used" value={String(results.filter((r) => r.usedHint).length)} color="text-amber-400" />
        </div>

        {/* Per-type breakdown */}
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 w-full max-w-md">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">By Question Type</p>
          {Object.entries(breakdown).map(([type, { correct: c, total: t }]) => (
            <div key={type} className="flex justify-between text-sm mb-1.5 last:mb-0">
              <span className="text-zinc-400">{TYPE_LABELS[type] ?? type}</span>
              <span className="text-white font-medium">
                {c}/{t} ({t > 0 ? Math.round((c / t) * 100) : 0}%)
              </span>
            </div>
          ))}
        </div>

        {/* Correct / Incorrect summary */}
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
              Needs work ({missed.length} item{missed.length !== 1 ? 's' : ''}):
            </p>
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 divide-y divide-zinc-800 max-h-48 overflow-y-auto">
              {missed.map((r, i) => (
                <div key={i} className="p-3 text-xs">
                  <p className="text-white font-medium">{r.cards[0].term}</p>
                  <p className="text-zinc-500 mt-0.5 line-clamp-2">{r.cards[0].answer}</p>
                  <p className="text-red-400 mt-0.5">Your answer: {r.userAnswer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center pb-4">
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

  // ── ACTIVE ─────────────────────────────────────────────────────────
  if (!currentQuestion) return null

  const correctCount = results.filter((r) => r.wasCorrect).length
  const incorrectCount = results.filter((r) => !r.wasCorrect).length

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
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

      {/* Question type badge */}
      <div className="flex justify-center">
        <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-400">
          {TYPE_LABELS[currentQuestion.type]}
        </span>
      </div>

      {/* Question content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {currentQuestion.type === 'typed' && (
          <TypedRecallQuestion
            question={currentQuestion}
            onSubmit={submitAnswer}
            isAnswered={isAnswered}
            hintText={hintText}
            hintAvailable={hintAvailable}
            onRequestHint={requestHint}
          />
        )}
        {currentQuestion.type === 'trueFalse' && (
          <TrueFalseQuestion
            question={currentQuestion}
            onSubmit={submitAnswer}
            isAnswered={isAnswered}
          />
        )}
        {currentQuestion.type === 'matching' && (
          <MatchingQuestion
            question={currentQuestion}
            onSubmit={submitAnswer}
            isAnswered={isAnswered}
          />
        )}
        {currentQuestion.type === 'fillBlank' && (
          <FillBlankQuestion
            question={currentQuestion}
            onSubmit={submitAnswer}
            isAnswered={isAnswered}
            hintText={hintText}
            hintAvailable={hintAvailable}
            onRequestHint={requestHint}
          />
        )}

        {/* Next button */}
        {isAnswered && (
          <button
            onClick={nextQuestion}
            className="mt-6 px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors"
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
