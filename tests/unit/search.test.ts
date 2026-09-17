import { describe, it, expect } from 'vitest'
import {
  findMatches,
  getNextMatchIndex,
  getPrevMatchIndex,
  replaceCurrent,
  replaceAll,
} from '@/lib/search'

describe('Search Engine (src/lib/search)', () => {
  const sampleJson = `{
  "customer": {
    "id": "CUS-1042",
    "name": "Alex Morgan",
    "customerType": "vip",
    "active": true
  }
}`

  describe('Basic Search', () => {
    it('returns empty array when query is empty', () => {
      const matches = findMatches(sampleJson, '', {
        matchCase: false,
        wholeWord: false,
      })
      expect(matches).toEqual([])
    })

    it('finds single match', () => {
      const matches = findMatches(sampleJson, 'CUS-1042', {
        matchCase: false,
        wholeWord: false,
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].text).toBe('CUS-1042')
      expect(matches[0].line).toBe(3)
      expect(matches[0].column).toBe(12)
    })

    it('finds multiple matches across lines', () => {
      const matches = findMatches(sampleJson, 'customer', {
        matchCase: false,
        wholeWord: false,
      })
      // "customer": { and "customerType": "vip"
      expect(matches).toHaveLength(2)
      expect(matches[0].line).toBe(2)
      expect(matches[1].line).toBe(5)
    })

    it('returns empty array when there are no matches', () => {
      const matches = findMatches(sampleJson, 'nonexistent_key', {
        matchCase: false,
        wholeWord: false,
      })
      expect(matches).toHaveLength(0)
    })
  })

  describe('Case Sensitivity', () => {
    it('matches regardless of case when matchCase is false', () => {
      const matches = findMatches(sampleJson, 'CUSTOMER', {
        matchCase: false,
        wholeWord: false,
      })
      expect(matches).toHaveLength(2)
    })

    it('matches only exact casing when matchCase is true', () => {
      const insensitiveMatches = findMatches(sampleJson, 'customer', {
        matchCase: false,
        wholeWord: false,
      })
      expect(insensitiveMatches).toHaveLength(2)

      const sensitiveMatches = findMatches(sampleJson, 'CUSTOMER', {
        matchCase: true,
        wholeWord: false,
      })
      expect(sensitiveMatches).toHaveLength(0)

      const exactMatches = findMatches(sampleJson, 'customer', {
        matchCase: true,
        wholeWord: false,
      })
      // "customer": and "customer" inside "customerType"
      expect(exactMatches).toHaveLength(2)
    })
  })

  describe('Whole Word Matching', () => {
    it('matches exact word and ignores substrings when wholeWord is true', () => {
      // Searching "customer" with wholeWord=false matches both "customer" and "customerType"
      const partialMatches = findMatches(sampleJson, 'customer', {
        matchCase: false,
        wholeWord: false,
      })
      expect(partialMatches).toHaveLength(2)

      // With wholeWord=true, only "customer" matches because "customerType" has 'T' directly adjacent
      const wholeWordMatches = findMatches(sampleJson, 'customer', {
        matchCase: false,
        wholeWord: true,
      })
      expect(wholeWordMatches).toHaveLength(1)
      expect(wholeWordMatches[0].line).toBe(2)
    })

    it('recognizes punctuation boundaries as valid word boundaries', () => {
      const text = '{"user": "user", "username": "user1"}'
      const matches = findMatches(text, 'user', {
        matchCase: false,
        wholeWord: true,
      })
      // Should match the key "user" and value "user", but NOT "username" or "user1"
      expect(matches).toHaveLength(2)
      expect(matches[0].start).toBe(2) // "user" key
      expect(matches[1].start).toBe(10) // "user" value
    })
  })

  describe('Match Navigation', () => {
    it('navigates next and wraps around', () => {
      const total = 3
      expect(getNextMatchIndex(0, total)).toBe(1)
      expect(getNextMatchIndex(1, total)).toBe(2)
      expect(getNextMatchIndex(2, total)).toBe(0) // Wraps around
    })

    it('navigates previous and wraps around', () => {
      const total = 3
      expect(getPrevMatchIndex(2, total)).toBe(1)
      expect(getPrevMatchIndex(1, total)).toBe(0)
      expect(getPrevMatchIndex(0, total)).toBe(2) // Wraps around
    })

    it('handles empty results navigation gracefully', () => {
      expect(getNextMatchIndex(-1, 0)).toBe(-1)
      expect(getPrevMatchIndex(-1, 0)).toBe(-1)
    })
  })

  describe('Replace', () => {
    it('replaces current selected match without affecting others', () => {
      const text = 'alpha beta alpha gamma'
      const matches = findMatches(text, 'alpha', {
        matchCase: false,
        wholeWord: false,
      })
      expect(matches).toHaveLength(2)

      // Replace second "alpha"
      const result = replaceCurrent(text, matches[1], 'DELTA')
      expect(result.newText).toBe('alpha beta DELTA gamma')
    })

    it('replaces all matches correctly', () => {
      const text = 'foo bar foo baz foo'
      const matches = findMatches(text, 'foo', {
        matchCase: false,
        wholeWord: false,
      })
      expect(matches).toHaveLength(3)

      const result = replaceAll(text, matches, 'qux')
      expect(result.newText).toBe('qux bar qux baz qux')
      expect(result.count).toBe(3)
    })

    it('handles no matches during replace gracefully', () => {
      const text = 'hello world'
      const result = replaceAll(text, [], 'replacement')
      expect(result.newText).toBe('hello world')
      expect(result.count).toBe(0)
    })
  })

  describe('Invalid JSON Support', () => {
    it('searches and replaces successfully within invalid JSON text', () => {
      const brokenJson =
        '{\n  "broken_key": missing_quotes\n  "broken_key": 123'
      const matches = findMatches(brokenJson, 'broken_key', {
        matchCase: false,
        wholeWord: false,
      })
      expect(matches).toHaveLength(2)

      const replaced = replaceAll(brokenJson, matches, 'fixed_key')
      expect(replaced.newText).toBe(
        '{\n  "fixed_key": missing_quotes\n  "fixed_key": 123'
      )
      expect(replaced.count).toBe(2)
    })
  })
})
