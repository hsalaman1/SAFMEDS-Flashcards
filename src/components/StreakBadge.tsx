import { useState } from 'react'
import { Flame, Trophy, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  currentStreak: number
  longestStreak: number
  practicedToday: boolean
  recentActivity: { date: string; active: boolean }[]
}

export function StreakBadge({ currentStreak, longestStreak, practicedToday, recentActivity }: Props) {
  const [showPopover, setShowPopover] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-colors',
          currentStreak > 0
            ? 'bg-orange-900/40 border-orange-700 text-orange-300 hover:bg-orange-800/50'
            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
        )}
      >
        <Flame size={12} className={currentStreak > 0 ? 'text-orange-400' : 'text-zinc-500'} />
        {currentStreak > 0 ? `${currentStreak} day${currentStreak !== 1 ? 's' : ''}` : 'No streak'}
      </button>

      {showPopover && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowPopover(false)} />

          {/* Popover */}
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl p-4">
            {/* Stats */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1 text-center">
                <div className={cn(
                  'text-2xl font-bold tabular-nums',
                  currentStreak > 0 ? 'text-orange-400' : 'text-zinc-500'
                )}>
                  {currentStreak}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">Current streak</div>
              </div>
              <div className="w-px bg-zinc-700" />
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold tabular-nums text-amber-400">
                  {longestStreak}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">Best streak</div>
              </div>
            </div>

            {/* Today status */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-3',
              practicedToday
                ? 'bg-green-900/30 text-green-400 border border-green-800'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            )}>
              {practicedToday ? (
                <>
                  <Trophy size={12} />
                  You've practiced today — keep it up!
                </>
              ) : (
                <>
                  <Calendar size={12} />
                  Practice today to {currentStreak > 0 ? 'keep your streak' : 'start a streak'}!
                </>
              )}
            </div>

            {/* Activity heatmap (last 28 days, 4 rows of 7) */}
            <div className="text-xs text-zinc-500 mb-2 font-medium">Last 4 weeks</div>
            <div className="grid grid-cols-7 gap-1">
              {recentActivity.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}${day.active ? ' — practiced' : ''}`}
                  className={cn(
                    'w-full aspect-square rounded-sm transition-colors',
                    day.active
                      ? 'bg-teal-500'
                      : 'bg-zinc-800'
                  )}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-zinc-600">
              <span>4 weeks ago</span>
              <span>Today</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
