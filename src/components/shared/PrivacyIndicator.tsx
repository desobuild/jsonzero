import { ShieldCheck } from 'lucide-react'

interface PrivacyIndicatorProps {
  /** Compact mode shows only the essential message */
  compact?: boolean
}

export function PrivacyIndicator({ compact = false }: PrivacyIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-2xs text-text-muted">
        <ShieldCheck className="h-3 w-3 text-accent" />
        <span>100% client-side</span>
      </div>
    )
  }

  return (
    <div
      id="privacy-indicator"
      className="flex items-center justify-center gap-3 border-b border-border/60 bg-surface/50 px-3 py-1.5 text-center select-none"
    >
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="text-xs font-medium text-text-secondary">
          Your JSON stays in your browser.
        </span>
      </div>
      <span className="hidden text-2xs text-text-muted sm:inline">
        No ads · No accounts · No selling data · 100% client-side
      </span>
    </div>
  )
}
