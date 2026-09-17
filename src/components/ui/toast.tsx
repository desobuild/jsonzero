import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({
  message,
  type = 'success',
  onClose,
  duration = 2000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-error shrink-0" />,
    info: <Info className="h-4 w-4 text-accent shrink-0" />,
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-8 right-6 z-50 flex items-center gap-2.5 rounded-lg border border-border bg-surface-elevated px-3.5 py-2 text-xs font-medium text-text-primary shadow-lg backdrop-blur transition-all duration-200 animate-in fade-in slide-in-from-bottom-2'
      )}
    >
      {icons[type]}
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="ml-1 text-text-muted hover:text-text-primary focus-visible:outline-none"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
