import type { DiffEntry, DiffSummary } from '@/lib/json/diff'

export const SAMPLE_JSON_A = `{
  "id": 1042,
  "name": "Alice Morgan",
  "age": 28,
  "role": "engineer",
  "contact": {
    "phone": "+1-555-0199",
    "city": "San Francisco"
  },
  "skills": [
    "TypeScript",
    "React",
    "Node.js"
  ]
}`

export const SAMPLE_JSON_B = `{
  "role": "lead engineer",
  "id": 1042,
  "name": "Alice Morgan",
  "age": 29,
  "contact": {
    "city": "San Francisco",
    "email": "alice@example.com"
  },
  "skills": [
    "React",
    "TypeScript",
    "Node.js",
    "Rust"
  ]
}`

/**
 * Pretty formats any JSON value for diff inspection.
 */
export function formatDiffValue(val: unknown): string {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'string') return `"${val}"`
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  try {
    return JSON.stringify(val, null, 2)
  } catch {
    return String(val)
  }
}

/**
 * Creates a text summary of the diff results.
 */
export function formatDiffSummaryText(summary: DiffSummary): string {
  if (summary.isIdentical) {
    return 'JSON documents are structurally identical. (No changes)'
  }
  return `${summary.added} Added · ${summary.removed} Removed · ${summary.changed} Changed (${summary.total} total)`
}

/**
 * Formats a single diff entry into a readable clipboard string.
 */
export function formatDiffEntryText(entry: DiffEntry): string {
  const parts: string[] = []
  parts.push(`[${entry.kind.toUpperCase()}] ${entry.path}`)

  if (entry.kind === 'changed') {
    parts.push(`Old: ${formatDiffValue(entry.oldValue)}`)
    parts.push(`New: ${formatDiffValue(entry.newValue)}`)
  } else if (entry.kind === 'added') {
    parts.push(`Value: ${formatDiffValue(entry.newValue)}`)
  } else if (entry.kind === 'removed') {
    parts.push(`Value: ${formatDiffValue(entry.oldValue)}`)
  }

  return parts.join('\n')
}
