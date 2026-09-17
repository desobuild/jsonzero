import type { SearchMatch } from '@/lib/search/types'

export type TokenType =
  'key' | 'string' | 'number' | 'boolean' | 'null' | 'punctuation' | 'plain'

export interface Token {
  type: TokenType
  text: string
  start: number
  end: number
}

export interface HighlightSegment {
  text: string
  tokenType: TokenType
  isMatch?: boolean
  isCurrentMatch?: boolean
}

const NUMBER_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/

/**
 * Tokenizes arbitrary text into JSON tokens.
 * Resilient to invalid, unclosed, or incomplete JSON.
 */
export function tokenizeJson(text: string): Token[] {
  const tokens: Token[] = []
  const len = text.length
  let i = 0

  while (i < len) {
    const char = text[i]

    // 1. Whitespace
    if (/\s/.test(char)) {
      const start = i
      while (i < len && /\s/.test(text[i])) {
        i++
      }
      tokens.push({ type: 'plain', text: text.slice(start, i), start, end: i })
      continue
    }

    // 2. Structural punctuation
    if (
      char === '{' ||
      char === '}' ||
      char === '[' ||
      char === ']' ||
      char === ':' ||
      char === ','
    ) {
      tokens.push({
        type: 'punctuation',
        text: char,
        start: i,
        end: i + 1,
      })
      i++
      continue
    }

    // 3. String literals (including property keys)
    if (char === '"') {
      const start = i
      i++ // Skip opening quote
      let escaped = false
      while (i < len) {
        const c = text[i]
        if (escaped) {
          escaped = false
          i++
        } else if (c === '\\') {
          escaped = true
          i++
        } else if (c === '"') {
          i++ // Closing quote
          break
        } else if (c === '\n') {
          // Unclosed string on line
          break
        } else {
          i++
        }
      }

      // Peek ahead to see if a colon follows (indicating this string is an object key)
      let isKey = false
      let peek = i
      while (peek < len && /\s/.test(text[peek])) {
        peek++
      }
      if (peek < len && text[peek] === ':') {
        isKey = true
      }

      tokens.push({
        type: isKey ? 'key' : 'string',
        text: text.slice(start, i),
        start,
        end: i,
      })
      continue
    }

    // 4. Boolean: true / false
    if (text.startsWith('true', i)) {
      const nextChar = text[i + 4]
      if (!nextChar || !/[a-zA-Z0-9_]/.test(nextChar)) {
        tokens.push({ type: 'boolean', text: 'true', start: i, end: i + 4 })
        i += 4
        continue
      }
    }
    if (text.startsWith('false', i)) {
      const nextChar = text[i + 5]
      if (!nextChar || !/[a-zA-Z0-9_]/.test(nextChar)) {
        tokens.push({ type: 'boolean', text: 'false', start: i, end: i + 5 })
        i += 5
        continue
      }
    }

    // 5. Null: null
    if (text.startsWith('null', i)) {
      const nextChar = text[i + 4]
      if (!nextChar || !/[a-zA-Z0-9_]/.test(nextChar)) {
        tokens.push({ type: 'null', text: 'null', start: i, end: i + 4 })
        i += 4
        continue
      }
    }

    // 6. Number
    const remaining = text.slice(i)
    const numMatch = remaining.match(NUMBER_REGEX)
    if (numMatch && numMatch[0].length > 0) {
      const matchStr = numMatch[0]
      const nextChar = text[i + matchStr.length]
      // Ensure it's not part of an identifier like 123abc
      if (!nextChar || !/[a-zA-Z_]/.test(nextChar)) {
        tokens.push({
          type: 'number',
          text: matchStr,
          start: i,
          end: i + matchStr.length,
        })
        i += matchStr.length
        continue
      }
    }

    // 7. Fallback plain text (for malformed characters, unquoted identifiers, etc.)
    const start = i
    while (i < len && !/\s/.test(text[i]) && !/[{}[\]:,"]/.test(text[i])) {
      i++
    }
    tokens.push({
      type: 'plain',
      text: text.slice(start, i),
      start,
      end: i,
    })
  }

  return tokens
}

/**
 * Slices tokens around search match boundaries so that tokens and search highlights
 * can be rendered cleanly without overlapping DOM structures.
 */
export function buildHighlightSegments(
  text: string,
  tokens: Token[],
  matches: SearchMatch[] = [],
  currentMatchIndex = -1
): HighlightSegment[] {
  if (tokens.length === 0) return []
  if (matches.length === 0) {
    return tokens.map((t) => ({
      text: t.text,
      tokenType: t.type,
    }))
  }

  // Create boundary points at every token start/end and match start/end
  const boundaries = new Set<number>()
  boundaries.add(0)
  boundaries.add(text.length)

  for (const t of tokens) {
    boundaries.add(t.start)
    boundaries.add(t.end)
  }
  for (const m of matches) {
    boundaries.add(m.start)
    boundaries.add(m.end)
  }

  const sortedPoints = Array.from(boundaries).sort((a, b) => a - b)
  const segments: HighlightSegment[] = []

  let tokenIdx = 0
  let matchIdx = 0

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i]
    const end = sortedPoints[i + 1]
    if (start === end) continue

    const segText = text.slice(start, end)

    // Find corresponding token
    while (tokenIdx < tokens.length && tokens[tokenIdx].end <= start) {
      tokenIdx++
    }
    const token = tokens[tokenIdx]
    const tokenType: TokenType = token ? token.type : 'plain'

    // Check if segment falls within a search match
    while (matchIdx < matches.length && matches[matchIdx].end <= start) {
      matchIdx++
    }
    const match = matches[matchIdx]
    const isMatch = Boolean(match && start >= match.start && end <= match.end)
    const isCurrentMatch = isMatch && matchIdx === currentMatchIndex

    segments.push({
      text: segText,
      tokenType,
      isMatch,
      isCurrentMatch,
    })
  }

  return segments
}
