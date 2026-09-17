/**
 * JSONZero — Pure JSON Schema Validator Engine
 *
 * Validates JSON data against a deterministic, high-utility subset of JSON Schema 2020-12.
 * Zero external dependencies. Operates client-side only.
 *
 * Supported features:
 * - Types: object, array, string, number, integer, boolean, null (single or array of types)
 * - Object: properties, required, additionalProperties, minProperties, maxProperties
 * - Array: items, minItems, maxItems, uniqueItems
 * - String: minLength, maxLength, pattern
 * - Number: minimum, maximum, exclusiveMinimum, exclusiveMaximum
 * - Composition: anyOf, oneOf, allOf
 * - Boolean schemas: true (always valid), false (always invalid)
 *
 * Note: $ref and remote schemas are intentionally not supported in this local standalone subset.
 */

import { appendJsonPath, formatJsonPath } from '@/lib/json/path'
import { getJsonType } from '@/lib/json/statistics'

export interface SchemaValidationError {
  path: string
  keyword: string
  expected: string
  actual: string
  message: string
}

export interface SchemaValidationResult {
  valid: boolean
  errors: SchemaValidationError[]
}

export type JsonSchema = Record<string, unknown> | boolean

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (typeof a !== 'object') return a === b

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (Array.isArray(b)) return false

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false
    if (!deepEqual(aObj[key], bObj[key])) return false
  }

  return true
}

function stringifyValue(val: unknown): string {
  if (val === undefined) return 'undefined'
  if (val === null) return 'null'
  if (typeof val === 'string') return `"${val}"`
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  try {
    const str = JSON.stringify(val)
    if (str && str.length > 40) return `${str.slice(0, 37)}...`
    return str || String(val)
  } catch {
    return String(val)
  }
}

