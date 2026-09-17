/**
 * JSONZero — AssertionRow Component
 *
 * Displays a single assertion item with type badge, path, and single-click copy.
 */

import React from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AssertionItem } from '../types'
import { copyToClipboard } from '../utils'

export interface AssertionRowProps {
  item: AssertionItem
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void
}

export const AssertionRow: React.FC<AssertionRowProps> = ({
  item,
  onToast,
}) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    const ok = await copyToClipboard(item.code)
    if (ok) {
      setCopied(true)
      onToast?.('Copied assertion', 'success')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const badgeColor =
    item.type === 'structure'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : item.type === 'type'
        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
        : item.type === 'value'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'

  return (
    <div
      data-testid="assertion-row"
      className="group flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-xs font-mono transition-colors hover:bg-surface-elevated/40"
    >
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <span
          className={`rounded border px-1.5 py-0.5 text-3xs uppercase font-sans font-semibold shrink-0 ${badgeColor}`}
        >
          {item.type}
        </span>
        <span className="text-3xs text-text-muted shrink-0 select-none">
          {item.path}
        </span>
        <span className="truncate text-text-primary" title={item.code}>
          {item.code}
        </span>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        aria-label={`Copy assertion: ${item.code}`}
        className="h-6 w-6 p-0 text-text-muted hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  )
}
