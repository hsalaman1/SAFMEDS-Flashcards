import { useState, useEffect, useRef, useCallback } from 'react'

export type TimerState = 'idle' | 'running' | 'done'

export function useTimer(durationSeconds = 60) {
  const [remaining, setRemaining] = useState(durationSeconds)
  const [state, setState] = useState<TimerState>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const start = useCallback(() => {
    setRemaining(durationSeconds)
    setState('running')
  }, [durationSeconds])

  const reset = useCallback(() => {
    clear()
    setRemaining(durationSeconds)
    setState('idle')
  }, [durationSeconds])

  useEffect(() => {
    if (state !== 'running') {
      clear()
      return
    }

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setState('done')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return clear
  }, [state])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const urgency: 'normal' | 'warning' | 'critical' =
    remaining <= 10 ? 'critical' : remaining <= 20 ? 'warning' : 'normal'

  return { remaining, display, state, urgency, start, reset }
}
