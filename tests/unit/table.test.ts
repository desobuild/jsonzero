import { describe, it, expect } from 'vitest'
import { jsonToTable, tableToTsv, formatTableCell } from '@/lib/json/table'

describe('JSON → Table Conversion Suite', () => {
  it('converts an array of objects to table columns and rows', () => {
    const input = [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
    ]
    const table = jsonToTable(input)

    expect(table.shape).toBe('array-of-objects')
    expect(table.totalRows).toBe(2)
    expect(table.columns.map((c) => c.id)).toEqual(['id', 'name', 'active'])
    expect(table.rows[0].cells).toEqual({
      id: '1',
      name: 'Alice',
      active: 'true',
    })
    expect(table.rows[1].cells).toEqual({
      id: '2',
      name: 'Bob',
      active: 'false',
    })
  })

  it('produces union of columns when rows have different keys without discarding fields', () => {
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, email: 'bob@example.com' },
    ]
    const table = jsonToTable(input)

    expect(table.columns.map((c) => c.id)).toEqual(['id', 'name', 'email'])
    expect(table.rows[0].cells).toEqual({
      id: '1',
      name: 'Alice',
      email: '—',
    })
    expect(table.rows[1].cells).toEqual({
      id: '2',
      name: '—',
      email: 'bob@example.com',
    })
  })

  it('serializes nested objects and arrays as compact readable JSON inside cells', () => {
    const input = [
      {
        id: 1,
        profile: { city: 'Belagavi', country: 'India' },
        tags: ['qa', 'automation'],
      },
    ]
    const table = jsonToTable(input)

    expect(table.rows[0].cells.profile).toBe(
      '{"city":"Belagavi","country":"India"}'
    )
    expect(table.rows[0].cells.tags).toBe('["qa","automation"]')
    expect(table.rows[0].rawValues.profile).toEqual({
      city: 'Belagavi',
      country: 'India',
    })
  })

  it('converts a non-array object root to key-value table', () => {
    const input = { id: 1, name: 'Alice' }
    const table = jsonToTable(input)

    expect(table.shape).toBe('key-value')
    expect(table.columns.map((c) => c.id)).toEqual(['key', 'value'])
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0].cells).toEqual({ key: 'id', value: '1' })
    expect(table.rows[1].cells).toEqual({ key: 'name', value: 'Alice' })
  })

  it('converts primitive root values gracefully without crashing', () => {
    const numTable = jsonToTable(42)
    expect(numTable.shape).toBe('primitive')
    expect(numTable.rows[0].cells.value).toBe('42')

    const strTable = jsonToTable('hello')
    expect(strTable.rows[0].cells.value).toBe('hello')

    const nullTable = jsonToTable(null)
    expect(nullTable.rows[0].cells.value).toBe('null')
  })

  it('handles empty array and empty object gracefully', () => {
    const emptyArr = jsonToTable([])
    expect(emptyArr.shape).toBe('empty')
    expect(emptyArr.rows).toHaveLength(0)

    const emptyObj = jsonToTable({})
    expect(emptyObj.shape).toBe('empty')
    expect(emptyObj.rows).toHaveLength(0)
  })

  it('exports table data to TSV for clipboard copy', () => {
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]
    const table = jsonToTable(input)
    const tsv = tableToTsv(table)

    expect(tsv).toBe('id\tname\n1\tAlice\n2\tBob')
  })

  it('formats cell helper properly handles primitives, booleans, undefined, and null', () => {
    expect(formatTableCell(undefined)).toBe('—')
    expect(formatTableCell(null)).toBe('null')
    expect(formatTableCell(true)).toBe('true')
    expect(formatTableCell(false)).toBe('false')
    expect(formatTableCell(100)).toBe('100')
    expect(formatTableCell('text')).toBe('text')
  })
})
