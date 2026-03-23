import { useState, useCallback } from 'react'
import type { CardPerformance } from '@/lib/types'
import { loadCardPerformance, saveCardPerformance } from '@/lib/storage'

/** Leitner box review intervals in days */
const BOX_INTERVALS: Record<number, number> = {
  1: 0,   // Review immediately / every session
  2: 1,   // 1 day
  3: 3,   // 3 days
  4: 7,   // 1 week
  5: 14,  // 2 weeks
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function todayISO(): string {
  return new Date().toISOString()
}

export function useCardPerformance() {
  const [perfMap, setPerfMap] = useState<Map<string, CardPerformance>>(() => {
    const arr = loadCardPerformance()
    return new Map(arr.map((p) => [p.cardId, p]))
  })

  const persist = useCallback((map: Map<string, CardPerformance>) => {
    setPerfMap(map)
    saveCardPerformance(Array.from(map.values()))
  }, [])

  /** Record results from a practice or quiz session */
  const recordResults = useCallback(
    (results: { cardId: string; correct: boolean }[]) => {
      const now = todayISO()
      const updated = new Map(perfMap)

      for (const { cardId, correct } of results) {
        const existing = updated.get(cardId)
        const current: CardPerformance = existing ?? {
          cardId,
          box: 1,
          timesCorrect: 0,
          timesMissed: 0,
          lastSeen: now,
          nextReview: now,
        }

        let newBox = current.box
        if (correct) {
          newBox = Math.min(current.box + 1, 5)
        } else {
          newBox = 1 // Back to box 1 on miss
        }

        const interval = BOX_INTERVALS[newBox] ?? 0
        updated.set(cardId, {
          ...current,
          box: newBox,
          timesCorrect: current.timesCorrect + (correct ? 1 : 0),
          timesMissed: current.timesMissed + (correct ? 0 : 1),
          lastSeen: now,
          nextReview: addDays(now, interval),
        })
      }

      persist(updated)
    },
    [perfMap, persist]
  )

  /** Get card IDs that are due for review (nextReview <= now) */
  const getDueCardIds = useCallback((): Set<string> => {
    const now = new Date()
    const due = new Set<string>()
    for (const [cardId, perf] of perfMap) {
      if (new Date(perf.nextReview) <= now) {
        due.add(cardId)
      }
    }
    return due
  }, [perfMap])

  /** Get the number of cards due for review */
  const dueCount = useCallback((): number => {
    return getDueCardIds().size
  }, [getDueCardIds])

  /** Get performance data for a specific card */
  const getPerf = useCallback(
    (cardId: string): CardPerformance | undefined => {
      return perfMap.get(cardId)
    },
    [perfMap]
  )

  /** Get mastery summary: count of cards per box */
  const getMasterySummary = useCallback((): Record<number, number> => {
    const summary: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const perf of perfMap.values()) {
      summary[perf.box] = (summary[perf.box] ?? 0) + 1
    }
    return summary
  }, [perfMap])

  return {
    recordResults,
    getDueCardIds,
    dueCount,
    getPerf,
    getMasterySummary,
    perfMap,
  }
}
