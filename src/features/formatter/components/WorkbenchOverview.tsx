import {
  Code2,
  CheckCircle2,
  GitCompare,
  FolderTree,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
} from 'lucide-react'

const CAPABILITIES = [
  {
    title: 'JSON Formatter',
    description:
      'Format and minify JSON with custom indentation (2-space, 4-space, tabs).',
    icon: Code2,
  },
  {
    title: 'JSON Validator',
    description:
      'Instant client-side syntax validation with precise line and column indicators.',
    icon: CheckCircle2,
  },
  {
    title: 'JSON Diff',
    description:
      'Side-by-side structural comparison highlighting modified, added, and removed nodes.',
    icon: GitCompare,
  },
  {
    title: 'JSON Inspection',
    description:
      'Hierarchical tree viewer with collapsible nodes, type badges, and JSONPath queries.',
    icon: FolderTree,
  },
  {
    title: 'JSON Transformation',
    description:
      'Recursively sort keys, flatten nested objects, unflatten paths, and escape strings.',
    icon: Sparkles,
  },
  {
    title: 'JSON Conversion',
    description:
      'Convert JSON to CSV, Interactive Tables, TypeScript types, Dart models, and Schema.',
    icon: ArrowRightLeft,
  },
  {
    title: 'Developer & Testing Tools',
    description:
      'Schema validation, automated API assertions, Playwright test assertions, and mock JSON.',
    icon: ShieldCheck,
  },
] as const

export function WorkbenchOverview() {
  return (
    <section
      aria-label="JSONZero Overview and Capabilities"
      className="mt-6 w-full max-w-2xl border-t border-border/50 pt-5 text-left"
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold tracking-tight text-text-primary">
          JSONZero — Privacy-First JSON Developer Workbench
        </h2>
        <p className="mt-1 text-xs text-text-secondary leading-relaxed">
          Format, validate, compare, inspect, transform and convert JSON
          directly in your browser.
        </p>
        <p className="mt-1 text-3xs font-medium text-accent flex items-center gap-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Your JSON stays in your browser. No accounts. No ads. No tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon
          return (
            <div
              key={cap.title}
              className="flex items-start gap-2.5 rounded-md border border-border/40 bg-surface/50 p-2.5 transition-colors hover:border-border/80 hover:bg-surface"
            >
              <Icon className="h-4 w-4 shrink-0 text-text-muted mt-0.5" />
              <div>
                <h3 className="text-xs font-medium text-text-primary">
                  {cap.title}
                </h3>
                <p className="text-3xs text-text-muted leading-normal mt-0.5">
                  {cap.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
