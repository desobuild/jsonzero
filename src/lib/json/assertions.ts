/**
 * JSONZero — Test Assertion Generator Engine
 *
 * Deterministically generates API, Playwright, and Generic assertions from JSON data.
 * Zero external dependencies. Operates client-side only.
 */

import { formatJsonPath } from '@/lib/json/path'
import { getJsonType } from '@/lib/json/statistics'
import type { DiffResult } from '@/lib/json/diff'

export type AssertionStyle = 'generic' | 'api' | 'playwright'

export interface AssertionOptions {
  style?: AssertionStyle
  includeStructure?: boolean
  includeTypes?: boolean
  includeValues?: boolean
  includeArrayLength?: boolean
  maxArrayItems?: number
  responseVariable?: string
  includeStatusAssertion?: boolean
}

export interface AssertionItem {
  id: string
  path: string
  type: 'structure' | 'type' | 'value' | 'length'
  code: string
  description: string
}

export interface GeneratedAssertions {
  style: AssertionStyle
  items: AssertionItem[]
  code: string
}

const VALID_IDENTIFIER_REGEX = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/

/**
 * Formats a path into a valid JavaScript property accessor (e.g. `body.user["first-name"][0]`).
 */
export function formatJsAccessor(
  rootVar: string,
  segments: (string | number)[]
): string {
  if (segments.length === 0) {
    return rootVar
  }

  let result = rootVar
  for (const seg of segments) {
    if (typeof seg === 'number') {
      result += `[${seg}]`
    } else if (VALID_IDENTIFIER_REGEX.test(seg)) {
      result += `.${seg}`
    } else {
      const escaped = seg.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      result += `["${escaped}"]`
    }
  }
  return result
}

function stringifyLiteral(val: unknown): string {
  if (val === null) return 'null'
  if (val === undefined) return 'undefined'
  if (typeof val === 'string') {
    return JSON.stringify(val)
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val)
  }
  return JSON.stringify(val)
}

export function generateAssertions(
  data: unknown,
  options: AssertionOptions = {}
): GeneratedAssertions {
  const {
    style = 'api',
    includeStructure = true,
    includeTypes = true,
    includeValues = true,
    includeArrayLength = false,
    maxArrayItems = 5,
    responseVariable = style === 'playwright' ? 'body' : 'response',
    includeStatusAssertion = true,
  } = options

  const items: AssertionItem[] = []
  let itemCounter = 0

  function addItem(
    path: string,
    type: 'structure' | 'type' | 'value' | 'length',
    code: string,
    description: string
  ) {
    items.push({
      id: `assert-${++itemCounter}`,
      path,
      type,
      code,
      description,
    })
  }

  function walk(val: unknown, segments: (string | number)[]): void {
    const jsonPath = formatJsonPath(segments)
    const jsTarget = formatJsAccessor(responseVariable, segments)
    const valType = getJsonType(val)

    // Root-level handling
    if (segments.length === 0) {
      if (includeStructure) {
        if (style === 'generic') {
          addItem(jsonPath, 'structure', `ASSERT $ EXISTS`, 'Root exists')
        } else {
          addItem(
            jsonPath,
            'structure',
            `expect(${jsTarget}).toBeDefined();`,
            'Root is defined'
          )
        }
      }
      if (includeTypes) {
        if (style === 'generic') {
          addItem(
            jsonPath,
            'type',
            `ASSERT $ TYPE ${valType}`,
            `Root type is ${valType}`
          )
        } else if (valType === 'array') {
          addItem(
            jsonPath,
            'type',
            `expect(Array.isArray(${jsTarget})).toBe(true);`,
            'Root is an array'
          )
        } else if (valType === 'object') {
          addItem(
            jsonPath,
            'type',
            `expect(typeof ${jsTarget}).toBe('object');`,
            'Root is an object'
          )
        }
      }
    }

    // 1. Primitive types
    if (
      val === null ||
      typeof val === 'string' ||
      typeof val === 'number' ||
      typeof val === 'boolean'
    ) {
      if (segments.length > 0) {
        if (includeStructure) {
          if (style === 'generic') {
            addItem(
              jsonPath,
              'structure',
              `ASSERT ${jsonPath} EXISTS`,
              `${jsonPath} exists`
            )
          } else {
            addItem(
              jsonPath,
              'structure',
              `expect(${jsTarget}).toBeDefined();`,
              `${jsTarget} is defined`
            )
          }
        }

        if (includeTypes) {
          if (style === 'generic') {
            addItem(
              jsonPath,
              'type',
              `ASSERT ${jsonPath} TYPE ${valType}`,
              `${jsonPath} type is ${valType}`
            )
          } else if (val === null) {
            addItem(
              jsonPath,
              'type',
              `expect(${jsTarget}).toBeNull();`,
              `${jsTarget} is null`
            )
          } else {
            addItem(
              jsonPath,
              'type',
              `expect(typeof ${jsTarget}).toBe('${typeof val}');`,
              `${jsTarget} type is ${typeof val}`
            )
          }
        }

        if (includeValues) {
          const literal = stringifyLiteral(val)
          if (style === 'generic') {
            addItem(
              jsonPath,
              'value',
              `ASSERT ${jsonPath} EQUALS ${literal}`,
              `${jsonPath} equals ${literal}`
            )
          } else if (val === null) {
            // Already covered or toBe(null)
            if (!includeTypes) {
              addItem(
                jsonPath,
                'value',
                `expect(${jsTarget}).toBe(null);`,
                `${jsTarget} is null`
              )
            }
          } else {
            addItem(
              jsonPath,
              'value',
              `expect(${jsTarget}).toBe(${literal});`,
              `${jsTarget} equals ${literal}`
            )
          }
        }
      }
      return
    }

    // 2. Objects
    if (valType === 'object' && val !== null) {
      const obj = val as Record<string, unknown>
      const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b))

      if (segments.length > 0) {
        if (includeStructure) {
          if (style === 'generic') {
            addItem(
              jsonPath,
              'structure',
              `ASSERT ${jsonPath} EXISTS`,
              `${jsonPath} exists`
            )
          } else {
            addItem(
              jsonPath,
              'structure',
              `expect(${jsTarget}).toBeDefined();`,
              `${jsTarget} is defined`
            )
          }
        }

        if (includeTypes) {
          if (style === 'generic') {
            addItem(
              jsonPath,
              'type',
              `ASSERT ${jsonPath} TYPE object`,
              `${jsonPath} type is object`
            )
          } else {
            addItem(
              jsonPath,
              'type',
              `expect(typeof ${jsTarget}).toBe('object');`,
              `${jsTarget} is an object`
            )
          }
        }
      }

      for (const k of keys) {
        walk(obj[k], [...segments, k])
      }
      return
    }

    // 3. Arrays
    if (Array.isArray(val)) {
      if (segments.length > 0) {
        if (includeStructure) {
          if (style === 'generic') {
            addItem(
              jsonPath,
              'structure',
              `ASSERT ${jsonPath} EXISTS`,
              `${jsonPath} exists`
            )
          } else {
            addItem(
              jsonPath,
              'structure',
              `expect(${jsTarget}).toBeDefined();`,
              `${jsTarget} is defined`
            )
          }
        }

        if (includeTypes) {
          if (style === 'generic') {
            addItem(
              jsonPath,
              'type',
              `ASSERT ${jsonPath} TYPE array`,
              `${jsonPath} type is array`
            )
          } else {
            addItem(
              jsonPath,
              'type',
              `expect(Array.isArray(${jsTarget})).toBe(true);`,
              `${jsTarget} is an array`
            )
          }
        }
      }

      if (includeArrayLength) {
        if (style === 'generic') {
          addItem(
            jsonPath,
            'length',
            `ASSERT ${jsonPath} LENGTH ${val.length}`,
            `${jsonPath} length is ${val.length}`
          )
        } else {
          addItem(
            jsonPath,
            'length',
            `expect(${jsTarget}).toHaveLength(${val.length});`,
            `${jsTarget} has length ${val.length}`
          )
        }
      }

      const sampleLimit = Math.min(val.length, Math.max(1, maxArrayItems))
      for (let i = 0; i < sampleLimit; i++) {
        walk(val[i], [...segments, i])
      }
    }
  }

  walk(data, [])

  // Generate complete formatted code snippet
  let codeSnippet = ''
  if (style === 'playwright') {
    const lines: string[] = []
    lines.push(`// Playwright API Test`)
    lines.push(`const response = await request.get('<YOUR_ENDPOINT>');`)
    if (includeStatusAssertion) {
      lines.push(`expect(response.ok()).toBeTruthy();`)
      lines.push(`expect(response.status()).toBe(200);`)
    }
    lines.push(``)
    lines.push(`const ${responseVariable} = await response.json();`)
    lines.push(``)
    for (const item of items) {
      lines.push(item.code)
    }
    codeSnippet = lines.join('\n')
  } else if (style === 'api') {
    const lines: string[] = []
    lines.push(`// API Assertions`)
    for (const item of items) {
      lines.push(item.code)
    }
    codeSnippet = lines.join('\n')
  } else {
    codeSnippet = items.map((i) => i.code).join('\n')
  }

  return {
    style,
    items,
    code: codeSnippet,
  }
}

