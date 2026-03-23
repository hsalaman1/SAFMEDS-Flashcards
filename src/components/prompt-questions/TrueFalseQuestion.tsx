import { useState, useEffect } from 'react'
import type { PromptQuestion } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface Props {
  question: PromptQuestion
  onSubmit: (answer: string, wasCorrect: boolean) => void
  isAnswered: boolean
}

export function TrueFalseQuestion({ question, onSubmit, isAnswered }: Props) {
  const [selected, setSelected] = useState<boolean | null>(null)
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null)
  const card = question.cards[0]

  useEffect(() => {
    setSelected(null)
    setWasCorrect(null)
  }, [question])

  function handleSelect(answer: boolean) {
    if (isAnswered) return
    setSelected(answer)
    const correct = answer === question.isCorrectPairing
    setWasCorrect(correct)
    onSubmit(answer ? 'True' : 'False', correct)
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">
        {card.chapter !== null ? `Chapter ${card.chapter} — ` : ''}True or False?
      </p>

      {/* Term + Definition card */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 w-full">
        <div className="text-center">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Term</p>
          <p className="text-xl font-bold text-white mb-6">{question.displayedTerm}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Definition</p>
          <p className="text-lg text-zinc-200 leading-relaxed">{question.displayedDefinition}</p>
        </div>
      </div>

      <p className="text-sm text-zinc-400">Does this definition match the term?</p>

      {/* True / False buttons */}
      <div className="flex gap-4 w-full">
        <button
          onClick={() => handleSelect(true)}
          disabled={isAnswered}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border text-lg font-semibold transition-colors',
            !isAnswered && 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
            isAnswered && selected === true && wasCorrect && 'bg-green-900/40 border-green-600 text-green-300',
            isAnswered && selected === true && !wasCorrect && 'bg-red-900/40 border-red-600 text-red-300',
            isAnswered && selected !== true && 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
          )}
        >
          <Check size={20} />
          True
        </button>
        <button
          onClick={() => handleSelect(false)}
          disabled={isAnswered}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border text-lg font-semibold transition-colors',
            !isAnswered && 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
            isAnswered && selected === false && wasCorrect && 'bg-green-900/40 border-green-600 text-green-300',
            isAnswered && selected === false && !wasCorrect && 'bg-red-900/40 border-red-600 text-red-300',
            isAnswered && selected !== false && 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
          )}
        >
          <X size={20} />
          False
        </button>
      </div>

      {/* Feedback */}
      {isAnswered && (
        <div className={cn(
          'rounded-xl border p-4 w-full text-center text-sm',
          wasCorrect
            ? 'border-green-700/50 bg-green-900/20 text-green-300'
            : 'border-red-700/50 bg-red-900/20 text-red-300'
        )}>
          {wasCorrect ? (
            <p className="font-semibold">Correct!</p>
          ) : (
            <>
              <p className="font-semibold">Incorrect</p>
              <p className="mt-1 text-white">
                The correct definition is: <span className="font-medium">{card.answer}</span>
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
