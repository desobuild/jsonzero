import { describe, it, expect } from 'vitest'
import { validateJsonSchema } from '@/lib/json/schema-validator'

describe('JSON Schema Validator Engine', () => {
  describe('Type validation', () => {
    it('validates primitive types correctly', () => {
      expect(validateJsonSchema('hello', { type: 'string' }).valid).toBe(true)
      expect(validateJsonSchema(123, { type: 'string' }).valid).toBe(false)
      expect(validateJsonSchema(123, { type: 'number' }).valid).toBe(true)
      expect(validateJsonSchema(123.45, { type: 'number' }).valid).toBe(true)
      expect(validateJsonSchema(123, { type: 'integer' }).valid).toBe(true)
      expect(validateJsonSchema(123.45, { type: 'integer' }).valid).toBe(false)
      expect(validateJsonSchema(true, { type: 'boolean' }).valid).toBe(true)
      expect(validateJsonSchema(null, { type: 'null' }).valid).toBe(true)
      expect(validateJsonSchema('null', { type: 'null' }).valid).toBe(false)
      expect(validateJsonSchema([], { type: 'array' }).valid).toBe(true)
      expect(validateJsonSchema({}, { type: 'object' }).valid).toBe(true)
    })

    it('supports array of types (union types)', () => {
      const schema = { type: ['string', 'number', 'null'] }
      expect(validateJsonSchema('text', schema).valid).toBe(true)
      expect(validateJsonSchema(42, schema).valid).toBe(true)
      expect(validateJsonSchema(null, schema).valid).toBe(true)
      expect(validateJsonSchema(true, schema).valid).toBe(false)
    })
  })

  describe('Object constraints', () => {
    it('validates properties and required fields', () => {
      const schema = {
        type: 'object',
        required: ['id', 'name'],
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          role: { type: 'string' },
        },
      }

      const validObj = { id: 1, name: 'Alice' }
      const resValid = validateJsonSchema(validObj, schema)
      expect(resValid.valid).toBe(true)
      expect(resValid.errors).toHaveLength(0)

      const missingReq = { id: 1 }
      const resMissing = validateJsonSchema(missingReq, schema)
      expect(resMissing.valid).toBe(false)
      expect(resMissing.errors[0].keyword).toBe('required')
      expect(resMissing.errors[0].path).toBe('$.name')
    })

    it('validates additionalProperties', () => {
      const strictSchema = {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        additionalProperties: false,
      }

      expect(validateJsonSchema({ id: 1 }, strictSchema).valid).toBe(true)

      const invalid = validateJsonSchema({ id: 1, extra: 'foo' }, strictSchema)
      expect(invalid.valid).toBe(false)
      expect(invalid.errors[0].keyword).toBe('additionalProperties')
      expect(invalid.errors[0].path).toBe('$.extra')

      const schemaWithAddPropType = {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        additionalProperties: { type: 'boolean' },
      }

      expect(
        validateJsonSchema(
          { id: 1, flag1: true, flag2: false },
          schemaWithAddPropType
        ).valid
      ).toBe(true)
      expect(
        validateJsonSchema({ id: 1, flag1: 'invalid' }, schemaWithAddPropType)
          .valid
      ).toBe(false)
    })

    it('validates minProperties and maxProperties', () => {
      const schema = {
        type: 'object',
        minProperties: 2,
        maxProperties: 3,
      }

      expect(validateJsonSchema({ a: 1 }, schema).valid).toBe(false)
      expect(validateJsonSchema({ a: 1, b: 2 }, schema).valid).toBe(true)
      expect(validateJsonSchema({ a: 1, b: 2, c: 3 }, schema).valid).toBe(true)
      expect(validateJsonSchema({ a: 1, b: 2, c: 3, d: 4 }, schema).valid).toBe(
        false
      )
    })
  })

  describe('Array constraints', () => {
    it('validates items schema', () => {
      const schema = {
        type: 'array',
        items: { type: 'number' },
      }

      expect(validateJsonSchema([1, 2, 3], schema).valid).toBe(true)

      const invalid = validateJsonSchema([1, 'two', 3], schema)
      expect(invalid.valid).toBe(false)
      expect(invalid.errors[0].path).toBe('$[1]')
      expect(invalid.errors[0].keyword).toBe('type')
    })

    it('validates minItems and maxItems', () => {
      const schema = {
        type: 'array',
        minItems: 2,
        maxItems: 4,
      }

      expect(validateJsonSchema([1], schema).valid).toBe(false)
      expect(validateJsonSchema([1, 2], schema).valid).toBe(true)
      expect(validateJsonSchema([1, 2, 3, 4], schema).valid).toBe(true)
      expect(validateJsonSchema([1, 2, 3, 4, 5], schema).valid).toBe(false)
    })

    it('validates uniqueItems for primitives and objects', () => {
      const schema = {
        type: 'array',
        uniqueItems: true,
      }

      expect(validateJsonSchema([1, 2, 3], schema).valid).toBe(true)
      expect(validateJsonSchema([1, 2, 1], schema).valid).toBe(false)

      const complexUnique = [{ a: 1 }, { a: 2 }]
      expect(validateJsonSchema(complexUnique, schema).valid).toBe(true)

      const complexDuplicate = [{ a: 1 }, { a: 1 }]
      expect(validateJsonSchema(complexDuplicate, schema).valid).toBe(false)
    })
  })

  describe('String constraints', () => {
    it('validates minLength, maxLength, and pattern', () => {
      const schema = {
        type: 'string',
        minLength: 3,
        maxLength: 8,
        pattern: '^[a-z]+$',
      }

      expect(validateJsonSchema('abc', schema).valid).toBe(true)
      expect(validateJsonSchema('ab', schema).valid).toBe(false)
      expect(validateJsonSchema('abcdefghi', schema).valid).toBe(false)
      expect(validateJsonSchema('abc12', schema).valid).toBe(false)
    })
  })

  describe('Number constraints', () => {
    it('validates minimum, maximum, exclusiveMinimum, exclusiveMaximum', () => {
      const schema = {
        type: 'number',
        minimum: 10,
        maximum: 20,
      }

      expect(validateJsonSchema(10, schema).valid).toBe(true)
      expect(validateJsonSchema(20, schema).valid).toBe(true)
      expect(validateJsonSchema(9, schema).valid).toBe(false)
      expect(validateJsonSchema(21, schema).valid).toBe(false)

      const exclusiveSchema = {
        type: 'number',
        exclusiveMinimum: 10,
        exclusiveMaximum: 20,
      }

      expect(validateJsonSchema(10, exclusiveSchema).valid).toBe(false)
      expect(validateJsonSchema(15, exclusiveSchema).valid).toBe(true)
      expect(validateJsonSchema(20, exclusiveSchema).valid).toBe(false)
    })
  })

  describe('Composition keywords: anyOf, oneOf, allOf', () => {
    it('validates anyOf', () => {
      const schema = {
        anyOf: [{ type: 'string' }, { type: 'number', minimum: 100 }],
      }

      expect(validateJsonSchema('hello', schema).valid).toBe(true)
      expect(validateJsonSchema(150, schema).valid).toBe(true)
      expect(validateJsonSchema(50, schema).valid).toBe(false)
      expect(validateJsonSchema(false, schema).valid).toBe(false)
    })

    it('validates oneOf', () => {
      const schema = {
        oneOf: [
          { type: 'number', multipleOf: 2, minimum: 5 },
          { type: 'number', minimum: 10 },
        ],
      }

      // 6 is >= 5 (matches 1st), not >= 10 (fails 2nd) => valid
      expect(validateJsonSchema(6, schema).valid).toBe(true)
      // 15 is >= 5 and >= 10 => matches both => invalid for oneOf
      expect(validateJsonSchema(15, schema).valid).toBe(false)
    })

    it('validates allOf', () => {
      const schema = {
        allOf: [
          { type: 'object', required: ['id'] },
          {
            type: 'object',
            properties: {
              id: { type: 'number' },
            },
          },
        ],
      }

      expect(validateJsonSchema({ id: 10 }, schema).valid).toBe(true)
      expect(validateJsonSchema({ id: 'ten' }, schema).valid).toBe(false)
      expect(validateJsonSchema({}, schema).valid).toBe(false)
    })
  })

  describe('Edge cases and error formats', () => {
    it('handles boolean schemas true and false', () => {
      expect(validateJsonSchema({ any: 'data' }, true).valid).toBe(true)
      expect(validateJsonSchema({ any: 'data' }, false).valid).toBe(false)
    })

    it('handles invalid schema gracefully', () => {
      const res = validateJsonSchema({ a: 1 }, null)
      expect(res.valid).toBe(false)
      expect(res.errors[0].keyword).toBe('schema')
    })

    it('orders errors deterministically by path then keyword', () => {
      const schema = {
        type: 'object',
        required: ['z', 'a'],
        properties: {
          z: { type: 'string' },
          a: { type: 'number' },
        },
      }

      const res = validateJsonSchema({ z: 123, a: 'not number' }, schema)
      expect(res.valid).toBe(false)
      expect(res.errors.length).toBe(2)
      // a comes before z lexicographically
      expect(res.errors[0].path).toBe('$.a')
      expect(res.errors[1].path).toBe('$.z')
    })
  })
})
