/**
 * JSONZero — JSON to TypeScript Conversion Engine
 *
 * Infers conservative TypeScript interfaces and types from JSON documents.
 * Handles nested objects, primitive and mixed arrays, nulls, and non-identifier keys.
 * Pure, deterministic, and 100% client-side with zero dependencies.
 */

export interface TypeScriptOptions {
  rootName?: string
  exportType?: 'interface' | 'type'
}

/**
 * Check whether a string is a valid JavaScript/TypeScript identifier without quoting.
 */
export function isValidIdentifier(name: string): boolean {
  if (!name) return false
  const identifierRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
  if (!identifierRegex.test(name)) return false

  const reservedWords = new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'let',
    'static',
    'interface',
    'package',
    'private',
    'protected',
    'public',
    'implements',
    'type',
    'any',
    'number',
    'boolean',
    'string',
    'symbol',
    'unknown',
    'never',
    'object',
  ])

  return !reservedWords.has(name)
}

/**
 * Format a property key for TypeScript interface (quoted if invalid identifier).
 */
export function formatPropertyKey(name: string): string {
  return isValidIdentifier(name) ? name : JSON.stringify(name)
}

/**
 * Convert a property key or string to PascalCase for interface/type naming.
 */
export function toPascalCase(str: string): string {
  if (!str) return 'Item'
  // Remove plural 's' at the end for array item types (e.g. 'users' -> 'User')
  let cleaned = str
  if (cleaned.length > 3 && cleaned.endsWith('ies')) {
    cleaned = cleaned.slice(0, -3) + 'y'
  } else if (
    cleaned.length > 2 &&
    cleaned.endsWith('s') &&
    !cleaned.endsWith('ss')
  ) {
    cleaned = cleaned.slice(0, -1)
  }

  const parts = cleaned.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (parts.length === 0) return 'Item'

  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
}

interface TypeCollector {
  typeDeclarations: Map<string, string>
  usedNames: Set<string>
}

/**
 * Infer TypeScript type string for a given value, collecting sub-interfaces.
 */
function inferType(
  value: unknown,
  suggestedName: string,
  collector: TypeCollector
): string {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'undefined'
  }

  const type = typeof value

  if (type === 'string') {
    return 'string'
  }
  if (type === 'number') {
    return 'number'
  }
  if (type === 'boolean') {
    return 'boolean'
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'unknown[]'
    }

    // Collect all element types
    const elementTypes = new Set<string>()
    const objectElements: Record<string, unknown>[] = []

    for (const item of value) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        objectElements.push(item as Record<string, unknown>)
      } else {
        elementTypes.add(inferType(item, suggestedName, collector))
      }
    }

    if (objectElements.length > 0) {
      // Merge object elements into a unified interface
      const itemTypeName = getUniqueTypeName(suggestedName, collector)
      const mergedInterface = generateMergedInterface(
        itemTypeName,
        objectElements,
        collector
      )
      collector.typeDeclarations.set(itemTypeName, mergedInterface)
      elementTypes.add(itemTypeName)
    }

    const typeList = Array.from(elementTypes).sort()
    if (typeList.length === 1) {
      const single = typeList[0]
      return single.includes('|') ? `(${single})[]` : `${single}[]`
    }

    return `(${typeList.join(' | ')})[]`
  }

  if (type === 'object') {
    const typeName = getUniqueTypeName(suggestedName, collector)
    const intf = generateInterface(
      typeName,
      value as Record<string, unknown>,
      collector
    )
    collector.typeDeclarations.set(typeName, intf)
    return typeName
  }

  return 'unknown'
}

