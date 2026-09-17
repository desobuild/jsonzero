import { describe, it, expect } from 'vitest'
import { parseJSON, formatJSON, minifyJSON, validateJSON } from '@/lib/json'

describe('JSON Processing', () => {
  const validJSON = '{"name":"JSONZero","version":"0.1.0"}'
  const invalidJSON = '{name: invalid}'

  describe('parseJSON', () => {
    it('parses valid JSON successfully', () => {
      const result = parseJSON(validJSON)
      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'JSONZero', version: '0.1.0' })
    })

    it('returns error for invalid JSON', () => {
      const result = parseJSON(invalidJSON)
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('formatJSON', () => {
    it('formats valid JSON with indentation', () => {
      const result = formatJSON(validJSON)
      expect(result.success).toBe(true)
      expect(result.formatted).toContain('\n')
      expect(result.formatted).toContain('  ')
    })

    it('returns error for invalid JSON', () => {
      const result = formatJSON(invalidJSON)
      expect(result.success).toBe(false)
    })
  })

  describe('minifyJSON', () => {
    it('minifies valid JSON', () => {
      const result = minifyJSON('{ "a": 1,  "b":  2 }')
      expect(result.success).toBe(true)
      expect(result.minified).toBe('{"a":1,"b":2}')
    })
  })

  describe('validateJSON', () => {
    it('returns valid for correct JSON', () => {
      const result = validateJSON(validJSON)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns errors for invalid JSON', () => {
      const result = validateJSON(invalidJSON)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
