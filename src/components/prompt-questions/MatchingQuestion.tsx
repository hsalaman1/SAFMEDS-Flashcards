import { useState, useEffect, useCallback } from 'react'
import type { PromptQuestion } from '@/lib/types'
import { shuffleArray, cn } from '@/lib/utils'

interface Props {
  question: PromptQuestion
  onSubmit: (answer: string, wasCorrect: boolean) => void
  isAnswered: boolean
}

export function MatchingQuestion({ question, onSubmit, isAnswered }: Props) {
  const [shuffledTerms, setShuffledTerms] = useState<string[]>([])
  const [shuffledDefs, setShuffledDefs] = useState<string[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [selectedDef, setSelectedDef] = useState<string | null>(null)
  const [matched, setMatched] = useState<Map<string, string>>(new Map())
  const [errors, setErrors] = useState(0)
  const [flashError, setFlashError] = useState(false)

  const cards = question.cards
  const correctMap = new Map(cards.map((c) => [c.term, c.answer]))

  useEffect(() => {
    setShuffledTerms(shuffleArray(cards.map((c) => c.term)))
    setShuffledDefs(shuffleArray(cards.map((c) => c.answer)))
    setSelectedTerm(null)
    setSelectedDef(null)
    setMatched(new Map())
    setErrors(0)
    setFlashError(false)
  }, [question])

  const tryMatch = useCallback(() => {
    if (!selectedTerm || !selectedDef) return

    const isCorrect = correctMap.get(selectedTerm) === selectedDef
    if (isCorrect) {
      const newMatched = new Map(matched)
      newMatched.set(selectedTerm, selectedDef)
      setMatched(newMatched)
      setSelectedTerm(null)
      setSelectedDef(null)

      // All matched?
      if (newMatched.size === cards.length) {
        const totalErrors = errors
        onSubmit(
          `Matched ${cards.length}/${cards.length} (${totalErrors} errors)`,
          totalErrors === 0
        )
      }
    } else {
      setErrors((e) => e + 1)
      setFlashError(true)
      setTimeout(() => {
        setFlashError(false)
        setSelectedTerm(null)
        setSelectedDef(null)
      }, 600)
    }
  }, [selectedTerm, selectedDef, matched, correctMap, cards.length, errors, onSubmit])

  useEffect(() => {
    if (selectedTerm && selectedDef) {
      tryMatch()
    }
  }, [selectedTerm, selectedDef, tryMatch])

  function handleTermClick(term: string) {
    if (isAnswered || matched.has(term) || flashError) return
    setSelectedTerm(term === selectedTerm ? null : term)
  }

  function handleDefClick(def: string) {
    if (isAnswered || [...matched.values()].includes(def) || flashError) return
    setSelectedDef(def === selectedDef ? null : def)
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-2xl">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">
        Match each term to its definition
      </p>

      <div className="flex items-center gap-3 text-sm">
        <span className="text-zinc-400">
          Matched: <span className="text-teal-400 font-medium">{matched.size}/{cards.length}</span>
        </span>
        {errors > 0 && (
          <span className="text-red-400">
            Errors: {errors}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {/* Terms column */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Terms</p>
          {shuffledTerms.map((term) => {
            const isMatched = matched.has(term)
            const isSelected = selectedTerm === term
            return (
              <button
                key={term}
                onClick={() => handleTermClick(term)}
                disabled={isMatched || isAnswered}
                className={cn(
                  'px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-200',
                  isMatched && 'bg-green-900/30 border-green-700/50 text-green-300 opacity-70',
                  !isMatched && !isSelected && 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
                  isSelected && !flashError && 'bg-teal-900/40 border-teal-500 text-teal-300 ring-2 ring-teal-500',
                  isSelected && flashError && 'bg-red-900/40 border-red-500 text-red-300 ring-2 ring-red-500'
                )}
              >
                {term}
              </button>
            )
          })}
        </div>

        {/* Definitions column */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Definitions</p>
          {shuffledDefs.map((def) => {
            const isMatched = [...matched.values()].includes(def)
            const isSelected = selectedDef === def
            return (
              <button
                key={def}
                onClick={() => handleDefClick(def)}
                disabled={isMatched || isAnswered}
                className={cn(
                  'px-4 py-3 rounded-xl border text-sm text-left transition-all duration-200 leading-snug',
                  isMatched && 'bg-green-900/30 border-green-700/50 text-green-300 opacity-70',
                  !isMatched && !isSelected && 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700',
                  isSelected && !flashError && 'bg-teal-900/40 border-teal-500 text-teal-300 ring-2 ring-teal-500',
                  isSelected && flashError && 'bg-red-900/40 border-red-500 text-red-300 ring-2 ring-red-500'
                )}
              >
                <span className="line-clamp-3">{def}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Completion feedback */}
      {isAnswered && (
        <div className={cn(
          'rounded-xl border p-4 w-full text-center text-sm',
          errors === 0
            ? 'border-green-700/50 bg-green-900/20 text-green-300'
            : 'border-amber-700/50 bg-amber-900/20 text-amber-300'
        )}>
          {errors === 0
            ? <p className="font-semibold">Perfect matching!</p>
            : <p className="font-semibold">All matched! ({errors} error{errors !== 1 ? 's' : ''} along the way)</p>
          }
        </div>
      )}
    </div>
  )
}
