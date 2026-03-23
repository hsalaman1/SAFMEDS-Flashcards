import { useState } from 'react'
import { useCards } from '@/hooks/useCards'
import { useSessions } from '@/hooks/useSessions'
import { CardLibrary } from '@/components/CardLibrary'
import { SessionView } from '@/components/SessionView'
import { MultipleChoiceView } from '@/components/MultipleChoiceView'
import { HistoryView } from '@/components/HistoryView'
import { SCCChart } from '@/components/SCCChart'
import { cn } from '@/lib/utils'
import { BookOpen, Play, HelpCircle, BarChart2, ClipboardList } from 'lucide-react'

type Tab = 'library' | 'session' | 'quiz' | 'history' | 'chart'

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'library', label: 'Card Library', icon: <BookOpen size={16} /> },
  { id: 'session', label: 'Practice', icon: <Play size={16} /> },
  { id: 'quiz', label: 'Quiz', icon: <HelpCircle size={16} /> },
  { id: 'history', label: 'History', icon: <ClipboardList size={16} /> },
  { id: 'chart', label: 'Chart', icon: <BarChart2 size={16} /> },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('library')

  const { cards, activeDeck, chapters, importCards, toggleIncluded, setAllIncluded, addCard } =
    useCards()

  const { sessions, fluencyAim, addSession, deleteSession, importSessions, setFluencyAim } =
    useSessions()

  function handleSessionComplete(result: {
    corrects: number
    errors: number
    duration: number
    deckLabel: string
  }) {
    addSession(result)
    setTab('history')
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧠</span>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">SAFMEDS</h1>
            <p className="text-xs text-zinc-500 leading-none mt-0.5">ABA Fluency Builder</p>
          </div>
        </div>
        {activeDeck.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/40 border border-teal-700 text-teal-300 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            {activeDeck.length} cards active
          </div>
        )}
      </header>

      {/* Tab bar */}
      <nav className="flex border-b border-zinc-800 bg-zinc-950 flex-shrink-0 px-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden p-6">
        {tab === 'library' && (
          <CardLibrary
            cards={cards}
            chapters={chapters}
            activeDeck={activeDeck}
            onImport={importCards}
            onToggle={toggleIncluded}
            onSetAll={setAllIncluded}
            onAdd={addCard}
          />
        )}
        {tab === 'session' && (
          <SessionView activeDeck={activeDeck} onSessionComplete={handleSessionComplete} />
        )}
        {tab === 'quiz' && (
          <MultipleChoiceView activeDeck={activeDeck} />
        )}
        {tab === 'history' && (
          <HistoryView
            sessions={sessions}
            onDelete={deleteSession}
            onImport={importSessions}
          />
        )}
        {tab === 'chart' && (
          <SCCChart sessions={sessions} fluencyAim={fluencyAim} onAimChange={setFluencyAim} />
        )}
      </main>
    </div>
  )
}
