import type {
  SearchOptions,
  SearchMatch,
  ReplaceResult,
} from '@/lib/search/types'

const WORD_CHAR_REGEX = /[a-zA-Z0-9_]/

function isWordChar(char: string | undefined): boolean {
  if (!char) return false
  return WORD_CHAR_REGEX.test(char)
}

/**
 * Computes line and column (1-based) for a given character index.
 */
function computePosition(
  text: string,
  index: number
): { line: number; column: number } {
  let line = 1
  let column = 1

  for (let i = 0; i < index; i++) {
    if (text[i] === '\n') {
      line++
      column = 1
    } else {
      column++
    }
  }

  return { line, column }
}

/**
 * Finds all search matches in the given document text.
 * Operates on raw text and does not require valid JSON syntax.
 */
export function findMatches(
  text: string,
  query: string,
  options: SearchOptions
): SearchMatch[] {
  if (!query || query.length === 0 || text.length === 0) {
    return []
  }

  const { matchCase, wholeWord } = options
  const haystack = matchCase ? text : text.toLowerCase()
  const needle = matchCase ? query : query.toLowerCase()
  const queryLen = needle.length

  const matches: SearchMatch[] = []
  let startIndex = 0

  const firstCharIsWord = isWordChar(query[0])
  const lastCharIsWord = isWordChar(query[query.length - 1])

  while (startIndex <= haystack.length - queryLen) {
    const foundIndex = haystack.indexOf(needle, startIndex)
    if (foundIndex === -1) {
      break
    }

    const matchEnd = foundIndex + queryLen

    // Whole word verification
    let isMatch = true
    if (wholeWord) {
      if (firstCharIsWord && isWordChar(text[foundIndex - 1])) {
        isMatch = false
      }
      if (lastCharIsWord && isWordChar(text[matchEnd])) {
        isMatch = false
      }
    }

    if (isMatch) {
      const { line, column } = computePosition(text, foundIndex)
      matches.push({
        start: foundIndex,
        end: matchEnd,
        line,
        column,
        text: text.slice(foundIndex, matchEnd),
      })
    }

    startIndex = foundIndex + 1
  }

  return matches
}

/**
 * Returns next match index with wrap-around.
 */
export function getNextMatchIndex(current: number, total: number): number {
  if (total <= 0) return -1
  if (current < 0) return 0
  return (current + 1) % total
}

/**
 * Returns previous match index with wrap-around.
 */
export function getPrevMatchIndex(current: number, total: number): number {
  if (total <= 0) return -1
  if (current < 0) return total - 1
  return (current - 1 + total) % total
}

/**
 * Replaces the currently selected match.
 */
export function replaceCurrent(
  text: string,
  match: SearchMatch,
  replacement: string
): { newText: string; newStart: number } {
  if (match.start < 0 || match.end > text.length || match.start > match.end) {
    return { newText: text, newStart: match.start }
  }

  const newText =
    text.slice(0, match.start) + replacement + text.slice(match.end)
  return { newText, newStart: match.start }
}

/**
 * Replaces all occurrences of matches.
 */
export function replaceAll(
  text: string,
  matches: SearchMatch[],
  replacement: string
): ReplaceResult {
  if (matches.length === 0) {
    return { newText: text, count: 0 }
  }

  // Rebuild string using match boundaries to avoid offset shift issues
  let result = ''
  let lastIndex = 0

  for (const match of matches) {
    result += text.slice(lastIndex, match.start) + replacement
    lastIndex = match.end
  }
  result += text.slice(lastIndex)

  return {
    newText: result,
    count: matches.length,
  }
}
