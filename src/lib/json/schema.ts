/**
 * JSONZero — JSON to JSON Schema Conversion Engine
 *
 * Generates JSON Schema Draft 2020-12 representations from observed JSON structures.
 * Supports primitives, objects with properties and required constraints,
 * homogeneous arrays, and mixed-type arrays using `anyOf`.
 * Pure, deterministic, and 100% client-side with zero dependencies.
 */

export interface SchemaOptions {
  draft?: string
  includeSchemaUri?: boolean
}

export const DRAFT_2020_12 = 'https://json-schema.org/draft/2020-12/schema'

export interface JsonSchemaObject {
  $schema?: string
  type?: string | string[]
  properties?: Record<string, JsonSchemaObject>
  required?: string[]
  items?: JsonSchemaObject | { anyOf: JsonSchemaObject[] }
  anyOf?: JsonSchemaObject[]
}

/**
 * Infer JSON Schema for an arbitrary value recursively.
 */
function inferSchemaNode(val: unknown): JsonSchemaObject {
  if (val === null) {
    return { type: 'null' }
  }

  if (typeof val === 'boolean') {
    return { type: 'boolean' }
  }

  if (typeof val === 'number') {
    return { type: Number.isInteger(val) ? 'integer' : 'number' }
  }

  if (typeof val === 'string') {
    return { type: 'string' }
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      return { type: 'array' }
    }

    // Examine items
    const objectElements: Record<string, unknown>[] = []
    const distinctItemSchemas: JsonSchemaObject[] = []
    const seenSchemaSignatures = new Set<string>()

    for (const item of val) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        objectElements.push(item as Record<string, unknown>)
      } else {
        const itemSchema = inferSchemaNode(item)
        const sig = JSON.stringify(itemSchema)
        if (!seenSchemaSignatures.has(sig)) {
          seenSchemaSignatures.add(sig)
          distinctItemSchemas.push(itemSchema)
        }
      }
    }

    if (objectElements.length > 0) {
      const mergedObjectSchema = inferMergedObjectSchema(objectElements)
      const sig = JSON.stringify(mergedObjectSchema)
      if (!seenSchemaSignatures.has(sig)) {
        seenSchemaSignatures.add(sig)
        distinctItemSchemas.push(mergedObjectSchema)
      }
    }

    if (distinctItemSchemas.length === 1) {
      return {
        type: 'array',
        items: distinctItemSchemas[0],
      }
    }

    if (distinctItemSchemas.length > 1) {
      return {
        type: 'array',
        items: {
          anyOf: distinctItemSchemas,
        },
      }
    }

    return { type: 'array' }
  }

  if (typeof val === 'object') {
    return inferSingleObjectSchema(val as Record<string, unknown>)
  }

  return {}
}

function inferSingleObjectSchema(
  obj: Record<string, unknown>
): JsonSchemaObject {
  const keys = Object.keys(obj)
  if (keys.length === 0) {
    return {
      type: 'object',
      properties: {},
    }
  }

  const properties: Record<string, JsonSchemaObject> = {}
  for (const key of keys) {
    properties[key] = inferSchemaNode(obj[key])
  }

  return {
    type: 'object',
    properties,
    required: keys,
  }
}

function inferMergedObjectSchema(
  objects: Record<string, unknown>[]
): JsonSchemaObject {
  const keyMap = new Map<string, unknown[]>()
  const keyFirstSeen = new Map<string, number>()
  let order = 0

  for (const obj of objects) {
    for (const [k, v] of Object.entries(obj)) {
      if (!keyMap.has(k)) {
        keyMap.set(k, [])
        keyFirstSeen.set(k, order++)
      }
      keyMap.get(k)!.push(v)
    }
  }

  const sortedKeys = Array.from(keyMap.keys()).sort(
    (a, b) => (keyFirstSeen.get(a) ?? 0) - (keyFirstSeen.get(b) ?? 0)
  )

  const properties: Record<string, JsonSchemaObject> = {}
  const required: string[] = []

  for (const key of sortedKeys) {
    const values = keyMap.get(key)!
    // If key is present across all objects in sample, consider required
    if (values.length === objects.length) {
      required.push(key)
    }

    // Find schema variants for this property
    const seenSigs = new Set<string>()
    const variants: JsonSchemaObject[] = []

    for (const v of values) {
      const node = inferSchemaNode(v)
      const sig = JSON.stringify(node)
      if (!seenSigs.has(sig)) {
        seenSigs.add(sig)
        variants.push(node)
      }
    }

    if (variants.length === 1) {
      properties[key] = variants[0]
    } else if (variants.length > 1) {
      properties[key] = { anyOf: variants }
    }
  }

  const schema: JsonSchemaObject = {
    type: 'object',
    properties,
  }

  if (required.length > 0) {
    schema.required = required
  }

  return schema
}

/**
 * Convert any JSON value into a valid JSON Schema Draft 2020-12 document.
 */
export function jsonToSchema(
  data: unknown,
  options: SchemaOptions = {}
): string {
  const draft = options.draft ?? DRAFT_2020_12
  const includeSchemaUri = options.includeSchemaUri ?? true

  const node = inferSchemaNode(data)

  const rootSchema: JsonSchemaObject = {
    ...(includeSchemaUri ? { $schema: draft } : {}),
    ...node,
  }

  return JSON.stringify(rootSchema, null, 2)
}
