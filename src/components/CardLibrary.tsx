import { useState, useRef, useMemo } from 'react'
import type { Card } from '@/lib/types'
import { parseXLSXBuffer } from '@/lib/xlsx-import'
import { cn } from '@/lib/utils'
import { Upload, Plus, Search, ChevronDown } from 'lucide-react'

interface Props {
  cards: Card[]
  chapters: number[]
  activeDeck: Card[]
  onImport: (cards: Card[]) => void
  onToggle: (id: string) => void
  onSetAll: (ids: string[], included: boolean) => void
  onAdd: (term: string, answer: string, chapter: number | null) => void
}

export function CardLibrary({
  cards,
  chapters,
  activeDeck,
  onImport,
  onToggle,
  onSetAll,
  onAdd,
}: Props) {
  const [search, setSearch] = useState('')
  const [chapterFilter, setChapterFilter] = useState<number | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [newTerm, setNewTerm] = useState('')
  const [newAnswer, setNewAnswer] = useState('')
  const [newChapter, setNewChapter] = useState('')
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return cards.filter((c) => {
      const matchChapter =
        chapterFilter === 'all' || c.chapter === chapterFilter
      const matchSearch =
        !q || c.term.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q)
      return matchChapter && matchSearch
    })
  }, [cards, search, chapterFilter])

  const filteredIds = filtered.map((c) => c.id)
  const filteredIncludedCount = filtered.filter((c) => c.included).length
  const allFilteredSelected = filteredIds.length > 0 && filteredIncludedCount === filteredIds.length

  async function handleFile(file: File) {
    setImportError('')
    try {
      const buf = await file.arrayBuffer()
      const imported = parseXLSXBuffer(buf)
      onImport(imported)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Failed to parse file')
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) void handleFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }

  function handleAdd() {
    if (!newTerm.trim() || !newAnswer.trim()) return
    onAdd(newTerm, newAnswer, newChapter ? Number(newChapter) : null)
    setNewTerm('')
    setNewAnswer('')
    setNewChapter('')
    setShowAdd(false)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Card Library</h2>
          <p className="text-sm text-zinc-400">
            {activeDeck.length} of {cards.length} cards selected for practice
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
          >
            <Upload size={15} />
            Import XLSX
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium border border-zinc-700 transition-colors"
          >
            <Plus size={15} />
            Add Card
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Import error */}
      {importError && (
        <div className="px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {importError}
        </div>
      )}

      {/* Drop zone hint (shown when no cards) */}
      {cards.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border-2 border-dashed border-zinc-700 text-zinc-500 cursor-pointer hover:border-teal-600 hover:text-teal-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={32} />
          <p className="text-sm">Drop your XLSX file here, or click to browse</p>
          <p className="text-xs">Reads Term, Answer, Chapter #, and Include? columns</p>
        </div>
      )}

      {/* Add card form */}
      {showAdd && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">New Card</h3>
          <input
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-teal-500"
            placeholder="Term (front)"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-teal-500 resize-none"
            placeholder="Definition / Answer (back)"
            rows={3}
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-teal-500"
            placeholder="Chapter # (optional)"
            type="number"
            value={newChapter}
            onChange={(e) => setNewChapter(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTerm.trim() || !newAnswer.trim()}
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              Add Card
            </button>
          </div>
        </div>
      )}

      {/* Search + filter row */}
      {cards.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-teal-500"
              placeholder="Search terms or definitions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              value={chapterFilter === 'all' ? 'all' : String(chapterFilter)}
              onChange={(e) =>
                setChapterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="appearance-none pr-8 pl-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-teal-500 cursor-pointer"
            >
              <option value="all">All Chapters</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>
                  Chapter {ch}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Bulk actions */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">{filtered.length} shown</span>
          <button
            onClick={() => onSetAll(filteredIds, true)}
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Select all
          </button>
          <button
            onClick={() => onSetAll(filteredIds, false)}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Deselect all
          </button>
          {!allFilteredSelected && filteredIncludedCount > 0 && (
            <span className="text-zinc-500">({filteredIncludedCount} selected)</span>
          )}
        </div>
      )}

      {/* Card list */}
      {cards.length > 0 && (
        <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 divide-y divide-zinc-800">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No cards match your search
            </div>
          ) : (
            filtered.map((card) => (
              <CardRow key={card.id} card={card} onToggle={onToggle} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function CardRow({ card, onToggle }: { card: Card; onToggle: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors cursor-pointer',
        card.included && 'bg-teal-950/20'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(card.id)
        }}
        className={cn(
          'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          card.included
            ? 'bg-teal-500 border-teal-500 text-white'
            : 'border-zinc-600 hover:border-teal-500'
        )}
        aria-label={card.included ? 'Remove from deck' : 'Add to deck'}
      >
        {card.included && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white leading-snug">{card.term}</p>
          {card.chapter !== null && (
            <span className="text-xs text-zinc-500 whitespace-nowrap flex-shrink-0">
              Ch. {card.chapter}
            </span>
          )}
        </div>
        {expanded ? (
          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{card.answer}</p>
        ) : (
          <p className="text-xs text-zinc-600 mt-0.5 truncate">{card.answer}</p>
        )}
      </div>
    </div>
  )
}