/**
 * Generates assertions based on expected data and structural diff differences.
 * Targets the expected state of changed, added, or removed properties.
 */
export function generateDiffAssertions(
  diff: DiffResult,
  expectedData: unknown,
  options: AssertionOptions = {}
): GeneratedAssertions {
  // If identical, generate standard assertions for the entire expected data
  if (diff.summary.isIdentical) {
    return generateAssertions(expectedData, options)
  }

  // Find all paths from diff where expected has a value (changed or removed from actual)
  const targetPaths = new Set<string>()
  for (const entry of diff.entries) {
    if (entry.kind === 'changed' || entry.kind === 'removed') {
      targetPaths.add(entry.path)
    }
  }

  // Generate full assertions for expected
  const fullAssertions = generateAssertions(expectedData, options)

  // Filter assertions to those matching changed/removed paths or their ancestors/descendants
  const filteredItems = fullAssertions.items.filter((item) => {
    for (const path of targetPaths) {
      if (item.path === path || item.path.startsWith(path)) {
        return true
      }
    }
    return false
  })

  // If filtered is empty for some reason, fallback to full assertions
  const items = filteredItems.length > 0 ? filteredItems : fullAssertions.items

  let codeSnippet = ''
  if (options.style === 'playwright') {
    const lines: string[] = []
    lines.push(`// Playwright Assertions (Expected Response)`)
    lines.push(`const response = await request.get('<YOUR_ENDPOINT>');`)
    if (options.includeStatusAssertion ?? true) {
      lines.push(`expect(response.ok()).toBeTruthy();`)
    }
    lines.push(``)
    lines.push(
      `const ${options.responseVariable || 'body'} = await response.json();`
    )
    lines.push(``)
    for (const item of items) {
      lines.push(item.code)
    }
    codeSnippet = lines.join('\n')
  } else if (options.style === 'api' || !options.style) {
    codeSnippet =
      `// Diff Assertions (Expected Response)\n` +
      items.map((i) => i.code).join('\n')
  } else {
    codeSnippet = items.map((i) => i.code).join('\n')
  }

  return {
    style: options.style || 'api',
    items,
    code: codeSnippet,
  }
}
