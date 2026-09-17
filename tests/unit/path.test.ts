import { describe, it, expect } from 'vitest'
import {
  formatPathSegment,
  formatJsonPath,
  appendJsonPath,
} from '@/lib/json/path'

describe('JSON Path formatting', () => {
  it('formats root path when empty segments', () => {
    expect(formatJsonPath([])).toBe('$')
  })

  it('formats valid identifier properties with dot notation', () => {
    expect(formatPathSegment('customer')).toBe('.customer')
    expect(formatPathSegment('_id')).toBe('._id')
    expect(formatPathSegment('$type')).toBe('.$type')
    expect(formatJsonPath(['customer', 'profile', 'name'])).toBe(
      '$.customer.profile.name'
    )
  })

  it('formats array index with bracket notation', () => {
    expect(formatPathSegment(0)).toBe('[0]')
    expect(formatPathSegment(42)).toBe('[42]')
    expect(formatJsonPath(['orders', 0, 'items', 2])).toBe(
      '$.orders[0].items[2]'
    )
  })

  it('formats special character keys with safe bracket notation', () => {
    expect(formatPathSegment('first-name')).toBe('["first-name"]')
    expect(formatPathSegment('email address')).toBe('["email address"]')
    expect(formatPathSegment('user.profile')).toBe('["user.profile"]')
    expect(formatPathSegment('123number')).toBe('["123number"]')
    expect(formatPathSegment('')).toBe('[""]')
    expect(formatJsonPath(['user', 'first-name'])).toBe('$.user["first-name"]')
  })

  it('escapes quotes and backslashes in bracket keys', () => {
    expect(formatPathSegment('quoted"key')).toBe('["quoted\\"key"]')
    expect(formatPathSegment('slash\\key')).toBe('["slash\\\\key"]')
  })

  it('appends segments to existing paths', () => {
    expect(appendJsonPath('$', 'user')).toBe('$.user')
    expect(appendJsonPath('$.user', 'first-name')).toBe('$.user["first-name"]')
    expect(appendJsonPath('$.orders', 0)).toBe('$.orders[0]')
  })
})
