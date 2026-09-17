/**
 * JSONZero — Testing Feature Utilities and Sample Data
 */

import type { TestingToolItem } from './types'

export const TESTING_TOOLS: TestingToolItem[] = [
  // VALIDATE
  {
    id: 'schema-validation',
    label: 'JSON Schema Validation',
    shortLabel: 'Schema',
    category: 'VALIDATE',
    description: 'Validate JSON against a JSON Schema 2020-12 subset locally',
  },
  // ASSERTIONS
  {
    id: 'api-assertions',
    label: 'API Assertions',
    shortLabel: 'API',
    category: 'ASSERTIONS',
    description: 'Generate TypeScript expect assertions for REST/JSON APIs',
  },
  {
    id: 'playwright-assertions',
    label: 'Playwright Assertions',
    shortLabel: 'Playwright',
    category: 'ASSERTIONS',
    description:
      'Generate Playwright API testing assertions with response assertions',
  },
  {
    id: 'generic-assertions',
    label: 'Generic Test Assertions',
    shortLabel: 'Generic',
    category: 'ASSERTIONS',
    description: 'Generate framework-neutral test assertions',
  },
  // MOCK
  {
    id: 'mock-json',
    label: 'Mock JSON Generator',
    shortLabel: 'Mock',
    category: 'MOCK',
    description:
      'Generate deterministic mock data while preserving schema and types',
  },
  // WORKFLOW
  {
    id: 'expected-actual',
    label: 'Expected vs Actual',
    shortLabel: 'Exp vs Act',
    category: 'WORKFLOW',
    description:
      'Compare expected and actual API responses and view diff summary',
  },
  {
    id: 'diff-assertions',
    label: 'Diff → Assertions',
    shortLabel: 'Diff Assert',
    category: 'WORKFLOW',
    description:
      'Generate assertions targeting expected responses from structural diff',
  },
]

export const SAMPLE_TESTING_JSON = `{
  "id": 42,
  "name": "Anirudh",
  "active": true,
  "roles": ["admin", "developer"],
  "profile": {
    "score": 98.5,
    "verified": true
  }
}`

export const SAMPLE_SCHEMA_DATA = `{
  "id": 42,
  "name": "Anirudh",
  "email": "anirudh@example.com",
  "age": 28,
  "tags": ["developer", "privacy"]
}`

export const SAMPLE_SCHEMA = `{
  "type": "object",
  "required": ["id", "name", "email"],
  "properties": {
    "id": { "type": "integer", "minimum": 1 },
    "name": { "type": "string", "minLength": 2 },
    "email": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$"
    },
    "age": { "type": "number", "minimum": 18 },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    }
  },
  "additionalProperties": false
}`

export const SAMPLE_EXPECTED_JSON = `{
  "status": "success",
  "code": 200,
  "data": {
    "id": 101,
    "name": "Widget Alpha",
    "inStock": true
  }
}`

export const SAMPLE_ACTUAL_JSON = `{
  "status": "success",
  "code": 200,
  "data": {
    "id": 101,
    "name": "Widget Beta",
    "inStock": false
  }
}`

/**
 * Downloads text as a file in the browser using Blob and ObjectURL.
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copies text to clipboard safely.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch {
    return false
  }
}
