import type { Session } from './types'

export interface SCCPoint {
  date: Date
  correctsRpm: number
  errorsRpm: number
}

export interface CelerationResult {
  slope: number          // log10 units per day
  weeklyFactor: number   // e.g. 1.3 = ×1.3/week
  startY: number         // predicted value at first date
  endY: number           // predicted value at last date
}

export function sessionsToPoints(sessions: Session[]): SCCPoint[] {
  return sessions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      date: new Date(s.date),
      correctsRpm: s.correctsRpm,
      errorsRpm: s.errorsRpm,
    }))
}

/** Linear regression on (x_day, log10(y)) — only includes points where y > 0 */
export function computeCeleration(
  points: SCCPoint[],
  field: 'correctsRpm' | 'errorsRpm'
): CelerationResult | null {
  const valid = points.filter((p) => p[field] > 0)
  if (valid.length < 2) return null

  const t0 = valid[0].date.getTime()
  const xs = valid.map((p) => (p.date.getTime() - t0) / 86_400_000)
  const ys = valid.map((p) => Math.log10(p[field]))

  const n = xs.length
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i]!, 0)
  const sumX2 = xs.reduce((a, x) => a + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const lastX = xs[xs.length - 1]!

  return {
    slope,
    weeklyFactor: Math.pow(10, slope * 7),
    startY: Math.pow(10, intercept),
    endY: Math.pow(10, intercept + slope * lastX),
  }
}

export function celerationLabel(factor: number): string {
  if (factor >= 1) return `×${factor.toFixed(2)}/wk`
  return `÷${(1 / factor).toFixed(2)}/wk`
}