function getUniqueTypeName(
  baseName: string,
  collector: TypeCollector,
  parentName?: string
): string {
  let name = toPascalCase(baseName)
  if (!name) name = 'Type'
  if (!collector.usedNames.has(name)) {
    collector.usedNames.add(name)
    return name
  }
  if (parentName) {
    const parentPrefixed = `${toPascalCase(parentName)}${name}`
    if (!collector.usedNames.has(parentPrefixed)) {
      collector.usedNames.add(parentPrefixed)
      return parentPrefixed
    }
  }
  let counter = 2
  while (collector.usedNames.has(`${name}${counter}`)) {
    counter++
  }
  const uniqueName = `${name}${counter}`
  collector.usedNames.add(uniqueName)
  return uniqueName
}

function generateInterface(
  name: string,
  obj: Record<string, unknown>,
  collector: TypeCollector
): string {
  const entries = Object.entries(obj)
  if (entries.length === 0) {
    return `export interface ${name} {}`
  }

  const lines: string[] = [`export interface ${name} {`]
  for (const [key, val] of entries) {
    const propKey = formatPropertyKey(key)
    const propType = inferType(val, key, collector)
    lines.push(`  ${propKey}: ${propType};`)
  }
  lines.push('}')
  return lines.join('\n')
}

function generateMergedInterface(
  name: string,
  objects: Record<string, unknown>[],
  collector: TypeCollector
): string {
  const allKeys = new Map<string, unknown[]>()
  const keyFirstSeen = new Map<string, number>()
  let orderIndex = 0

  for (const obj of objects) {
    for (const [k, v] of Object.entries(obj)) {
      if (!allKeys.has(k)) {
        allKeys.set(k, [])
        keyFirstSeen.set(k, orderIndex++)
      }
      allKeys.get(k)!.push(v)
    }
  }

  const sortedKeys = Array.from(allKeys.keys()).sort(
    (a, b) => (keyFirstSeen.get(a) ?? 0) - (keyFirstSeen.get(b) ?? 0)
  )

  const lines: string[] = [`export interface ${name} {`]
  for (const key of sortedKeys) {
    const values = allKeys.get(key)!
    const isOptional = values.length < objects.length
    const childSuggested = key

    const observedTypes = new Set<string>()
    for (const val of values) {
      observedTypes.add(inferType(val, childSuggested, collector))
    }

    const typeList = Array.from(observedTypes).sort()
    const propType = typeList.join(' | ') || 'unknown'
    const propKey = formatPropertyKey(key)
    const optionalMarker = isOptional ? '?' : ''

    lines.push(`  ${propKey}${optionalMarker}: ${propType};`)
  }
  lines.push('}')
  return lines.join('\n')
}

/**
 * Convert any JSON value into valid, deterministic TypeScript definitions.
 */
export function jsonToTypeScript(
  data: unknown,
  options: TypeScriptOptions = {}
): string {
  const rootName = options.rootName?.trim() || 'Root'
  const collector: TypeCollector = {
    typeDeclarations: new Map(),
    usedNames: new Set([rootName]),
  }

  if (data === null) {
    return `export type ${rootName} = null;\n`
  }
  if (data === undefined) {
    return `export type ${rootName} = undefined;\n`
  }

  if (typeof data !== 'object') {
    const primitiveType = typeof data === 'boolean' ? 'boolean' : typeof data
    return `export type ${rootName} = ${primitiveType};\n`
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `export type ${rootName} = unknown[];\n`
    }

    const arrayType = inferType(data, `${rootName}Item`, collector)
    const rootDecl = `export type ${rootName} = ${arrayType};\n`

    const otherDecls = Array.from(collector.typeDeclarations.values())
    if (otherDecls.length > 0) {
      return `${rootDecl}\n${otherDecls.join('\n\n')}\n`
    }
    return rootDecl
  }

  // Object root
  const rootInterface = generateInterface(
    rootName,
    data as Record<string, unknown>,
    collector
  )
  const otherDecls = Array.from(collector.typeDeclarations.values())

  if (otherDecls.length > 0) {
    return `${rootInterface}\n\n${otherDecls.join('\n\n')}\n`
  }
  return `${rootInterface}\n`
}
