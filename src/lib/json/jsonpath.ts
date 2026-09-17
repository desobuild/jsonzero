/**
 * JSONZero — JSONPath Query Evaluator
 *
 * Safe, zero-dependency implementation of a practical JSONPath subset:
 * - Root: `$`
 * - Property: `.property`, `["property"]`, `['property']`
 * - Array Index: `[0]`, `[1]`, etc.
 * - Wildcard: `[*]`, `.*`
 * - Chaining: `$.users[*].name`
 * - Filter expressions: `[?(@.property == "value")]`, `[?(@.prop > 10)]`, `[?(@.active)]`
 *
 * Never uses `eval()` or `Function()` constructors. Pure client-side parsing.
 */

import { formatPathSegment } from '@/lib/json/path'

export interface JsonPathMatch {
  value: unknown
  path: string
}

export interface JsonPathResult {
  success: boolean
  results: JsonPathMatch[]
  error?: string
}

type Token =
  | { type: 'root' }
  | { type: 'property'; name: string }
  | { type: 'index'; index: number }
  | { type: 'wildcard' }
  | {
      type: 'filter'
      field: string
      operator?: '==' | '!=' | '>' | '>=' | '<' | '<='
      targetValue?: unknown
    }

/**
 * Tokenize a JSONPath query string into an array of traversal tokens.
 */
export function parseJsonPath(query: string): {
  tokens?: Token[]
  error?: string
} {
  const trimmed = query.trim()
  if (!trimmed) {
    return { error: 'JSONPath query cannot be empty' }
  }

  if (!trimmed.startsWith('$')) {
    return { error: 'JSONPath query must start with "$"' }
  }

  const tokens: Token[] = [{ type: 'root' }]
  let i = 1
  const len = trimmed.length

  while (i < len) {
    const ch = trimmed[i]

    // 1. Dot property or wildcard
    if (ch === '.') {
      i++
      if (i >= len) {
        return { error: 'Unexpected trailing dot in JSONPath' }
      }

      // Wildcard .*
      if (trimmed[i] === '*') {
        tokens.push({ type: 'wildcard' })
        i++
        continue
      }

      // Dot followed by property name
      let propName = ''
      while (i < len && /[a-zA-Z0-9_$]/.test(trimmed[i])) {
        propName += trimmed[i]
        i++
      }

      if (!propName) {
        if (trimmed[i] === '[') {
          // e.g. "$.[0]" - allow stepping to bracket
          continue
        }
        return { error: `Expected property name after dot at position ${i}` }
      }

      tokens.push({ type: 'property', name: propName })
      continue
    }

    // 2. Bracket notation: [0], ['prop'], ["prop"], [*], [?(@.id == 2)]
    if (ch === '[') {
      const closeBracket = trimmed.indexOf(']', i)
      if (closeBracket === -1) {
        return { error: `Unclosed bracket starting at position ${i}` }
      }

      const inner = trimmed.slice(i + 1, closeBracket).trim()
      i = closeBracket + 1

      if (!inner) {
        return { error: 'Empty bracket expression "[]"' }
      }

      // 2a. Wildcard [*]
      if (inner === '*') {
        tokens.push({ type: 'wildcard' })
        continue
      }

      // 2b. Numeric array index [0], [42]
      if (/^-?\d+$/.test(inner)) {
        const index = parseInt(inner, 10)
        tokens.push({ type: 'index', index })
        continue
      }

      // 2c. Quoted property ['prop'] or ["prop"]
      if (
        (inner.startsWith("'") && inner.endsWith("'")) ||
        (inner.startsWith('"') && inner.endsWith('"'))
      ) {
        const unquoted = inner
          .slice(1, -1)
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
        tokens.push({ type: 'property', name: unquoted })
        continue
      }

      // 2d. Filter expression [?(@.property == value)]
      if (inner.startsWith('?(') && inner.endsWith(')')) {
        const filterBody = inner.slice(2, -1).trim()
        const parsedFilter = parseFilterExpression(filterBody)
        if (parsedFilter.error) {
          return { error: parsedFilter.error }
        }
        tokens.push(parsedFilter.token!)
        continue
      }

      return {
        error: `Unsupported or invalid bracket expression: [${inner}]`,
      }
    }

    return { error: `Unexpected character "${ch}" at position ${i}` }
  }

  return { tokens }
}

/**
 * Parses filter condition: @.prop == "val", @.prop > 10, @.active
 */
