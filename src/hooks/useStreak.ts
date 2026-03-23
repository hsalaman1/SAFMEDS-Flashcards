import { useState, useCallback, useMemo } from 'react'
import type { StreakData } from '@/lib/types'
import { loadStreak, saveStreak } from '@/lib/storage'

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useStreak() {
  const [data, setData] = useState<StreakData>(() => loadStreak())

  /** Record that a session was completed today */
  const recordActivity = useCallback(() => {
    const today = todayKey()
    setData((prev) => {
      if (prev.activeDates.includes(today)) return prev
      const updated = { activeDates: [...prev.activeDates, today] }
      saveStreak(updated)
      return updated
    })
  }, [])

  /** Current streak (consecutive days ending today or yesterday) */
  const currentStreak = useMemo((): number => {
    if (data.activeDates.length === 0) return 0
    const dateSet = new Set(data.activeDates)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from today; if today isn't active, try yesterday (streak still counts)
    let check = new Date(today)
    if (!dateSet.has(dateKey(check))) {
      check.setDate(check.getDate() - 1)
      if (!dateSet.has(dateKey(check))) return 0
    }

    let streak = 0
    while (dateSet.has(dateKey(check))) {
      streak++
      check.setDate(check.getDate() - 1)
    }
    return streak
  }, [data.activeDates])

  /** Longest streak ever */
  const longestStreak = useMemo((): number => {
    if (data.activeDates.length === 0) return 0
    const sorted = [...data.activeDates].sort()
    let longest = 1
    let current = 1

    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        current++
        longest = Math.max(longest, current)
      } else if (diffDays > 1) {
        current = 1
      }
    }
    return longest
  }, [data.activeDates])

  /** Whether the user has practiced today */
  const practicedToday = useMemo((): boolean => {
    return data.activeDates.includes(todayKey())
  }, [data.activeDates])

  /** Get activity dates for the last N days (for calendar heatmap) */
  const getRecentActivity = useCallback(
    (days: number): { date: string; active: boolean }[] => {
      const dateSet = new Set(data.activeDates)
      const result: { date: string; active: boolean }[] = []
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const key = dateKey(d)
        result.push({ date: key, active: dateSet.has(key) })
      }
      return result
    },
    [data.activeDates]
  )

  return {
    currentStreak,
    longestStreak,
    practicedToday,
    recordActivity,
    getRecentActivity,
    activeDates: data.activeDates,
  }
}
