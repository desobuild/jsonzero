import { describe, it, expect } from 'vitest'
import {
  escapeJson,
  unescapeJson,
  isLikelyEscapedJson,
} from '@/lib/json/escape'

describe('Escape and Unescape', () => {
  describe('Escape JSON', () => {
    it('escapes valid formatted JSON into compact JSON string literal', () => {
      const input = JSON.stringify(
        {
          name: 'Alice',
          message: 'Hello',
        },
        null,
        2
      )
      const res = escapeJson(input)
      expect(res.success).toBe(true)
      expect(res.result).toBe(
        '"{\\"name\\":\\"Alice\\",\\"message\\":\\"Hello\\"}"'
      )
    })

    it('escapes quotes, backslashes, newlines, and tabs properly', () => {
      const input = JSON.stringify({
        text: 'Line 1\nLine 2\t"quoted" \\backslash\\',
      })
      const res = escapeJson(input)
      expect(res.success).toBe(true)
      // Verify parsing res.result gives valid JSON string
      const parsedOnce = JSON.parse(res.result!)
      expect(JSON.parse(parsedOnce)).toEqual({
        text: 'Line 1\nLine 2\t"quoted" \\backslash\\',
      })
    })

    it('escapes raw text that is not valid JSON', () => {
      const input = 'Hello "world"\nHow are you?'
      const res = escapeJson(input)
      expect(res.success).toBe(true)
      expect(JSON.parse(res.result!)).toBe(input)
    })

    it('handles empty input', () => {
      expect(escapeJson('').result).toBe('""')
      expect(escapeJson('   ').result).toBe('""')
    })
  })

  describe('Unescape JSON', () => {
    it('unescapes quoted escaped JSON back to formatted JSON', () => {
      const input = '"{\\"name\\":\\"Alice\\"}"'
      const res = unescapeJson(input)
      expect(res.success).toBe(true)
      expect(res.data).toEqual({ name: 'Alice' })
      expect(JSON.parse(res.result!)).toEqual({ name: 'Alice' })
    })

    it('unescapes unquoted escaped JSON', () => {
      const input = '{\\"name\\":\\"Alice\\"}'
      const res = unescapeJson(input)
      expect(res.success).toBe(true)
      expect(res.data).toEqual({ name: 'Alice' })
    })

    it('handles escaped unicode characters', () => {
      const input = '{\\"greeting\\":\\"Hello \\u00A9\\"}'
      const res = unescapeJson(input)
      expect(res.success).toBe(true)
      expect(res.data).toEqual({ greeting: 'Hello ©' })
    })

    it('fails gracefully on invalid JSON after unescaping', () => {
      const input = '{\\"broken\\": JSON}'
      const res = unescapeJson(input)
      expect(res.success).toBe(false)
      expect(res.error).toContain('Unable to unescape')
    })

    it('fails gracefully on empty input', () => {
      const res = unescapeJson('')
      expect(res.success).toBe(false)
      expect(res.error).toContain('Cannot unescape empty input')
    })
  })

  describe('isLikelyEscapedJson detector', () => {
    it('detects valid escaped JSON strings', () => {
      expect(isLikelyEscapedJson('{\\"user\\":{\\"name\\":\\"Alice\\"}}')).toBe(
        true
      )
      expect(
        isLikelyEscapedJson('"{\\"user\\":{\\"name\\":\\"Alice\\"}}"')
      ).toBe(true)
    })

    it('returns false for normal unescaped JSON', () => {
      expect(isLikelyEscapedJson('{"user":{"name":"Alice"}}')).toBe(false)
    })

    it('returns false for arbitrary strings without escaped quotes', () => {
      expect(isLikelyEscapedJson('hello world')).toBe(false)
      expect(isLikelyEscapedJson('')).toBe(false)
    })
  })

  describe('Round Trips', () => {
    it('round trips valid JSON: JSON -> escape -> unescape -> JSON', () => {
      const original = {
        app: 'JSONZero',
        privacy: true,
        version: 1.0,
        nested: { count: 42 },
      }
      const rawJson = JSON.stringify(original, null, 2)
      const escaped = escapeJson(rawJson)
      expect(escaped.success).toBe(true)

      const unescaped = unescapeJson(escaped.result!)
      expect(unescaped.success).toBe(true)
      expect(unescaped.data).toEqual(original)
    })
  })
})
