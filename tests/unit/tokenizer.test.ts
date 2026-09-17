import { describe, it, expect } from 'vitest'
import { tokenizeJson, buildHighlightSegments } from '@/lib/json/tokenizer'

describe('JSON Tokenizer (src/lib/json/tokenizer)', () => {
  it('tokenizes JSON property keys and values correctly', () => {
    const json = '{"name": "Alice", "age": 30, "admin": true, "meta": null}'
    const tokens = tokenizeJson(json)

    const keys = tokens.filter((t) => t.type === 'key').map((t) => t.text)
    expect(keys).toEqual(['"name"', '"age"', '"admin"', '"meta"'])

    const strings = tokens.filter((t) => t.type === 'string').map((t) => t.text)
    expect(strings).toEqual(['"Alice"'])

    const numbers = tokens.filter((t) => t.type === 'number').map((t) => t.text)
    expect(numbers).toEqual(['30'])

    const booleans = tokens
      .filter((t) => t.type === 'boolean')
      .map((t) => t.text)
    expect(booleans).toEqual(['true'])

    const nulls = tokens.filter((t) => t.type === 'null').map((t) => t.text)
    expect(nulls).toEqual(['null'])
  })

  it('tokenizes punctuation characters', () => {
    const json = '{"arr": [1, 2]}'
    const tokens = tokenizeJson(json)
    const punctuation = tokens
      .filter((t) => t.type === 'punctuation')
      .map((t) => t.text)
    expect(punctuation).toEqual(['{', ':', '[', ',', ']', '}'])
  })

  it('handles broken/invalid JSON gracefully without throwing', () => {
    const broken = '{\n  unquoted: "test\n'
    expect(() => tokenizeJson(broken)).not.toThrow()
    const tokens = tokenizeJson(broken)
    expect(tokens.length).toBeGreaterThan(0)
  })

  it('slices highlight segments across search matches', () => {
    const text = '{"user": "Alex"}'
    const tokens = tokenizeJson(text)
    // Match "Alex" (starts at index 10, ends at index 14)
    const matches = [
      {
        start: 10,
        end: 14,
        line: 1,
        column: 11,
        text: 'Alex',
      },
    ]

    const segments = buildHighlightSegments(text, tokens, matches, 0)
    const matchSegment = segments.find((s) => s.isMatch)
    expect(matchSegment).toBeDefined()
    expect(matchSegment?.text).toBe('Alex')
    expect(matchSegment?.isCurrentMatch).toBe(true)
  })
})
