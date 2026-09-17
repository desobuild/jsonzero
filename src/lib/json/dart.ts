/**
 * JSONZero — JSON to Dart Model Conversion Engine
 *
 * Generates dependency-free Dart model classes with constructor,
 * factory `fromJson(Map<String, dynamic> json)` and `Map<String, dynamic> toJson()`.
 * Handles nested models, nullability, type inference (int, double, num, String, bool, List),
 * and field name sanitization preserving original JSON keys.
 * Pure, deterministic, and 100% client-side with zero dependencies.
 */

export interface DartOptions {
  rootName?: string
}

const DART_RESERVED_WORDS = new Set([
  'assert',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'covariant',
  'default',
  'deferred',
  'do',
  'dynamic',
  'else',
  'enum',
  'export',
  'extends',
  'extension',
  'external',
  'factory',
  'false',
  'final',
  'finally',
  'for',
  'function',
  'get',
  'hide',
  'if',
  'implements',
  'import',
  'in',
  'interface',
  'is',
  'late',
  'library',
  'mixin',
  'new',
  'null',
  'of',
  'on',
  'operator',
  'part',
  'required',
  'rethrow',
  'return',
  'set',
  'show',
  'static',
  'super',
  'switch',
  'sync',
  'this',
  'throw',
  'true',
  'try',
  'typedef',
  'var',
  'void',
  'while',
  'with',
  'yield',
])

/**
 * Convert any string key to a valid Dart field name (camelCase).
 */
export function toDartFieldName(key: string): string {
  if (!key) return 'field'

  const parts = key.split(/[^a-zA-Z0-9]+/).filter(Boolean)
  if (parts.length === 0) return 'field'

  let field =
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('')

  // Ensure it doesn't start with a number
  if (/^[0-9]/.test(field)) {
    field = `val${field}`
  }

  // If reserved keyword, suffix with Field
  if (DART_RESERVED_WORDS.has(field)) {
    field = `${field}Value`
  }

  return field
}

/**
 * Convert string to PascalCase for Dart class names.
 */
export function toDartClassName(name: string): string {
  if (!name) return 'Model'
  let cleaned = name
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
  if (parts.length === 0) return 'Model'

  let className = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  if (/^[0-9]/.test(className)) {
    className = `Model${className}`
  }
  return className
}

interface DartTypeInfo {
  dartType: string
  isCustomClass: boolean
  isList: boolean
  isNullable: boolean
  listItemType?: string
  isListItemCustomClass?: boolean
}

interface DartCollector {
  classes: Map<string, string>
  usedClassNames: Set<string>
}

function getUniqueDartClassName(
  baseName: string,
  collector: DartCollector,
  parentName?: string
): string {
  const name = toDartClassName(baseName)
  if (!collector.usedClassNames.has(name)) {
    collector.usedClassNames.add(name)
    return name
  }
  if (parentName) {
    const parentPrefixed = `${toDartClassName(parentName)}${name}`
    if (!collector.usedClassNames.has(parentPrefixed)) {
      collector.usedClassNames.add(parentPrefixed)
      return parentPrefixed
    }
  }
  let counter = 2
  while (collector.usedClassNames.has(`${name}${counter}`)) {
    counter++
  }
  const unique = `${name}${counter}`
  collector.usedClassNames.add(unique)
  return unique
}

/**
 * Infer Dart type information for a given JSON value.
 */
function inferDartType(
  val: unknown,
  suggestedName: string,
  collector: DartCollector
): DartTypeInfo {
  if (val === null || val === undefined) {
    return {
      dartType: 'dynamic',
      isCustomClass: false,
      isList: false,
      isNullable: true,
    }
  }

  if (typeof val === 'boolean') {
    return {
      dartType: 'bool',
      isCustomClass: false,
      isList: false,
      isNullable: false,
    }
  }

  if (typeof val === 'number') {
    return {
      dartType: Number.isInteger(val) ? 'int' : 'double',
      isCustomClass: false,
      isList: false,
      isNullable: false,
    }
  }

  if (typeof val === 'string') {
    return {
      dartType: 'String',
      isCustomClass: false,
      isList: false,
      isNullable: false,
    }
  }

  if (Array.isArray(val)) {
    if (val.length === 0) {
      return {
        dartType: 'List<dynamic>',
        isCustomClass: false,
        isList: true,
        isNullable: false,
        listItemType: 'dynamic',
        isListItemCustomClass: false,
      }
    }

    // Check elements
    const objectElements: Record<string, unknown>[] = []
    const primitiveTypes = new Set<string>()

    for (const item of val) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        objectElements.push(item as Record<string, unknown>)
      } else {
        const itemInfo = inferDartType(item, suggestedName, collector)
        primitiveTypes.add(itemInfo.dartType)
      }
    }

    if (objectElements.length > 0) {
      const className = getUniqueDartClassName(suggestedName, collector)
      const classCode = generateDartClassFromObjects(
        className,
        objectElements,
        collector
      )
      collector.classes.set(className, classCode)
      return {
        dartType: `List<${className}>`,
        isCustomClass: false,
        isList: true,
        isNullable: false,
        listItemType: className,
        isListItemCustomClass: true,
      }
    }

    if (primitiveTypes.size === 1) {
      const single = Array.from(primitiveTypes)[0]
      return {
        dartType: `List<${single}>`,
        isCustomClass: false,
        isList: true,
        isNullable: false,
        listItemType: single,
        isListItemCustomClass: false,
      }
    }

    return {
      dartType: 'List<dynamic>',
      isCustomClass: false,
      isList: true,
      isNullable: false,
      listItemType: 'dynamic',
      isListItemCustomClass: false,
    }
  }

  if (typeof val === 'object') {
    const className = getUniqueDartClassName(suggestedName, collector)
    const classCode = generateDartClass(
      className,
      val as Record<string, unknown>,
      collector
    )
    collector.classes.set(className, classCode)
    return {
      dartType: className,
      isCustomClass: true,
      isList: false,
      isNullable: false,
    }
  }

  return {
    dartType: 'dynamic',
    isCustomClass: false,
    isList: false,
    isNullable: true,
  }
}

