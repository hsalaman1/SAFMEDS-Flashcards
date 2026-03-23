import { useState, useCallback } from 'react'
import type { Session } from '@/lib/types'
import { loadSessions, saveSessions, loadFluencyAim, saveFluencyAim } from '@/lib/storage'
import { generateId } from '@/lib/utils'

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions())
  const [fluencyAim, setFluencyAimState] = useState<number>(() => loadFluencyAim())

  const addSession = useCallback(
    (data: {
      deckLabel: string
      corrects: number
      errors: number
      duration: number
    }) => {
      const minutes = data.duration / 60
      const session: Session = {
        id: generateId(),
        date: new Date().toISOString(),
        deckLabel: data.deckLabel,
        corrects: data.corrects,
        errors: data.errors,
        duration: data.duration,
        correctsRpm: parseFloat((data.corrects / minutes).toFixed(1)),
        errorsRpm: parseFloat((data.errors / minutes).toFixed(1)),
        totalRpm: parseFloat(((data.corrects + data.errors) / minutes).toFixed(1)),
      }
      const updated = [session, ...sessions]
      setSessions(updated)
      saveSessions(updated)
      return session
    },
    [sessions]
  )

  const deleteSession = useCallback(
    (id: string) => {
      const updated = sessions.filter((s) => s.id !== id)
      setSessions(updated)
      saveSessions(updated)
    },
    [sessions]
  )

  const importSessions = useCallback((imported: Session[]) => {
    // Merge: keep existing, add new (deduplicate by id)
    setSessions((prev) => {
      const existingIds = new Set(prev.map((s) => s.id))
      const newOnes = imported.filter((s) => !existingIds.has(s.id))
      const merged = [...prev, ...newOnes].sort((a, b) =>
        b.date.localeCompare(a.date)
      )
      saveSessions(merged)
      return merged
    })
  }, [])

  const setFluencyAim = useCallback((aim: number) => {
    setFluencyAimState(aim)
    saveFluencyAim(aim)
  }, [])

  return {
    sessions,
    fluencyAim,
    addSession,
    deleteSession,
    importSessions,
    setFluencyAim,
  }
}
