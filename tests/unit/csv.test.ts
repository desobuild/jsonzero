import { describe, it, expect } from 'vitest'
import { jsonToCsv, escapeCsvCell } from '@/lib/json/csv'

describe('JSON → CSV Conversion Suite', () => {
  it('converts array of objects to CSV with headers and rows', () => {
    const input = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ]
    const csv = jsonToCsv(input)
    expect(csv).toBe(
      'id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com'
    )
  })

  it('escapes cells containing commas, quotes, and newlines correctly', () => {
    const input = [
      {
        company: 'Alice, Inc.',
        quote: 'He said "hello"',
        notes: 'Line 1\nLine 2',
      },
    ]
    const csv = jsonToCsv(input)
    expect(csv).toBe(
      'company,quote,notes\n"Alice, Inc.","He said ""hello""","Line 1\nLine 2"'
    )
  })

  it('serializes nested objects and arrays as compact JSON with valid CSV escaping', () => {
    const input = [
      {
        id: 1,
        profile: { city: 'Belagavi' },
        tags: ['qa', 'playwright'],
      },
    ]
    const csv = jsonToCsv(input)
    expect(csv).toBe(
      'id,profile,tags\n1,"{""city"":""Belagavi""}","[""qa"",""playwright""]"'
    )
  })

  it('supports custom delimiters (tab and semicolon)', () => {
    const input = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ]
    const tsv = jsonToCsv(input, { delimiter: '\t' })
    expect(tsv).toBe('a\tb\n1\t2\n3\t4')

    const semi = jsonToCsv(input, { delimiter: ';' })
    expect(semi).toBe('a;b\n1;2\n3;4')
  })

  it('honors includeHeader toggle', () => {
    const input = [{ id: 1, name: 'Alice' }]
    const withoutHeader = jsonToCsv(input, { includeHeader: false })
    expect(withoutHeader).toBe('1,Alice')

    const withHeader = jsonToCsv(input, { includeHeader: true })
    expect(withHeader).toBe('id,name\n1,Alice')
  })

  it('handles heterogeneous object arrays with missing columns filled with empty string', () => {
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, email: 'bob@example.com' },
    ]
    const csv = jsonToCsv(input)
    expect(csv).toBe('id,name,email\n1,Alice,\n2,,bob@example.com')
  })

  it('handles primitive arrays and primitive roots', () => {
    const arr = [1, 2, 3]
    expect(jsonToCsv(arr)).toBe('value\n1\n2\n3')

    const num = 42
    expect(jsonToCsv(num)).toBe('value\n42')
  })

  it('handles empty input gracefully', () => {
    expect(jsonToCsv([])).toBe('')
    expect(jsonToCsv({})).toBe('')
  })

  it('escapeCsvCell helper works directly for all edge cases', () => {
    expect(escapeCsvCell('simple')).toBe('simple')
    expect(escapeCsvCell('with,comma')).toBe('"with,comma"')
    expect(escapeCsvCell('with"quote')).toBe('"with""quote"')
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
    expect(escapeCsvCell(true)).toBe('true')
  })
})
