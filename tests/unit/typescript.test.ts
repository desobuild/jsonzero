import { describe, it, expect } from 'vitest'
import {
  jsonToTypeScript,
  isValidIdentifier,
  formatPropertyKey,
} from '@/lib/json/typescript'

describe('JSON → TypeScript Conversion Suite', () => {
  it('generates interface for flat object with primitives', () => {
    const input = {
      id: 1,
      name: 'Alice',
      active: true,
    }
    const ts = jsonToTypeScript(input)
    expect(ts).toContain('export interface Root {')
    expect(ts).toContain('id: number;')
    expect(ts).toContain('name: string;')
    expect(ts).toContain('active: boolean;')
  })

  it('generates separate nested interfaces with deterministic names', () => {
    const input = {
      user: {
        id: 1,
        name: 'Alice',
      },
    }
    const ts = jsonToTypeScript(input)
    expect(ts).toContain('user: User;')
    expect(ts).toContain('export interface User {')
    expect(ts).toContain('id: number;')
    expect(ts).toContain('name: string;')
  })

  it('quotes special or invalid property names', () => {
    const input = {
      'first-name': 'Alice',
      'user.email': 'alice@example.com',
      default: true,
      '123num': 42,
    }
    const ts = jsonToTypeScript(input)
    expect(ts).toContain('"first-name": string;')
    expect(ts).toContain('"user.email": string;')
    expect(ts).toContain('"default": boolean;')
    expect(ts).toContain('"123num": number;')
  })

  it('handles primitive arrays and object arrays', () => {
    const input = {
      tags: ['qa', 'automation'],
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    }
    const ts = jsonToTypeScript(input)
    expect(ts).toContain('tags: string[];')
    expect(ts).toContain('users: User[];')
    expect(ts).toContain('export interface User {')
  })

  it('handles mixed-type arrays cleanly with union types', () => {
    const input = [1, 'hello', true]
    const ts = jsonToTypeScript(input)
    expect(ts).toContain('export type Root = (boolean | number | string)[];')
  })

  it('handles heterogeneous object arrays with optional fields', () => {
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, email: 'bob@example.com' },
    ]
    const ts = jsonToTypeScript(input)
    expect(ts).toContain('id: number;')
    expect(ts).toContain('name?: string;')
    expect(ts).toContain('email?: string;')
  })

  it('handles null values safely without blindly converting to any', () => {
    const input = { value: null }
    const ts = jsonToTypeScript(input)
    expect(ts).toContain('value: null;')
  })

  it('handles primitive root values (number, string, boolean, null)', () => {
    expect(jsonToTypeScript(42)).toBe('export type Root = number;\n')
    expect(jsonToTypeScript('text')).toBe('export type Root = string;\n')
    expect(jsonToTypeScript(true)).toBe('export type Root = boolean;\n')
    expect(jsonToTypeScript(null)).toBe('export type Root = null;\n')
  })

  it('respects custom rootName option', () => {
    const input = { id: 1 }
    const ts = jsonToTypeScript(input, { rootName: 'CustomUser' })
    expect(ts).toContain('export interface CustomUser {')
  })

  it('isValidIdentifier helper validates correctly', () => {
    expect(isValidIdentifier('validName')).toBe(true)
    expect(isValidIdentifier('_private')).toBe(true)
    expect(isValidIdentifier('$dollar')).toBe(true)
    expect(isValidIdentifier('kebab-case')).toBe(false)
    expect(isValidIdentifier('with.dot')).toBe(false)
    expect(isValidIdentifier('123start')).toBe(false)
    expect(isValidIdentifier('default')).toBe(false)
  })

  it('formatPropertyKey quotes only when necessary', () => {
    expect(formatPropertyKey('simple')).toBe('simple')
    expect(formatPropertyKey('first-name')).toBe('"first-name"')
  })
})