interface FieldDefinition {
  jsonKey: string
  fieldName: string
  typeInfo: DartTypeInfo
}

function generateDartClass(
  className: string,
  obj: Record<string, unknown>,
  collector: DartCollector
): string {
  const fields: FieldDefinition[] = []

  for (const [key, val] of Object.entries(obj)) {
    const fieldName = toDartFieldName(key)
    const typeInfo = inferDartType(val, key, collector)
    fields.push({
      jsonKey: key,
      fieldName,
      typeInfo,
    })
  }

  return renderDartClassCode(className, fields)
}

function generateDartClassFromObjects(
  className: string,
  objects: Record<string, unknown>[],
  collector: DartCollector
): string {
  const keyMap = new Map<string, unknown[]>()
  const keyOrder = new Map<string, number>()
  let order = 0

  for (const obj of objects) {
    for (const [k, v] of Object.entries(obj)) {
      if (!keyMap.has(k)) {
        keyMap.set(k, [])
        keyOrder.set(k, order++)
      }
      keyMap.get(k)!.push(v)
    }
  }

  const sortedKeys = Array.from(keyMap.keys()).sort(
    (a, b) => (keyOrder.get(a) ?? 0) - (keyOrder.get(b) ?? 0)
  )

  const fields: FieldDefinition[] = []

  for (const key of sortedKeys) {
    const values = keyMap.get(key)!
    const isOptional = values.length < objects.length
    const hasNull = values.some((v) => v === null)
    const nonNullValues = values.filter((v) => v !== null)

    let typeInfo: DartTypeInfo

    if (nonNullValues.length === 0) {
      typeInfo = {
        dartType: 'dynamic',
        isCustomClass: false,
        isList: false,
        isNullable: true,
      }
    } else {
      typeInfo = inferDartType(nonNullValues[0], key, collector)
    }

    if (isOptional || hasNull) {
      typeInfo.isNullable = true
    }

    fields.push({
      jsonKey: key,
      fieldName: toDartFieldName(key),
      typeInfo,
    })
  }

  return renderDartClassCode(className, fields)
}

