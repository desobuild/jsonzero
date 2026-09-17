import {
  Braces,
  Minimize2,
  CheckCircle2,
  Search,
  GitCompareArrows,
  FolderTree,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MoreMenu } from '@/components/shared/MoreMenu'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface ToolbarAction {
  id: string
  label: string
  icon: LucideIcon
  shortcut?: string
}

const primaryActions: ToolbarAction[] = [
  { id: 'format', label: 'Format', icon: Braces },
  { id: 'minify', label: 'Minify', icon: Minimize2 },
  { id: 'validate', label: 'Validate', icon: CheckCircle2 },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'diff', label: 'Diff', icon: GitCompareArrows },
  { id: 'tree', label: 'Tree', icon: FolderTree },
]

interface ToolbarProps {
  activeTool?: string
  onToolSelect?: (toolId: string) => void
}

export function Toolbar({ activeTool, onToolSelect }: ToolbarProps) {
  return (
    <div
      id="toolbar"
      className="flex items-center gap-0.5 border-b border-border bg-surface px-2 py-1"
    >
      {primaryActions.map((action) => (
        <Button
          key={action.id}
          variant={activeTool === action.id ? 'accent' : 'ghost'}
          size="sm"
          onClick={() => onToolSelect?.(action.id)}
          className={cn('gap-1.5', activeTool === action.id && 'font-semibold')}
        >
          <action.icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{action.label}</span>
        </Button>
      ))}

      <MoreMenu />
    </div>
  )
}
