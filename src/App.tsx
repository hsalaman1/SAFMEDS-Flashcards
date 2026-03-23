import { useState } from 'react'
import { useCards } from '@/hooks/useCards'
import { useSessions } from '@/hooks/useSessions'
import { useStreak } from '@/hooks/useStreak'
import { useCardPerformance } from '@/hooks/useCardPerformance'
import { CardLibrary } from '@/components/CardLibrary'
import { SessionView } from '@/components/SessionView'
import { MultipleChoiceView } from '@/components/MultipleChoiceView'
import { HistoryView } from '@/components/HistoryView'
import { SCCChart } from '@/components/SCCChart'
import { StreakBadge } from '@/components/StreakBadge'
import { cn } from '@/lib/utils'
import { BookOpen, Play, HelpCircle, BarChart2, ClipboardList, Brain } from 'lucide-react'
import type { Card } from '@/lib/types'

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

  const { currentStreak, longestStreak, practicedToday, recordActivity, getRecentActivity } =
    useStreak()

  const { recordResults, getDueCardIds, getPerf } =
    useCardPerformance()

  // Override deck state for "Practice Missed Cards" / "Quiz Missed Cards"
  const [sessionOverrideDeck, setSessionOverrideDeck] = useState<Card[] | undefined>(undefined)
  const [quizOverrideDeck, setQuizOverrideDeck] = useState<Card[] | undefined>(undefined)

  function handleSessionComplete(result: {
    corrects: number
    errors: number
    duration: number
    deckLabel: string
    cardResults?: { cardId: string; correct: boolean }[]
  }) {
    addSession(result)
    recordActivity()
    // Record per-card results for spaced repetition
    if (result.cardResults && result.cardResults.length > 0) {
      recordResults(result.cardResults)
    }
    setTab('history')
  }

  function handleQuizComplete(cardResults: { cardId: string; correct: boolean }[]) {
    recordActivity()
    if (cardResults.length > 0) {
      recordResults(cardResults)
    }
  }

  // Smart Review: practice cards that are due for review
  function startSmartReview() {
    const dueIds = getDueCardIds()
    // Include cards never seen before (not in perf map) as well
    const dueCards = activeDeck.filter((c) => dueIds.has(c.id) || !getPerf(c.id))
    if (dueCards.length > 0) {
      setSessionOverrideDeck(dueCards)
      setTab('session')
    }
  }

  const smartReviewCount = activeDeck.filter(
    (c) => getDueCardIds().has(c.id) || !getPerf(c.id)
  ).length

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

        <div className="flex items-center gap-3">
          {/* Smart Review button */}
          {smartReviewCount > 0 && (
            <button
              onClick={startSmartReview}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-700 text-purple-300 text-xs hover:bg-purple-800/50 transition-colors"
            >
              <Brain size={12} />
              {smartReviewCount} due
            </button>
          )}

          {/* Streak badge */}
          <StreakBadge
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            practicedToday={practicedToday}
            recentActivity={getRecentActivity(28)}
          />

          {/* Active cards count */}
          {activeDeck.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/40 border border-teal-700 text-teal-300 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              {activeDeck.length} cards active
            </div>
          )}
        </div>
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
          <SessionView
            activeDeck={activeDeck}
            onSessionComplete={handleSessionComplete}
            overrideDeck={sessionOverrideDeck}
            onClearOverride={() => setSessionOverrideDeck(undefined)}
          />
        )}
        {tab === 'quiz' && (
          <MultipleChoiceView
            activeDeck={activeDeck}
            overrideDeck={quizOverrideDeck}
            onClearOverride={() => setQuizOverrideDeck(undefined)}
            onQuizComplete={handleQuizComplete}
            onSetOverrideDeck={setQuizOverrideDeck}
          />
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
