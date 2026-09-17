import { describe, it, expect } from 'vitest'
import { generateMockJson } from '@/lib/json/mock'

describe('Mock JSON Generator Engine', () => {
  it('generates mock data with default zero and placeholder strings', () => {
    const input = {
      id: 42,
      name: 'Anirudh',
      active: true,
      data: null,
    }

    const mock = generateMockJson(input) as Record<string, unknown>
    expect(mock).toEqual({
      active: true,
      data: null,
      id: 0,
      name: 'name_value',
    })
  })

  it('handles nested objects and arrays with preserve strategy', () => {
    const input = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    }

    const mock = generateMockJson(input, { arrayStrategy: 'preserve' }) as {
      users: Array<{ id: number; name: string }>
    }

    expect(mock.users).toHaveLength(2)
    expect(mock.users[0]).toEqual({ id: 0, name: 'name_value' })
    expect(mock.users[1]).toEqual({ id: 0, name: 'name_value' })
  })

  it('handles array single element strategy', () => {
    const input = {
      items: [100, 200, 300],
    }

    const mock = generateMockJson(input, { arrayStrategy: 'single' }) as {
      items: number[]
    }
    expect(mock.items).toHaveLength(1)
    expect(mock.items[0]).toBe(0)
  })

  it('respects preserve options for primitives', () => {
    const input = {
      id: 123,
      title: 'Original Title',
      isEnabled: false,
    }

    const mock = generateMockJson(input, {
      stringValue: 'preserve',
      numberValue: 'preserve',
      booleanValue: 'preserve',
    })

    expect(mock).toEqual({
      id: 123,
      isEnabled: false,
      title: 'Original Title',
    })
  })

  it('handles empty objects and empty arrays', () => {
    expect(generateMockJson({})).toEqual({})
    expect(generateMockJson([])).toEqual([])
  })

  it('is deterministic regardless of original key order', () => {
    const objA = { z: 1, a: 'test' }
    const objB = { a: 'test', z: 1 }

    const mockA = JSON.stringify(generateMockJson(objA))
    const mockB = JSON.stringify(generateMockJson(objB))

    expect(mockA).toBe(mockB)
  })
})
