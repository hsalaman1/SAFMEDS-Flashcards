import { useState, useRef } from 'react'
import type { Session } from '@/lib/types'
import { exportSessionsCSV, exportAllData, importAllData } from '@/lib/storage'
import { formatDate, formatRpm } from '@/lib/utils'
import { Download, Upload, Trash2, ArrowLeftRight } from 'lucide-react'

interface Props {
  sessions: Session[]
  onDelete: (id: string) => void
  onImport: (sessions: Session[]) => void
}

export function HistoryView({ sessions, onDelete, onImport }: Props) {
  const [compareMode, setCompareMode] = useState(false)
  const [compareA, setCompareA] = useState<string>('')
  const [compareB, setCompareB] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  function downloadCSV() {
    const csv = exportSessionsCSV(sessions)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safmeds-sessions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadJSON() {
    const json = exportAllData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `safmeds-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const json = ev.target?.result as string
        if (file.name.endsWith('.json')) {
          const data = importAllData(json)
          onImport(data.sessions ?? [])
        } else if (file.name.endsWith('.csv')) {
          alert('CSV import restores session data from a previously exported CSV.')
        }
      } catch {
        alert('Failed to import file. Make sure it is a valid SAFMEDS backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const sessionA = sessions.find((s) => s.id === compareA)
  const sessionB = sessions.find((s) => s.id === compareB)

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Session History</h2>
          <p className="text-sm text-zinc-400">{sessions.length} sessions recorded</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm border border-zinc-700 transition-colors"
          >
            <ArrowLeftRight size={14} />
            Compare
          </button>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm border border-zinc-700 transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={downloadJSON}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm border border-zinc-700 transition-colors"
          >
            <Download size={14} />
            Backup JSON
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
          >
            <Upload size={14} />
            Import Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </div>

      {/* Compare panel */}
      {compareMode && sessions.length >= 2 && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Compare Sessions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Session A</label>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
              >
                <option value="">Select session…</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.date)} — {s.correctsRpm}/min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Session B</label>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none"
              >
                <option value="">Select session…</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.date)} — {s.correctsRpm}/min
                  </option>
                ))}
              </select>
            </div>
          </div>

          {sessionA && sessionB && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <CompareCard session={sessionA} label="A" />
              <CompareCard session={sessionB} label="B" />
              <div className="col-span-2 rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-sm">
                <p className="text-zinc-400 font-medium mb-2">Difference (B − A)</p>
                <div className="grid grid-cols-3 gap-2">
                  <DiffStat
                    label="Corrects/min"
                    diff={sessionB.correctsRpm - sessionA.correctsRpm}
                    positive
                  />
                  <DiffStat
                    label="Errors/min"
                    diff={sessionB.errorsRpm - sessionA.errorsRpm}
                    positive={false}
                  />
                  <DiffStat
                    label="Total/min"
                    diff={sessionB.totalRpm - sessionA.totalRpm}
                    positive
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
          <p className="text-3xl">📋</p>
          <p>No sessions yet. Complete a session to see your history here.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Deck</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Corrects/min</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Errors/min</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Total/min</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Corrects</th>
                <th className="text-right px-4 py-3 text-zinc-400 font-medium">Errors</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                    {formatDate(s.date)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 max-w-xs truncate">{s.deckLabel}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-400">
                    {formatRpm(s.correctsRpm)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-400">
                    {formatRpm(s.errorsRpm)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-teal-400">
                    {formatRpm(s.totalRpm)}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">{s.corrects}</td>
                  <td className="px-4 py-3 text-right text-zinc-400">{s.errors}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(s.id)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                      aria-label="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CompareCard({ session, label }: { session: Session; label: string }) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3">
      <p className="text-xs text-zinc-500 mb-1">Session {label}</p>
      <p className="text-sm text-white font-medium">{formatDate(session.date)}</p>
      <div className="mt-2 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">Corrects/min</span>
          <span className="text-green-400 font-medium">{session.correctsRpm}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Errors/min</span>
          <span className="text-red-400 font-medium">{session.errorsRpm}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-500">Total/min</span>
          <span className="text-teal-400 font-medium">{session.totalRpm}</span>
        </div>
      </div>
    </div>
  )
}

function DiffStat({
  label,
  diff,
  positive,
}: {
  label: string
  diff: number
  positive: boolean
}) {
  const improved = positive ? diff > 0 : diff < 0
  const color = diff === 0 ? 'text-zinc-400' : improved ? 'text-green-400' : 'text-red-400'
  const sign = diff > 0 ? '+' : ''
  return (
    <div>
      <p className="text-zinc-500 text-xs">{label}</p>
      <p className={`font-semibold tabular-nums ${color}`}>
        {sign}{diff.toFixed(1)}
      </p>
    </div>
  )
}
