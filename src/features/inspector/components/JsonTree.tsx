import { memo } from 'react'
import { JsonTreeNode } from '@/features/inspector/components/JsonTreeNode'

export interface JsonTreeProps {
  data: unknown
  expandedPaths: Set<string>
  onToggleExpand: (path: string) => void
  onCopyKey: (key: string | number) => void
  onCopyValue: (value: unknown) => void
  onCopyPath: (path: string) => void
  searchQuery: string
  activeMatchPath: string | null
}

export const JsonTree = memo(function JsonTree({
  data,
  expandedPaths,
  onToggleExpand,
  onCopyKey,
  onCopyValue,
  onCopyPath,
  searchQuery,
  activeMatchPath,
}: JsonTreeProps) {
  if (data === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-text-muted">
        No JSON data to inspect.
      </div>
    )
  }

  return (
    <div
      role="tree"
      aria-label="JSON Structure Tree"
      className="flex-1 overflow-auto p-2 font-mono text-xs select-text focus:outline-hidden"
    >
      <JsonTreeNode
        nodeKey={null}
        value={data}
        path="$"
        depth={0}
        isExpanded={expandedPaths.has('$')}
        expandedPaths={expandedPaths}
        onToggleExpand={onToggleExpand}
        onCopyKey={onCopyKey}
        onCopyValue={onCopyValue}
        onCopyPath={onCopyPath}
        searchQuery={searchQuery}
        activeMatchPath={activeMatchPath}
      />
    </div>
  )
})
