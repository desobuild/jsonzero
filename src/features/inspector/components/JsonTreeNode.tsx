import React, { memo, useState, useEffect } from 'react'
import { ChevronRight, Copy, Key, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getValueType } from '@/features/inspector/utils'
import { appendJsonPath } from '@/lib/json/path'
import { cn } from '@/lib/utils'

export interface JsonTreeNodeProps {
  nodeKey: string | number | null
  value: unknown
  path: string
  depth: number
  isExpanded: boolean
  expandedPaths: Set<string>
  onToggleExpand: (path: string) => void
  onCopyKey: (key: string | number) => void
  onCopyValue: (value: unknown) => void
  onCopyPath: (path: string) => void
  searchQuery: string
  activeMatchPath: string | null
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text.toLowerCase().includes(query.toLowerCase())) {
    return <>{text}</>
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    const index = lowerText.indexOf(lowerQuery, startIndex)
    if (index === -1) {
      parts.push(text.slice(startIndex))
      break
    }

    if (index > startIndex) {
      parts.push(text.slice(startIndex, index))
    }

    parts.push(
      <mark
        key={index}
        className="rounded-xs bg-accent/35 px-0.5 font-semibold text-accent"
      >
        {text.slice(index, index + query.length)}
      </mark>
    )

    startIndex = index + query.length
  }

  return <>{parts}</>
}

export const TREE_NODE_PAGE_SIZE = 50

