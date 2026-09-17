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
      className="flex flex-col items-center gap-1 py-2 text-center"
    >
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-medium text-text-secondary">
          Your JSON stays in your browser.
        </span>
      </div>
      <p className="text-2xs text-text-muted">
        No ads · No accounts · No selling data · 100% client-side
      </p>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        <span className="text-2xs font-medium text-accent">
          Zero Network Activity
        </span>
      </div>
    </div>
  )
}