export function validateJsonSchema(
  data: unknown,
  schema: unknown
): SchemaValidationResult {
  const errors: SchemaValidationError[] = []

  if (
    typeof schema !== 'boolean' &&
    (typeof schema !== 'object' || schema === null)
  ) {
    return {
      valid: false,
      errors: [
        {
          path: '$',
          keyword: 'schema',
          expected: 'object or boolean',
          actual: schema === null ? 'null' : typeof schema,
          message: 'Invalid schema: schema must be an object or boolean',
        },
      ],
    }
  }

  function validateNode(
    value: unknown,
    subschema: JsonSchema,
    currentPath: string
  ): void {
    // 1. Boolean schemas
    if (typeof subschema === 'boolean') {
      if (!subschema) {
        errors.push({
          path: currentPath,
          keyword: 'false',
          expected: 'valid data',
          actual: stringifyValue(value),
          message: 'Value is rejected by boolean schema "false"',
        })
      }
      return
    }

    const typeOfValue = getJsonType(value)

    // 2. type keyword
    if ('type' in subschema) {
      const allowedTypes = Array.isArray(subschema.type)
        ? subschema.type
        : [subschema.type]

      let matchesType = false
      for (const t of allowedTypes) {
        if (t === 'integer') {
          if (typeof value === 'number' && Number.isInteger(value)) {
            matchesType = true
            break
          }
        } else if (t === 'number') {
          if (typeof value === 'number') {
            matchesType = true
            break
          }
        } else if (t === typeOfValue) {
          matchesType = true
          break
        }
      }

      if (!matchesType) {
        errors.push({
          path: currentPath,
          keyword: 'type',
          expected: allowedTypes.join(' | '),
          actual: typeOfValue,
          message: `Expected type ${allowedTypes.join(' | ')}, received ${typeOfValue}`,
        })
        // If type does not match, skip further keyword validations for this node
        return
      }
    }

    // 3. String keywords
    if (typeof value === 'string') {
      if (
        typeof subschema.minLength === 'number' &&
        value.length < subschema.minLength
      ) {
        errors.push({
          path: currentPath,
          keyword: 'minLength',
          expected: `>= ${subschema.minLength} chars`,
          actual: `${value.length} chars`,
          message: `String length ${value.length} is shorter than minimum length ${subschema.minLength}`,
        })
      }

      if (
        typeof subschema.maxLength === 'number' &&
        value.length > subschema.maxLength
      ) {
        errors.push({
          path: currentPath,
          keyword: 'maxLength',
          expected: `<= ${subschema.maxLength} chars`,
          actual: `${value.length} chars`,
          message: `String length ${value.length} exceeds maximum length ${subschema.maxLength}`,
        })
      }

      if (typeof subschema.pattern === 'string') {
        try {
          const reg = new RegExp(subschema.pattern)
          if (!reg.test(value)) {
            errors.push({
              path: currentPath,
              keyword: 'pattern',
              expected: subschema.pattern,
              actual: value,
              message: `String does not match required pattern /${subschema.pattern}/`,
            })
          }
        } catch {
          errors.push({
            path: currentPath,
            keyword: 'pattern',
            expected: 'valid regex',
            actual: subschema.pattern,
            message: `Invalid regex pattern in schema: ${subschema.pattern}`,
          })
        }
      }
    }

    // 4. Number / Integer keywords
    if (typeof value === 'number') {
      if (typeof subschema.minimum === 'number' && value < subschema.minimum) {
        errors.push({
          path: currentPath,
          keyword: 'minimum',
          expected: `>= ${subschema.minimum}`,
          actual: `${value}`,
          message: `Value ${value} is less than minimum ${subschema.minimum}`,
        })
      }

      if (typeof subschema.maximum === 'number' && value > subschema.maximum) {
        errors.push({
          path: currentPath,
          keyword: 'maximum',
          expected: `<= ${subschema.maximum}`,
          actual: `${value}`,
          message: `Value ${value} is greater than maximum ${subschema.maximum}`,
        })
      }

      if (
        typeof subschema.exclusiveMinimum === 'number' &&
        value <= subschema.exclusiveMinimum
      ) {
        errors.push({
          path: currentPath,
          keyword: 'exclusiveMinimum',
          expected: `> ${subschema.exclusiveMinimum}`,
          actual: `${value}`,
          message: `Value ${value} must be strictly greater than exclusive minimum ${subschema.exclusiveMinimum}`,
        })
      }

      if (
        typeof subschema.exclusiveMaximum === 'number' &&
        value >= subschema.exclusiveMaximum
      ) {
        errors.push({
          path: currentPath,
          keyword: 'exclusiveMaximum',
          expected: `< ${subschema.exclusiveMaximum}`,
          actual: `${value}`,
          message: `Value ${value} must be strictly less than exclusive maximum ${subschema.exclusiveMaximum}`,
        })
      }
    }

    // 5. Object keywords
    if (typeOfValue === 'object' && value !== null && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>
      const keys = Object.keys(obj)

      // required
      if (Array.isArray(subschema.required)) {
        for (const req of subschema.required) {
          if (
            typeof req === 'string' &&
            !Object.prototype.hasOwnProperty.call(obj, req)
          ) {
            errors.push({
              path: appendJsonPath(currentPath, req),
              keyword: 'required',
              expected: `Property "${req}" present`,
              actual: 'missing',
              message: `Missing required property "${req}"`,
            })
          }
        }
      }

      // minProperties
      if (
        typeof subschema.minProperties === 'number' &&
        keys.length < subschema.minProperties
      ) {
        errors.push({
          path: currentPath,
          keyword: 'minProperties',
          expected: `>= ${subschema.minProperties} properties`,
          actual: `${keys.length} properties`,
          message: `Object has ${keys.length} properties, minimum required is ${subschema.minProperties}`,
        })
      }

      // maxProperties
      if (
        typeof subschema.maxProperties === 'number' &&
        keys.length > subschema.maxProperties
      ) {
        errors.push({
          path: currentPath,
          keyword: 'maxProperties',
          expected: `<= ${subschema.maxProperties} properties`,
          actual: `${keys.length} properties`,
          message: `Object has ${keys.length} properties, maximum allowed is ${subschema.maxProperties}`,
        })
      }

      // properties
      const definedProperties =
        subschema.properties && typeof subschema.properties === 'object'
          ? (subschema.properties as Record<string, JsonSchema>)
          : {}

      for (const [propKey, propSchema] of Object.entries(definedProperties)) {
        if (Object.prototype.hasOwnProperty.call(obj, propKey)) {
          validateNode(
            obj[propKey],
            propSchema,
            appendJsonPath(currentPath, propKey)
          )
        }
      }

      // additionalProperties
      if ('additionalProperties' in subschema) {
        const addProp = subschema.additionalProperties
        for (const key of keys) {
          if (!Object.prototype.hasOwnProperty.call(definedProperties, key)) {
            if (addProp === false) {
              errors.push({
                path: appendJsonPath(currentPath, key),
                keyword: 'additionalProperties',
                expected: 'no additional properties',
                actual: `unexpected property "${key}"`,
                message: `Property "${key}" is not allowed by additionalProperties: false`,
              })
            } else if (typeof addProp === 'object' && addProp !== null) {
              validateNode(
                obj[key],
                addProp as JsonSchema,
                appendJsonPath(currentPath, key)
              )
            }
          }
        }
      }
    }

    // 6. Array keywords
    if (Array.isArray(value)) {
      // minItems
      if (
        typeof subschema.minItems === 'number' &&
        value.length < subschema.minItems
      ) {
        errors.push({
          path: currentPath,
          keyword: 'minItems',
          expected: `>= ${subschema.minItems} items`,
          actual: `${value.length} items`,
          message: `Array has ${value.length} items, minimum required is ${subschema.minItems}`,
        })
      }

      // maxItems
      if (
        typeof subschema.maxItems === 'number' &&
        value.length > subschema.maxItems
      ) {
        errors.push({
          path: currentPath,
          keyword: 'maxItems',
          expected: `<= ${subschema.maxItems} items`,
          actual: `${value.length} items`,
          message: `Array has ${value.length} items, maximum allowed is ${subschema.maxItems}`,
        })
      }

      // uniqueItems
      if (subschema.uniqueItems === true && value.length > 1) {
        let hasDuplicate = false
        for (let i = 0; i < value.length; i++) {
          for (let j = i + 1; j < value.length; j++) {
            if (deepEqual(value[i], value[j])) {
              hasDuplicate = true
              errors.push({
                path: appendJsonPath(currentPath, j),
                keyword: 'uniqueItems',
                expected: 'unique array items',
                actual: `duplicate of item at index ${i}`,
                message: `Array item at index ${j} is a duplicate of item at index ${i}`,
              })
              break
            }
          }
          if (hasDuplicate) break
        }
      }

      // items
      if ('items' in subschema) {
        const itemsSchema = subschema.items as JsonSchema
        for (let i = 0; i < value.length; i++) {
          validateNode(value[i], itemsSchema, appendJsonPath(currentPath, i))
        }
      }
    }

    // 7. Composition: allOf, anyOf, oneOf
    if (Array.isArray(subschema.allOf)) {
      for (let i = 0; i < subschema.allOf.length; i++) {
        const sub = subschema.allOf[i] as JsonSchema
        validateNode(value, sub, currentPath)
      }
    }

    if (Array.isArray(subschema.anyOf)) {
      let anyPassed = false

      for (const branch of subschema.anyOf) {
        const branchRes = validateJsonSchema(value, branch as JsonSchema)
        if (branchRes.valid) {
          anyPassed = true
          break
        }
      }

      if (!anyPassed) {
        errors.push({
          path: currentPath,
          keyword: 'anyOf',
          expected: 'matches at least one schema in anyOf',
          actual: stringifyValue(value),
          message: `Value does not match any of the ${subschema.anyOf.length} anyOf schemas`,
        })
      }
    }

    if (Array.isArray(subschema.oneOf)) {
      let validCount = 0

      for (const branch of subschema.oneOf) {
        const branchRes = validateJsonSchema(value, branch as JsonSchema)
        if (branchRes.valid) {
          validCount++
        }
      }

      if (validCount !== 1) {
        errors.push({
          path: currentPath,
          keyword: 'oneOf',
          expected: 'matches exactly one schema in oneOf',
          actual: `matches ${validCount} schemas`,
          message: `Expected to match exactly one schema in oneOf, but matched ${validCount}`,
        })
      }
    }
  }

  const rootPath = formatJsonPath([])
  validateNode(data, schema as JsonSchema, rootPath)

  // Sort errors deterministically: path ascending, then keyword ascending
  errors.sort((a, b) => {
    const pathCmp = a.path.localeCompare(b.path)
    if (pathCmp !== 0) return pathCmp
    return a.keyword.localeCompare(b.keyword)
  })

  return {
    valid: errors.length === 0,
    errors,
  }
}