export const JsonTreeNode = memo(function JsonTreeNode({
  nodeKey,
  value,
  path,
  depth,
  isExpanded,
  expandedPaths,
  onToggleExpand,
  onCopyKey,
  onCopyValue,
  onCopyPath,
  searchQuery,
  activeMatchPath,
}: JsonTreeNodeProps) {
  const type = getValueType(value)
  const isExpandable = type === 'object' || type === 'array'
  const isArray = type === 'array'
  const isObject = type === 'object'

  let childCount = 0
  if (isArray) {
    childCount = (value as unknown[]).length
  } else if (isObject && value !== null) {
    childCount = Object.keys(value as Record<string, unknown>).length
  }

  const [renderedLimit, setRenderedLimit] = useState(TREE_NODE_PAGE_SIZE)

  // Ensure active search match is within rendered bounds if matching a descendant item
  useEffect(() => {
    if (activeMatchPath && activeMatchPath.startsWith(path)) {
      const rest = activeMatchPath.slice(path.length)
      const match = rest.match(/^\[(\d+)\]/)
      if (match) {
        const idx = parseInt(match[1], 10)
        if (idx >= renderedLimit) {
          setRenderedLimit((prev) => Math.max(prev, idx + 20))
        }
      }
    }
  }, [activeMatchPath, path, renderedLimit])

  const isCurrentMatch = activeMatchPath === path
  const isArrayItem = typeof nodeKey === 'number'

  return (
    <div
      className="flex flex-col"
      role="treeitem"
      aria-expanded={isExpandable ? isExpanded : undefined}
    >
      {/* Node Row */}
      <div
        className={cn(
          'group flex min-h-[26px] items-center gap-1 rounded-sm py-0.5 pr-2 transition-colors hover:bg-surface-elevated/70',
          isCurrentMatch && 'bg-accent/15 ring-1 ring-accent/60'
        )}
        style={{ paddingLeft: `${depth * 18 + 6}px` }}
      >
        {/* Expand / Collapse Chevron */}
        {isExpandable ? (
          <button
            type="button"
            aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
            onClick={() => onToggleExpand(path)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted transition-transform hover:text-text-primary focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-accent"
          >
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-150',
                isExpanded && 'rotate-90 text-accent'
              )}
            />
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}

        {/* Node Key or Index */}
        {nodeKey !== null && (
          <span
            className={cn(
              'font-mono text-xs select-text',
              isArrayItem
                ? 'font-medium text-text-muted'
                : 'font-semibold text-text-primary'
            )}
          >
            {isArrayItem ? (
              <span className="text-text-muted/80">
                <HighlightText text={String(nodeKey)} query={searchQuery} />
                <span className="mr-1 text-text-muted/50">:</span>
              </span>
            ) : (
              <span>
                <HighlightText text={String(nodeKey)} query={searchQuery} />
                <span className="mr-1 text-text-muted/50">:</span>
              </span>
            )}
          </span>
        )}

        {/* Node Value Presentation */}
        <div className="flex flex-1 items-center gap-1.5 overflow-hidden select-text">
          {isArray && (
            <span
              onClick={() => onToggleExpand(path)}
              className="cursor-pointer font-mono text-xs text-text-muted hover:text-text-secondary"
            >
              {childCount === 0 ? (
                '[]'
              ) : (
                <>
                  <span className="text-text-secondary">[</span>
                  <span className="text-3xs text-text-muted px-1">
                    {childCount} {childCount === 1 ? 'item' : 'items'}
                  </span>
                  <span className="text-text-secondary">]</span>
                </>
              )}
            </span>
          )}

          {isObject && (
            <span
              onClick={() => onToggleExpand(path)}
              className="cursor-pointer font-mono text-xs text-text-muted hover:text-text-secondary"
            >
              {childCount === 0 ? (
                '{}'
              ) : (
                <>
                  <span className="text-text-secondary">{'{'}</span>
                  <span className="text-3xs text-text-muted px-1">
                    {childCount} {childCount === 1 ? 'key' : 'keys'}
                  </span>
                  <span className="text-text-secondary">{'}'}</span>
                </>
              )}
            </span>
          )}

          {type === 'string' && (
            <span className="truncate font-mono text-xs text-accent">
              &quot;
              <HighlightText text={String(value)} query={searchQuery} />
              &quot;
            </span>
          )}

          {type === 'number' && (
            <span className="font-mono text-xs text-syntax-number">
              <HighlightText text={String(value)} query={searchQuery} />
            </span>
          )}

          {type === 'boolean' && (
            <span className="font-mono text-xs font-medium text-syntax-boolean">
              <HighlightText text={String(value)} query={searchQuery} />
            </span>
          )}

          {type === 'null' && (
            <span className="font-mono text-xs italic text-syntax-null">
              <HighlightText text="null" query={searchQuery} />
            </span>
          )}
        </div>

        {/* Node Action Buttons (Hover / Focus) */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {nodeKey !== null && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Copy key"
              title="Copy key"
              onClick={() => onCopyKey(nodeKey)}
              className="h-5 w-5 p-0 text-text-muted hover:bg-surface hover:text-text-primary"
            >
              <Key className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy value"
            title="Copy value"
            onClick={() => onCopyValue(value)}
            className="h-5 w-5 p-0 text-text-muted hover:bg-surface hover:text-text-primary"
          >
            <Copy className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-label="Copy JSON path"
            title="Copy JSON path"
            onClick={() => onCopyPath(path)}
            className="h-5 w-5 p-0 text-text-muted hover:bg-surface hover:text-text-primary"
          >
            <Route className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Children Recursion when Expanded */}
      {isExpandable && isExpanded && (
        <div role="group" className="flex flex-col">
          {isArray &&
            (value as unknown[]).slice(0, renderedLimit).map((item, index) => {
              const childPath = `${path}[${index}]`
              return (
                <JsonTreeNode
                  key={index}
                  nodeKey={index}
                  value={item}
                  path={childPath}
                  depth={depth + 1}
                  isExpanded={expandedPaths.has(childPath)}
                  expandedPaths={expandedPaths}
                  onToggleExpand={onToggleExpand}
                  onCopyKey={onCopyKey}
                  onCopyValue={onCopyValue}
                  onCopyPath={onCopyPath}
                  searchQuery={searchQuery}
                  activeMatchPath={activeMatchPath}
                />
              )
            })}

          {isObject &&
            Object.keys(value as Record<string, unknown>)
              .slice(0, renderedLimit)
              .map((k) => {
                const childPath = appendJsonPath(path, k)
                const childVal = (value as Record<string, unknown>)[k]
                return (
                  <JsonTreeNode
                    key={k}
                    nodeKey={k}
                    value={childVal}
                    path={childPath}
                    depth={depth + 1}
                    isExpanded={expandedPaths.has(childPath)}
                    expandedPaths={expandedPaths}
                    onToggleExpand={onToggleExpand}
                    onCopyKey={onCopyKey}
                    onCopyValue={onCopyValue}
                    onCopyPath={onCopyPath}
                    searchQuery={searchQuery}
                    activeMatchPath={activeMatchPath}
                  />
                )
              })}

          {/* Large collection pagination / show more controls */}
          {childCount > renderedLimit && (
            <div
              className="flex items-center gap-2 py-1.5 text-3xs text-text-muted select-none"
              style={{ paddingLeft: `${(depth + 1) * 18 + 6}px` }}
            >
              <span>
                Showing 1–{renderedLimit} of {childCount}{' '}
                {isArray ? 'items' : 'keys'}
              </span>
              <button
                type="button"
                onClick={() =>
                  setRenderedLimit((prev) =>
                    Math.min(childCount, prev + TREE_NODE_PAGE_SIZE)
                  )
                }
                className="rounded border border-border bg-surface px-2 py-0.5 font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              >
                Show next{' '}
                {Math.min(TREE_NODE_PAGE_SIZE, childCount - renderedLimit)}
              </button>
              <button
                type="button"
                onClick={() => setRenderedLimit(childCount)}
                className="rounded border border-border bg-surface px-2 py-0.5 font-medium text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors"
              >
                Show all ({childCount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
