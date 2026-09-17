import { Github, Moon, Sun, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <header
      id="header"
      className="flex h-10 items-center justify-between border-b border-border bg-surface px-3"
    >
      {/* Logo and tagline */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-semibold text-accent">
            {'{ }'}
          </span>
          <span className="text-sm font-semibold text-text-primary">
            JSONZero
          </span>
        </div>
        <span className="hidden text-xs text-text-muted sm:inline">
          JSON. Zero clutter.
        </span>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1">
        <a
          href="https://github.com/AnirudhKodetham/JSONZero"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon' }),
            'text-text-secondary'
          )}
        >
          <Github className="h-4 w-4" />
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="text-text-secondary"
            >
              <ThemeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setTheme(value)}
                className={theme === value ? 'text-accent' : ''}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
