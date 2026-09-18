import { Github, Moon, Sun, Monitor, Download } from 'lucide-react'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { Button, buttonVariants } from '@/components/ui/button'
import { PrivacyIndicator } from '@/components/shared/PrivacyIndicator'
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

export interface HeaderProps {
  canInstall?: boolean
  onInstall?: () => void
}

export function Header({ canInstall = false, onInstall }: HeaderProps = {}) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <header
      id="header"
      className="grid grid-cols-2 md:grid-cols-[auto_1fr_auto] items-center border-b border-border bg-surface px-3 sm:px-4 py-2 md:py-0 md:h-12 gap-y-1.5 md:gap-y-0"
    >
      {/* Logo and tagline */}
      <div className="flex items-center gap-2.5 sm:gap-3 justify-self-start shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-accent">
            {'{ }'}
          </span>
          <span className="text-sm sm:text-base font-bold tracking-tight text-text-primary">
            JSONZero
          </span>
        </div>
        <span className="hidden sm:inline text-xs text-text-muted">
          JSON. Zero clutter.
        </span>
      </div>

      {/* Center: Privacy message */}
      <div className="col-span-2 md:col-span-1 flex justify-center order-last md:order-none py-0.5 md:py-0 overflow-hidden">
        <PrivacyIndicator />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-1.5 justify-self-end shrink-0">
        {canInstall && (
          <Button
            id="install-pwa-btn"
            variant="ghost"
            size="sm"
            onClick={onInstall}
            aria-label="Install JSONZero as application"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-accent hover:text-accent font-medium h-8"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}

        <a
          href="https://github.com/desobuild/jsonzero"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View on GitHub"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
            'text-text-secondary hover:text-text-primary'
          )}
        >
          <Github className="h-4 w-4" />
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle theme"
              className="text-text-secondary hover:text-text-primary"
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
