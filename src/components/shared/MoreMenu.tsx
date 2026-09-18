import {
  MoreHorizontal,
  Wrench,
  ArrowRightLeft,
  TestTube,
  SortAsc,
  Layers,
  Layers2,
  Quote,
  Table,
  FileCode,
  FileJson,
  FlaskConical,
  ClipboardCheck,
  Shuffle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MoreMenuItem {
  id: string
  label: string
  icon: typeof Wrench
}

interface MoreMenuSection {
  label: string
  items: MoreMenuItem[]
}

const sections: MoreMenuSection[] = [
  {
    label: 'Transform',
    items: [
      { id: 'repair', label: 'Repair', icon: Wrench },
      { id: 'sort-keys', label: 'Sort Keys', icon: SortAsc },
      { id: 'flatten', label: 'Flatten', icon: Layers },
      { id: 'unflatten', label: 'Unflatten', icon: Layers2 },
      { id: 'escape', label: 'Escape', icon: Quote },
      { id: 'unescape', label: 'Unescape', icon: Quote },
    ],
  },
  {
    label: 'Convert',
    items: [
      { id: 'table', label: 'Table', icon: Table },
      { id: 'csv', label: 'CSV', icon: ArrowRightLeft },
      { id: 'typescript', label: 'TypeScript', icon: FileCode },
      { id: 'dart', label: 'Dart', icon: FileCode },
      { id: 'json-schema', label: 'JSON Schema', icon: FileJson },
    ],
  },
  {
    label: 'Developer',
    items: [
      {
        id: 'schema-validation',
        label: 'Schema Validation',
        icon: ClipboardCheck,
      },
      { id: 'assertions', label: 'API Assertions', icon: ClipboardCheck },
      { id: 'playwright', label: 'Playwright Assertions', icon: FlaskConical },
      { id: 'generic-assertions', label: 'Generic Assertions', icon: FileCode },
      { id: 'expected-vs-actual', label: 'Expected vs Actual', icon: TestTube },
      { id: 'mock-json', label: 'Mock JSON', icon: Shuffle },
    ],
  },
]

import type { ConvertType } from '@/features/convert'
import type { TestingType } from '@/features/testing'

export interface MoreMenuProps {
  onSelectTransform?: (
    type: 'sort-keys' | 'flatten' | 'unflatten' | 'escape' | 'unescape'
  ) => void
  onSelectConvert?: (type: ConvertType) => void
  onSelectTesting?: (type: TestingType) => void
  onFutureToolSelect?: (toolName: string) => void
}

export function MoreMenu({
  onSelectTransform,
  onSelectConvert,
  onSelectTesting,
  onFutureToolSelect,
}: MoreMenuProps = {}) {
  const handleItemClick = (item: MoreMenuItem) => {
    switch (item.id) {
      case 'sort-keys':
      case 'flatten':
      case 'unflatten':
      case 'escape':
      case 'unescape':
        onSelectTransform?.(item.id)
        break
      case 'table':
      case 'csv':
      case 'typescript':
      case 'dart':
      case 'json-schema':
        onSelectConvert?.(item.id as ConvertType)
        break
      case 'schema-validation':
        onSelectTesting?.('schema-validation')
        break
      case 'assertions':
      case 'api-assertions':
        onSelectTesting?.('api-assertions')
        break
      case 'playwright':
      case 'playwright-assertions':
        onSelectTesting?.('playwright-assertions')
        break
      case 'generic-assertions':
        onSelectTesting?.('generic-assertions')
        break
      case 'expected-vs-actual':
        onSelectTesting?.('expected-actual')
        break
      case 'diff-assertions':
        onSelectTesting?.('diff-assertions')
        break
      case 'mock-json':
        onSelectTesting?.('mock-json')
        break
      default:
        onFutureToolSelect?.(item.label)
        break
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="toolbar-more"
          data-testid="toolbar-more"
          aria-label="More tools"
          variant="ghost"
          size="default"
          className="h-9 px-3 gap-2 text-text-secondary hover:bg-surface-elevated hover:text-text-primary shrink-0 text-sm"
        >
          <MoreHorizontal className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {sections.map((section, sectionIndex) => (
          <DropdownMenuGroup key={section.label}>
            {sectionIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{section.label}</DropdownMenuLabel>
            {section.items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                data-testid={`more-menu-${item.id}`}
                onClick={() => handleItemClick(item)}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
