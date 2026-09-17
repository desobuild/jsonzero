import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'

export function StatusBar() {
  return (
    <footer
      id="status-bar"
      className="flex h-6 items-center justify-between border-t border-border bg-surface px-3 text-2xs text-text-muted"
    >
      <div className="flex items-center gap-3">
        <span>Ready</span>
      </div>
      <PrivacyIndicator compact />
    </footer>
  )
}
