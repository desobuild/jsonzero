import { XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface ErrorDisplayProps {
  title: string
  message: string
  severity?: ErrorSeverity
  /** Optional hint for how to resolve the issue */
  hint?: string
  className?: string
}

const severityConfig = {
  error: {
    icon: XCircle,
    borderClass: 'border-error/30',
    iconClass: 'text-error',
    bgClass: 'bg-error/5',
  },
  warning: {
    icon: AlertTriangle,
    borderClass: 'border-warning/30',
    iconClass: 'text-warning',
    bgClass: 'bg-warning/5',
  },
  info: {
    icon: Info,
    borderClass: 'border-accent/30',
    iconClass: 'text-accent',
    bgClass: 'bg-accent/5',
  },
} as const

export function ErrorDisplay({
  title,
  message,
  severity = 'error',
  hint,
  className,
}: ErrorDisplayProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-md border p-3',
        config.borderClass,
        config.bgClass,
        className
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', config.iconClass)} />
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="font-mono text-xs text-text-secondary">{message}</p>
        {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
      </div>
    </div>
  )
}
