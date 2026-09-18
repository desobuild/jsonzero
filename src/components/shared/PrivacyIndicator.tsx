import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PrivacyIndicatorProps {
  /** Compact mode shows only the essential message */
  compact?: boolean
  className?: string
}

export function PrivacyIndicator({
  compact = false,
  className,
}: PrivacyIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-text-muted select-none">
        <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
        <span>100% client-side</span>
      </div>
    )
  }

  return (
    <div
      id="privacy-indicator"
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-center select-none px-2',
        className
      )}
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
        <span className="text-xs sm:text-[13px] font-medium text-text-secondary">
          Your JSON stays in your browser.
        </span>
      </div>
      <span className="hidden xl:inline text-border">·</span>
      <span className="text-xs text-text-muted hidden sm:inline">
        No ads · No accounts · No selling data · 100% client-side
      </span>
    </div>
  )
}
