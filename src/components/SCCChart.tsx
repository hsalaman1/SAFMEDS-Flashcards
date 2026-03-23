import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { Session } from '@/lib/types'
import { sessionsToPoints, computeCeleration, celerationLabel } from '@/lib/scc'

interface Props {
  sessions: Session[]
  fluencyAim: number
  onAimChange: (aim: number) => void
}

export function SCCChart({ sessions, fluencyAim, onAimChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [aimInput, setAimInput] = useState(String(fluencyAim))

  const points = sessionsToPoints(sessions)
  const celeration = computeCeleration(points, showErrors ? 'errorsRpm' : 'correctsRpm')

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    const width = container.clientWidth
    const height = 420
    const margin = { top: 24, right: 32, bottom: 48, left: 64 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    d3.select(svg).selectAll('*').remove()

    const root = d3
      .select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // ── Scales ────────────────────────────────────────────────────
    const allDates = points.map((p) => p.date)
    const domainStart = allDates.length > 0 ? d3.min(allDates)! : new Date()
    const domainEnd = allDates.length > 0 ? d3.max(allDates)! : new Date()

    // Pad x-domain by 1 day on each side
    const xStart = new Date(domainStart)
    xStart.setDate(xStart.getDate() - 1)
    const xEnd = new Date(domainEnd)
    xEnd.setDate(xEnd.getDate() + 1)

    const xScale = d3.scaleTime().domain([xStart, xEnd]).range([0, innerW])

    // Semi-log y: 0.1 → 1000 (4 cycles)
    const yScale = d3.scaleLog().domain([0.1, 1000]).range([innerH, 0]).clamp(true)

    // ── Grid lines ────────────────────────────────────────────────
    const yGridValues = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
    root
      .append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yGridValues)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#27272a')
      .attr('stroke-width', 1)

    // ── Axes ──────────────────────────────────────────────────────
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(points.length > 0 ? 8 : 4, innerW / 80))
      .tickFormat((d) =>
        d3.timeFormat('%b %d')(d instanceof Date ? d : new Date(d as number))
      )

    root
      .append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .call((g) => g.select('.domain').attr('stroke', '#52525b'))
      .call((g) => g.selectAll('line').attr('stroke', '#52525b'))
      .call((g) =>
        g
          .selectAll('text')
          .attr('fill', '#a1a1aa')
          .attr('font-size', '11px')
      )

    const yAxis = d3
      .axisLeft(yScale)
      .tickValues(yGridValues)
      .tickFormat((d) => {
        const n = Number(d)
        if (n >= 1) return String(Math.round(n))
        return String(n)
      })

    root
      .append('g')
      .call(yAxis)
      .call((g) => g.select('.domain').attr('stroke', '#52525b'))
      .call((g) => g.selectAll('line').attr('stroke', '#52525b'))
      .call((g) =>
        g
          .selectAll('text')
          .attr('fill', '#a1a1aa')
          .attr('font-size', '11px')
      )

    // Y-axis label
    root
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#71717a')
      .attr('font-size', '12px')
      .text('Responses per minute')

    // ── Fluency aim line ─────────────────────────────────────────
    if (fluencyAim > 0) {
      const aimY = yScale(fluencyAim)
      root
        .append('line')
        .attr('x1', 0).attr('x2', innerW)
        .attr('y1', aimY).attr('y2', aimY)
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6 3')

      root
        .append('text')
        .attr('x', innerW - 4)
        .attr('y', aimY - 5)
        .attr('text-anchor', 'end')
        .attr('fill', '#f59e0b')
        .attr('font-size', '11px')
        .text(`Aim: ${fluencyAim}/min`)
    }

    // ── Celeration line ───────────────────────────────────────────
    if (celeration && points.length >= 2) {
      const t0 = points[0]!.date.getTime()
      const lastDate = points[points.length - 1]!.date
      const daySpan = (lastDate.getTime() - t0) / 86_400_000

      const lineData: [Date, number][] = [
        [points[0]!.date, celeration.startY],
        [lastDate, celeration.endY],
      ]

      root
        .append('line')
        .attr('x1', xScale(lineData[0]![0]))
        .attr('x2', xScale(lineData[1]![0]))
        .attr('y1', yScale(Math.max(0.1, lineData[0]![1])))
        .attr('y2', yScale(Math.max(0.1, lineData[1]![1])))
        .attr('stroke', '#14b8a6')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.7)

      if (daySpan > 0) {
        const midDate = new Date(t0 + (daySpan / 2) * 86_400_000)
        const midY = Math.sqrt(celeration.startY * celeration.endY)
        root
          .append('text')
          .attr('x', xScale(midDate))
          .attr('y', yScale(Math.max(0.1, midY)) - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', '#14b8a6')
          .attr('font-size', '11px')
          .text(celerationLabel(celeration.weeklyFactor))
      }
    }

    // ── Data points ───────────────────────────────────────────────
    const field = showErrors ? 'errorsRpm' : 'correctsRpm'
    const color = showErrors ? '#ef4444' : '#22c55e'
    const symbol = showErrors ? '·' : '×'

    points.forEach((p) => {
      const rpm = p[field]
      if (rpm <= 0) return
      const x = xScale(p.date)
      const y = yScale(rpm)
      root
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', color)
        .attr('font-size', showErrors ? '18px' : '16px')
        .attr('font-weight', 'bold')
        .text(symbol)

      // Tooltip value
      root
        .append('text')
        .attr('x', x)
        .attr('y', y - 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#71717a')
        .attr('font-size', '9px')
        .text(rpm.toFixed(1))
    })
  }, [points, fluencyAim, showErrors, celeration])

  function handleAimSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(aimInput)
    if (!isNaN(n) && n > 0) onAimChange(n)
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Standard Celeration Chart</h2>
          <p className="text-sm text-zinc-400">Semi-logarithmic • responses per minute over time</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Aim setter */}
          <form onSubmit={handleAimSubmit} className="flex items-center gap-2">
            <label className="text-xs text-zinc-400">Fluency aim:</label>
            <input
              type="number"
              value={aimInput}
              onChange={(e) => setAimInput(e.target.value)}
              className="w-16 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-teal-500 text-center"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-xs transition-colors"
            >
              Set
            </button>
          </form>

          {/* Toggle corrects / errors */}
          <div className="flex rounded-lg overflow-hidden border border-zinc-700">
            <button
              onClick={() => setShowErrors(false)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                !showErrors ? 'bg-green-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              × Corrects
            </button>
            <button
              onClick={() => setShowErrors(true)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                showErrors ? 'bg-red-800 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              · Errors
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      {celeration && (
        <div className="flex gap-4 text-xs text-zinc-500 flex-wrap">
          <span>
            <span className="text-teal-400">— </span>
            Celeration: {celerationLabel(celeration.weeklyFactor)}
          </span>
          <span>
            <span className="text-amber-400">— — </span>
            Aim: {fluencyAim}/min
          </span>
        </div>
      )}

      {/* Chart */}
      {sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
          <p className="text-3xl">📈</p>
          <p>No sessions yet. Complete and save sessions to see your celeration chart.</p>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1">
          <svg ref={svgRef} className="w-full" />
        </div>
      )}
    </div>
  )
}
