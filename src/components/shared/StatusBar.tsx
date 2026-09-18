import { WifiOff } from 'lucide-react'
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'
import { cn } from '@/lib/utils'

export interface StatusBarProps {
  validationState?: 'idle' | 'valid' | 'invalid'
  lineCount?: number
  keyCount?: number
  byteCount?: number
  processingTimeMs?: number | null
  lastOperation?: 'format' | 'minify' | 'validate' | null
  isOnline?: boolean
}

export function StatusBar({
  validationState = 'idle',
  lineCount = 0,
  keyCount = 0,
  processingTimeMs = null,
  lastOperation = null,
  isOnline = true,
}: StatusBarProps) {
  const getValidationIndicator = () => {
    switch (validationState) {
      case 'valid':
        return (
          <div className="flex items-center gap-1.5 text-accent font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span>Valid JSON</span>
          </div>
        )
      case 'invalid':
        return (
          <div className="flex items-center gap-1.5 text-error font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-error" />
            <span>Invalid JSON</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-text-dim" />
            <span>Ready</span>
          </div>
        )
    }
  }

  const getOperationLabel = () => {
    if (lastOperation === 'minify') return 'Minified locally'
    if (lastOperation === 'format') return 'Formatted locally'
    if (lastOperation === 'validate') return 'Validated locally'
    return 'Processed locally'
  }

  return (
    <footer
      id="status-bar"
      className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-surface px-3 text-3xs text-text-muted select-none"
    >
      {/* Left side: Live document stats */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        {getValidationIndicator()}

        {lineCount > 0 && (
          <>
            <span className="text-text-dim">·</span>
            <span>{lineCount} lines</span>
          </>
        )}

        {keyCount > 0 && (
          <>
            <span className="text-text-dim">·</span>
            <span>{keyCount} keys</span>
          </>
        )}

        <span className="hidden sm:inline text-text-dim">·</span>
        <span className="hidden sm:inline">UTF-8</span>
      </div>

      {/* Right side: Execution performance, network indicator & privacy status */}
      <div className="flex items-center gap-3">
        {processingTimeMs !== null && (
          <div className="hidden xs:flex items-center gap-1 text-text-secondary font-mono">
            <span>{getOperationLabel()}</span>
            <span className="text-text-dim">·</span>
            <span
              className={cn(
                processingTimeMs < 5 ? 'text-accent' : 'text-text-secondary'
              )}
            >
              {processingTimeMs}ms
            </span>
          </div>
        )}

        <div
          id="network-status"
          role="status"
          aria-live="polite"
          className={cn(
            'flex items-center gap-1 font-mono text-3xs',
            isOnline ? 'text-text-muted' : 'text-warning font-medium'
          )}
          title={
            isOnline
              ? 'Network reachable. All JSON processing remains 100% client-side.'
              : 'Offline mode. All JSON processing continues 100% client-side.'
          }
        >
          {isOnline ? (
            <>
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-warning" aria-hidden="true" />
              <span>Offline</span>
            </>
          )}
        </div>

        <PrivacyIndicator compact />
      </div>
    </footer>
  )
}