function parseFilterExpression(expr: string): {
  token?: Token
  error?: string
} {
  const match = expr.match(
    /^@\.([a-zA-Z0-9_$]+)(?:\s*(==|!=|>=|<=|>|<)\s*(.+))?$/
  )

  if (!match) {
    return {
      error: `Invalid filter syntax "${expr}". Example: [?(@.id == 2)] or [?(@.active)]`,
    }
  }

  const field = match[1]
  const operator = match[2] as '==' | '!=' | '>' | '>=' | '<' | '<=' | undefined
  const rawTarget = match[3]?.trim()

  if (!operator) {
    return {
      token: {
        type: 'filter',
        field,
      },
    }
  }

  let targetValue: unknown = rawTarget

  if (rawTarget === 'true') targetValue = true
  else if (rawTarget === 'false') targetValue = false
  else if (rawTarget === 'null') targetValue = null
  else if (/^-?\d+(?:\.\d+)?$/.test(rawTarget)) targetValue = Number(rawTarget)
  else if (
    (rawTarget.startsWith('"') && rawTarget.endsWith('"')) ||
    (rawTarget.startsWith("'") && rawTarget.endsWith("'"))
  ) {
    targetValue = rawTarget.slice(1, -1)
  }

  return {
    token: {
      type: 'filter',
      field,
      operator,
      targetValue,
    },
  }
}

/**
 * Evaluate a parsed JSONPath against input JSON data.
 */
export function evaluateJsonPath(data: unknown, query: string): JsonPathResult {
  const parsed = parseJsonPath(query)
  if (parsed.error || !parsed.tokens) {
    return {
      success: false,
      results: [],
      error: parsed.error || 'Invalid JSONPath query',
    }
  }

  let current: JsonPathMatch[] = [{ value: data, path: '$' }]

  for (let t = 1; t < parsed.tokens.length; t++) {
    const token = parsed.tokens[t]
    const next: JsonPathMatch[] = []

    for (const item of current) {
      if (item.value === null || item.value === undefined) {
        continue
      }

      if (token.type === 'property') {
        if (
          typeof item.value === 'object' &&
          !Array.isArray(item.value) &&
          token.name in (item.value as Record<string, unknown>)
        ) {
          const val = (item.value as Record<string, unknown>)[token.name]
          next.push({
            value: val,
            path: `${item.path}${formatPathSegment(token.name)}`,
          })
        }
      } else if (token.type === 'index') {
        if (Array.isArray(item.value)) {
          const idx =
            token.index < 0 ? item.value.length + token.index : token.index
          if (idx >= 0 && idx < item.value.length) {
            next.push({
              value: item.value[idx],
              path: `${item.path}[${idx}]`,
            })
          }
        }
      } else if (token.type === 'wildcard') {
        if (Array.isArray(item.value)) {
          for (let i = 0; i < item.value.length; i++) {
            next.push({
              value: item.value[i],
              path: `${item.path}[${i}]`,
            })
          }
        } else if (typeof item.value === 'object') {
          for (const key of Object.keys(
            item.value as Record<string, unknown>
          )) {
            next.push({
              value: (item.value as Record<string, unknown>)[key],
              path: `${item.path}${formatPathSegment(key)}`,
            })
          }
        }
      } else if (token.type === 'filter') {
        if (Array.isArray(item.value)) {
          for (let i = 0; i < item.value.length; i++) {
            const el = item.value[i]
            if (
              el &&
              typeof el === 'object' &&
              token.field in (el as Record<string, unknown>)
            ) {
              const actual = (el as Record<string, unknown>)[token.field]
              let match = false

              if (!token.operator) {
                match = Boolean(actual)
              } else if (token.operator === '==') {
                match = actual === token.targetValue
              } else if (token.operator === '!=') {
                match = actual !== token.targetValue
              } else if (token.operator === '>') {
                match = (actual as number) > (token.targetValue as number)
              } else if (token.operator === '>=') {
                match = (actual as number) >= (token.targetValue as number)
              } else if (token.operator === '<') {
                match = (actual as number) < (token.targetValue as number)
              } else if (token.operator === '<=') {
                match = (actual as number) <= (token.targetValue as number)
              }

              if (match) {
                next.push({
                  value: el,
                  path: `${item.path}[${i}]`,
                })
              }
            }
          }
        }
      }
    }

    current = next
  }

  return {
    success: true,
    results: current,
  }
}
