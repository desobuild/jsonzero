import { memo } from 'react'
import type { JsonStructureStatistics } from '@/lib/json/statistics'

export interface StatisticsPanelProps {
  statistics: JsonStructureStatistics | null
}

export const StatisticsPanel = memo(function StatisticsPanel({
  statistics,
}: StatisticsPanelProps) {
  if (!statistics) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-text-muted">
        No statistics available.
      </div>
    )
  }

  const primaryMetrics = [
    { label: 'Root Type', value: statistics.rootType.toUpperCase() },
    { label: 'Max Depth', value: statistics.maxDepth },
    { label: 'Total Nodes', value: statistics.totalNodes },
    { label: 'Keys', value: statistics.keyCount },
  ]

  const structureBreakdown = [
    {
      label: 'Objects',
      value: statistics.objectCount,
      color: 'text-text-primary',
    },
    {
      label: 'Arrays',
      value: statistics.arrayCount,
      color: 'text-text-primary',
    },
    {
      label: 'Array Items',
      value: statistics.arrayItemCount,
      color: 'text-text-secondary',
    },
    { label: 'Strings', value: statistics.stringCount, color: 'text-accent' },
    {
      label: 'Numbers',
      value: statistics.numberCount,
      color: 'text-[#38BDF8]',
    },
    {
      label: 'Booleans',
      value: statistics.booleanCount,
      color: 'text-[#FBBF24]',
    },
    { label: 'Nulls', value: statistics.nullCount, color: 'text-[#A78BFA]' },
    {
      label: 'Primitives',
      value: statistics.primitiveCount,
      color: 'text-text-secondary',
    },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background p-3">
      {/* Header */}
      <div className="flex h-7 items-center justify-between border-b border-border pb-2 mb-3">
        <span className="font-mono text-2xs font-semibold uppercase tracking-wider text-text-secondary">
          Structure Statistics
        </span>
      </div>

      {/* Top 4 Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {primaryMetrics.map((item) => (
          <div
            key={item.label}
            className="flex flex-col rounded border border-border bg-surface-elevated/60 p-2 text-center"
          >
            <span className="font-mono text-base font-bold text-accent">
              {item.value}
            </span>
            <span className="text-3xs uppercase tracking-wider text-text-muted mt-0.5">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Detailed Type Breakdown Grid */}
      <div className="rounded border border-border bg-surface-elevated/30 p-2">
        <span className="text-3xs font-semibold uppercase tracking-wider text-text-muted block mb-2 px-1">
          Type & Node Breakdown
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1 font-mono text-xs">
          {structureBreakdown.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between border-b border-border/40 py-1"
            >
              <span className="text-text-secondary text-2xs">{item.label}</span>
              <span className={`font-semibold ${item.color}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