function renderDartClassCode(
  className: string,
  fields: FieldDefinition[]
): string {
  const lines: string[] = []

  // Class declaration
  lines.push(`class ${className} {`)

  // Field declarations
  for (const f of fields) {
    const nullableSuffix =
      f.typeInfo.isNullable && f.typeInfo.dartType !== 'dynamic' ? '?' : ''
    lines.push(
      `  final ${f.typeInfo.dartType}${nullableSuffix} ${f.fieldName};`
    )
  }

  lines.push('')

  // Constructor
  lines.push(`  ${className}({`)
  for (const f of fields) {
    if (f.typeInfo.isNullable || f.typeInfo.dartType === 'dynamic') {
      lines.push(`    this.${f.fieldName},`)
    } else {
      lines.push(`    required this.${f.fieldName},`)
    }
  }
  lines.push('  });')

  lines.push('')

  // fromJson
  lines.push(`  factory ${className}.fromJson(Map<String, dynamic> json) {`)
  lines.push(`    return ${className}(`)
  for (const f of fields) {
    const access = `json['${f.jsonKey}']`
    const nullable = f.typeInfo.isNullable

    if (f.typeInfo.isCustomClass) {
      const cls = f.typeInfo.dartType
      if (nullable) {
        lines.push(
          `      ${f.fieldName}: ${access} != null ? ${cls}.fromJson(${access} as Map<String, dynamic>) : null,`
        )
      } else {
        lines.push(
          `      ${f.fieldName}: ${cls}.fromJson(${access} as Map<String, dynamic>),`
        )
      }
    } else if (f.typeInfo.isList) {
      const itemType = f.typeInfo.listItemType || 'dynamic'
      if (f.typeInfo.isListItemCustomClass) {
        if (nullable) {
          lines.push(
            `      ${f.fieldName}: ${access} != null ? (${access} as List<dynamic>).map((e) => ${itemType}.fromJson(e as Map<String, dynamic>)).toList() : null,`
          )
        } else {
          lines.push(
            `      ${f.fieldName}: (${access} as List<dynamic>).map((e) => ${itemType}.fromJson(e as Map<String, dynamic>)).toList(),`
          )
        }
      } else {
        const castType = itemType === 'dynamic' ? 'dynamic' : itemType
        if (nullable) {
          lines.push(
            `      ${f.fieldName}: ${access} != null ? (${access} as List<dynamic>).map((e) => e as ${castType}).toList() : null,`
          )
        } else {
          lines.push(
            `      ${f.fieldName}: (${access} as List<dynamic>).map((e) => e as ${castType}).toList(),`
          )
        }
      }
    } else {
      const castType =
        f.typeInfo.dartType === 'dynamic'
          ? ''
          : ` as ${f.typeInfo.dartType}${nullable ? '?' : ''}`
      lines.push(`      ${f.fieldName}: ${access}${castType},`)
    }
  }
  lines.push('    );')
  lines.push('  }')

  lines.push('')

  // toJson
  lines.push('  Map<String, dynamic> toJson() {')
  lines.push('    return {')
  for (const f of fields) {
    if (f.typeInfo.isCustomClass) {
      if (f.typeInfo.isNullable) {
        lines.push(`      '${f.jsonKey}': ${f.fieldName}?.toJson(),`)
      } else {
        lines.push(`      '${f.jsonKey}': ${f.fieldName}.toJson(),`)
      }
    } else if (f.typeInfo.isList && f.typeInfo.isListItemCustomClass) {
      if (f.typeInfo.isNullable) {
        lines.push(
          `      '${f.jsonKey}': ${f.fieldName}?.map((e) => e.toJson()).toList(),`
        )
      } else {
        lines.push(
          `      '${f.jsonKey}': ${f.fieldName}.map((e) => e.toJson()).toList(),`
        )
      }
    } else {
      lines.push(`      '${f.jsonKey}': ${f.fieldName},`)
    }
  }
  lines.push('    };')
  lines.push('  }')

  lines.push('}')
  return lines.join('\n')
}

/**
 * Convert any JSON value into clean, dependency-free Dart models.
 */
export function jsonToDart(data: unknown, options: DartOptions = {}): string {
  const rootName = options.rootName?.trim() || 'Root'
  const collector: DartCollector = {
    classes: new Map(),
    usedClassNames: new Set([rootName]),
  }

  if (data === null || data === undefined) {
    return `// Value is null or undefined\ntypedef ${rootName} = dynamic;\n`
  }

  if (typeof data !== 'object') {
    const typeInfo = inferDartType(data, rootName, collector)
    return `// Primitive Root Value\ntypedef ${rootName} = ${typeInfo.dartType};\n`
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `// Empty List\ntypedef ${rootName} = List<dynamic>;\n`
    }

    const objectElements: Record<string, unknown>[] = []
    for (const item of data) {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        objectElements.push(item as Record<string, unknown>)
      }
    }

    if (objectElements.length > 0) {
      const itemClassName = `${rootName}Item`
      collector.usedClassNames.add(itemClassName)
      const itemClassCode = generateDartClassFromObjects(
        itemClassName,
        objectElements,
        collector
      )

      const headerComment = `// Root is a List of ${itemClassName}\n// To parse: (jsonList as List).map((i) => ${itemClassName}.fromJson(i)).toList();\ntypedef ${rootName} = List<${itemClassName}>;\n\n`

      const allClasses = [
        itemClassCode,
        ...Array.from(collector.classes.values()),
      ]
      return `${headerComment}${allClasses.join('\n\n')}\n`
    }

    const first = data[0]
    const info = inferDartType(first, `${rootName}Item`, collector)
    return `// List of ${info.dartType}\ntypedef ${rootName} = List<${info.dartType}>;\n`
  }

  // Object root
  const rootClass = generateDartClass(
    rootName,
    data as Record<string, unknown>,
    collector
  )
  const childClasses = Array.from(collector.classes.values())

  if (childClasses.length > 0) {
    return `${rootClass}\n\n${childClasses.join('\n\n')}\n`
  }
  return `${rootClass}\n`
}
