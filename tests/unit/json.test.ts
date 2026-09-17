import { describe, it, expect } from 'vitest'
import {
  parseJSON,
  formatJSON,
  minifyJSON,
  validateJSON,
  computeJsonStats,
  countJsonKeys,
  getLineAndColumnFromPosition,
} from '@/lib/json'

describe('JSON Processing Boundary', () => {
  const validJSON = '{"name":"JSONZero","version":"0.1.0"}'
  const nestedJSON = JSON.stringify({
    customer: { id: 'CUS-1042', name: 'Alex' },
    orders: [{ id: 'ORD-1' }, { id: 'ORD-2' }],
  })
  const invalidJSON = '{\n  "name": "JSONZero",\n  invalid\n}'

  describe('parseJSON', () => {
    it('parses valid JSON successfully', () => {
      const result = parseJSON(validJSON)
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'JSONZero', version: '0.1.0' })
    })

    it('parses primitive JSON values', () => {
      expect(parseJSON('true').data).toBe(true)
      expect(parseJSON('123.45').data).toBe(123.45)
      expect(parseJSON('"hello"').data).toBe('hello')
      expect(parseJSON('null').data).toBe(null)
    })

    it('returns structured error with line & column for invalid JSON', () => {
      const result = parseJSON(invalidJSON)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.errorLine).toBe(3)
      expect(result.errorColumn).toBeDefined()
    })

    it('returns error for empty input', () => {
      const result = parseJSON('')
      expect(result.success).toBe(false)
      expect(result.error).toContain('empty')
    })
  })

  describe('formatJSON', () => {
    it('formats valid JSON with default 2-space indentation', () => {
      const result = formatJSON(validJSON)
      expect(result.success).toBe(true)
      expect(result.formatted).toBe(
        '{\n  "name": "JSONZero",\n  "version": "0.1.0"\n}'
      )
    })

    it('formats with 4-space indentation', () => {
      const result = formatJSON(validJSON, 4)
      expect(result.success).toBe(true)
      expect(result.formatted).toContain('    "name"')
    })

    it('formats with tab indentation', () => {
      const result = formatJSON(validJSON, 'tab')
      expect(result.success).toBe(true)
      expect(result.formatted).toContain('\t"name"')
    })

    it('preserves user input without mutating on error', () => {
      const result = formatJSON(invalidJSON)
      expect(result.success).toBe(false)
      expect(result.formatted).toBeUndefined()
    })
  })

  describe('minifyJSON', () => {
    it('minifies valid JSON with whitespace into compact JSON', () => {
      const result = minifyJSON('{\n  "a": 1,\n  "b": [2, 3]\n}')
      expect(result.success).toBe(true)
      expect(result.minified).toBe('{"a":1,"b":[2,3]}')
    })

    it('preserves strings containing spaces or JSON-like syntax', () => {
      const input = '{"msg": "  hello  world  { } "}'
      const result = minifyJSON(input)
      expect(result.success).toBe(true)
      expect(result.minified).toBe('{"msg":"  hello  world  { } "}')
    })

    it('returns error for invalid JSON without crashing', () => {
      const result = minifyJSON('{ bad json }')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('validateJSON', () => {
    it('returns valid for correct JSON', () => {
      const result = validateJSON(validJSON)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns actionable errors with line numbers for invalid JSON', () => {
      const result = validateJSON(invalidJSON)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].line).toBe(3)
    })
  })

  describe('computeJsonStats & countJsonKeys', () => {
    it('counts keys recursively across objects and arrays', () => {
      const count = countJsonKeys(JSON.parse(nestedJSON))
      // customer, id, name, orders, id, id -> 6 keys total
      expect(count).toBe(6)
    })

    it('computes accurate lines, characters, bytes, and keys', () => {
      const input = '{\n  "key": "value"\n}'
      const stats = computeJsonStats(input)
      expect(stats.lineCount).toBe(3)
      expect(stats.characterCount).toBe(input.length)
      expect(stats.byteCount).toBeGreaterThan(0)
      expect(stats.keyCount).toBe(1)
    })

    it('handles empty input gracefully', () => {
      const stats = computeJsonStats('')
      expect(stats.lineCount).toBe(0)
      expect(stats.characterCount).toBe(0)
      expect(stats.byteCount).toBe(0)
      expect(stats.keyCount).toBe(0)
    })
  })

  describe('getLineAndColumnFromPosition', () => {
    it('calculates correct 1-indexed line and column', () => {
      const text = 'line1\nline2\nline3'
      // character at start of line 2 (offset 6)
      const loc = getLineAndColumnFromPosition(text, 6)
      expect(loc.line).toBe(2)
      expect(loc.column).toBe(1)

      // character on line 2, column 3 (offset 8)
      const loc2 = getLineAndColumnFromPosition(text, 8)
      expect(loc2.line).toBe(2)
      expect(loc2.column).toBe(3)
    })
  })
})
