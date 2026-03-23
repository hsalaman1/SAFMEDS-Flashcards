import { useState, useRef, useEffect } from 'react'
import type { PromptQuestion } from '@/lib/types'
import { checkTypedAnswer } from '@/lib/answer-check'
import { cn } from '@/lib/utils'
import { Lightbulb, Send } from 'lucide-react'

interface Props {
  question: PromptQuestion
  onSubmit: (answer: string, wasCorrect: boolean) => void
  isAnswered: boolean
  hintText: string | null
  hintAvailable: boolean
  onRequestHint: () => void
}

export function TypedRecallQuestion({ question, onSubmit, isAnswered, hintText, hintAvailable, onRequestHint }: Props) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<'correct' | 'close' | 'wrong' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const card = question.cards[0]

  useEffect(() => {
    setInput('')
    setResult(null)
    inputRef.current?.focus()
  }, [question])

  function handleSubmit() {
    if (isAnswered || input.trim() === '') return
    const check = checkTypedAnswer(input, card.term)
    setResult(check)
    onSubmit(input, check === 'correct' || check === 'close')
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl">
      {/* Question type label */}
      <p className="text-xs text-zinc-500 uppercase tracking-wider">
        {card.chapter !== null ? `Chapter ${card.chapter} — ` : ''}Type the term
      </p>

      {/* Definition card */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-8 text-center w-full">
        <p className="text-lg text-zinc-200 leading-relaxed">{card.answer}</p>
      </div>

      {/* Hint */}
      {hintText && (
        <div className="px-4 py-2 rounded-xl bg-amber-900/30 border border-amber-700/50 text-amber-300 text-sm">
          Hint: {hintText}
        </div>
      )}

      {/* Input + submit */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        className="flex gap-3 w-full"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isAnswered}
          placeholder="Type the term..."
          className={cn(
            'flex-1 px-4 py-3 rounded-xl bg-zinc-800 border text-white text-lg font-medium placeholder-zinc-600 focus:outline-none focus:ring-1 transition-colors',
            !isAnswered && 'border-zinc-700 focus:border-teal-500 focus:ring-teal-500',
            result === 'correct' && 'border-green-600 bg-green-900/20',
            result === 'close' && 'border-green-600 bg-green-900/20',
            result === 'wrong' && 'border-red-600 bg-red-900/20'
          )}
        />
        {!isAnswered && (
          <button
            type="submit"
            disabled={input.trim() === ''}
            className="px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            <Send size={18} />
          </button>
        )}
      </form>

      {/* Hint button */}
      {hintAvailable && !isAnswered && (
        <button
          onClick={onRequestHint}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-amber-400 hover:bg-amber-900/20 transition-colors"
        >
          <Lightbulb size={14} />
          Show hint
        </button>
      )}

      {/* Feedback */}
      {isAnswered && (
        <div className={cn(
          'rounded-xl border p-4 w-full text-center text-sm',
          result === 'wrong'
            ? 'border-red-700/50 bg-red-900/20 text-red-300'
            : 'border-green-700/50 bg-green-900/20 text-green-300'
        )}>
          {result === 'correct' && <p className="font-semibold">Correct!</p>}
          {result === 'close' && <p className="font-semibold">Close enough! (minor typo accepted)</p>}
          {result === 'wrong' && (
            <>
              <p className="font-semibold">Incorrect</p>
              <p className="mt-1 text-white">Correct answer: <span className="font-bold">{card.term}</span></p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
