import { describe, it, expect } from 'vitest'
import { jsonToSchema, DRAFT_2020_12 } from '@/lib/json/schema'

describe('JSON → JSON Schema Conversion Suite', () => {
  it('generates schema with draft 2020-12, properties, and required list for objects', () => {
    const input = {
      id: 1,
      name: 'Alice',
    }
    const schemaJson = jsonToSchema(input)
    const schema = JSON.parse(schemaJson)

    expect(schema.$schema).toBe(DRAFT_2020_12)
    expect(schema.type).toBe('object')
    expect(schema.properties.id.type).toBe('integer')
    expect(schema.properties.name.type).toBe('string')
    expect(schema.required).toEqual(['id', 'name'])
  })

  it('infers distinct types: string, number, integer, boolean, null', () => {
    const input = {
      str: 'hello',
      intVal: 42,
      floatVal: 3.14,
      boolVal: true,
      nullVal: null,
    }
    const schema = JSON.parse(jsonToSchema(input))

    expect(schema.properties.str.type).toBe('string')
    expect(schema.properties.intVal.type).toBe('integer')
    expect(schema.properties.floatVal.type).toBe('number')
    expect(schema.properties.boolVal.type).toBe('boolean')
    expect(schema.properties.nullVal.type).toBe('null')
  })

  it('generates homogeneous array schema with items', () => {
    const input = ['a', 'b', 'c']
    const schema = JSON.parse(jsonToSchema(input))

    expect(schema.type).toBe('array')
    expect(schema.items.type).toBe('string')
  })

  it('generates mixed array schema using anyOf', () => {
    const input = [1, 'hello', true]
    const schema = JSON.parse(jsonToSchema(input))

    expect(schema.type).toBe('array')
    expect(schema.items.anyOf).toBeDefined()
    const types = schema.items.anyOf.map((x: { type: string }) => x.type)
    expect(types).toContain('integer')
    expect(types).toContain('string')
    expect(types).toContain('boolean')
  })

  it('generates schema for array of objects with merged properties and required subset', () => {
    const input = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ]
    const schema = JSON.parse(jsonToSchema(input))

    expect(schema.type).toBe('array')
    expect(schema.items.type).toBe('object')
    expect(schema.items.properties.id.type).toBe('integer')
    expect(schema.items.properties.name.type).toBe('string')
    expect(schema.items.properties.email.type).toBe('string')
    // id and name are in all objects, email is only in one
    expect(schema.items.required).toEqual(['id', 'name'])
  })

  it('handles primitive root values (number, string, boolean, null)', () => {
    const numSchema = JSON.parse(jsonToSchema(42))
    expect(numSchema.type).toBe('integer')

    const nullSchema = JSON.parse(jsonToSchema(null))
    expect(nullSchema.type).toBe('null')
  })

  it('handles empty structures gracefully', () => {
    const emptyArr = JSON.parse(jsonToSchema([]))
    expect(emptyArr.type).toBe('array')

    const emptyObj = JSON.parse(jsonToSchema({}))
    expect(emptyObj.type).toBe('object')
    expect(emptyObj.properties).toEqual({})
  })
})
