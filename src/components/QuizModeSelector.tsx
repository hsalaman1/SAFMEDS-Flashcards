import { useState } from 'react'
import type { Card } from '@/lib/types'
import { MultipleChoiceView } from '@/components/MultipleChoiceView'
import { PromptQuizView } from '@/components/PromptQuizView'
import { HelpCircle, Puzzle } from 'lucide-react'

type QuizMode = 'select' | 'multipleChoice' | 'prompts'

interface Props {
  activeDeck: Card[]
}

export function QuizModeSelector({ activeDeck }: Props) {
  const [mode, setMode] = useState<QuizMode>('select')

  if (mode === 'multipleChoice') {
    return (
      <div className="flex flex-col h-full">
        <button
          onClick={() => setMode('select')}
          className="self-start mb-4 px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          ← Back to Quiz Modes
        </button>
        <div className="flex-1 overflow-hidden">
          <MultipleChoiceView activeDeck={activeDeck} />
        </div>
      </div>
    )
  }

  if (mode === 'prompts') {
    return <PromptQuizView activeDeck={activeDeck} onBack={() => setMode('select')} />
  }

  // ── Mode selector ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Choose Quiz Mode</h2>
        <p className="text-zinc-400 text-sm">
          Select a quiz format to test your knowledge
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        {/* Multiple Choice */}
        <button
          onClick={() => setMode('multipleChoice')}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-teal-600 transition-all group"
        >
          <div className="w-14 h-14 rounded-xl bg-teal-900/40 border border-teal-700/50 flex items-center justify-center group-hover:bg-teal-900/60 transition-colors">
            <HelpCircle size={28} className="text-teal-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">Multiple Choice</p>
            <p className="text-zinc-400 text-sm mt-1">
              See a definition, pick the correct term from 4 choices
            </p>
          </div>
        </button>

        {/* Fluency Strategies Quiz */}
        <button
          onClick={() => setMode('prompts')}
          className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-teal-600 transition-all group"
        >
          <div className="w-14 h-14 rounded-xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center group-hover:bg-purple-900/60 transition-colors">
            <Puzzle size={28} className="text-purple-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg">Fluency Strategies</p>
            <p className="text-zinc-400 text-sm mt-1">
              Mixed question types: typed recall, true/false, matching, fill-in-the-blank
            </p>
          </div>
        </button>
      </div>
    </div>
  )
}
