/**
 * JSONZero — JSON Convert Utilities & Definitions
 */

import { parseJSON } from '@/lib/json'
import { jsonToTable } from '@/lib/json/table'
import { jsonToCsv } from '@/lib/json/csv'
import { jsonToTypeScript } from '@/lib/json/typescript'
import { jsonToDart } from '@/lib/json/dart'
import { jsonToSchema } from '@/lib/json/schema'
import type {
  ConvertType,
  ConvertDefinition,
  ConvertOptionsState,
  ConvertExecutionResult,
} from './types'

export const CONVERT_DEFINITIONS: Record<ConvertType, ConvertDefinition> = {
  table: {
    id: 'table',
    label: 'JSON → Table',
    group: 'DATA',
    description:
      'Inspect JSON arrays and objects in an interactive data table with copyable cells and rows.',
    extension: '.tsv',
    mimeType: 'text/tab-separated-values',
    defaultFileName: 'jsonzero-table.tsv',
  },
  csv: {
    id: 'csv',
    label: 'JSON → CSV',
    group: 'DATA',
    description:
      'Export JSON arrays to standard RFC 4180 CSV with custom delimiters and robust escaping.',
    extension: '.csv',
    mimeType: 'text/csv',
    defaultFileName: 'jsonzero-export.csv',
  },
  typescript: {
    id: 'typescript',
    label: 'JSON → TypeScript',
    group: 'CODE',
    description:
      'Generate conservative, deterministic TypeScript interfaces and types from sample JSON.',
    extension: '.ts',
    mimeType: 'text/typescript',
    defaultFileName: 'jsonzero-types.ts',
  },
  dart: {
    id: 'dart',
    label: 'JSON → Dart',
    group: 'CODE',
    description:
      'Generate dependency-free Dart models with fromJson and toJson serialization methods.',
    extension: '.dart',
    mimeType: 'text/x-dart',
    defaultFileName: 'jsonzero-model.dart',
  },
  'json-schema': {
    id: 'json-schema',
    label: 'JSON → JSON Schema',
    group: 'SCHEMA',
    description:
      'Generate standard JSON Schema Draft 2020-12 reflecting observed data types and properties.',
    extension: '.schema.json',
    mimeType: 'application/schema+json',
    defaultFileName: 'jsonzero-schema.json',
  },
}

export const DEFAULT_CONVERT_OPTIONS: ConvertOptionsState = {
  csvDelimiter: ',',
  csvIncludeHeader: true,
  tsRootName: 'Root',
  dartRootName: 'Root',
}

/**
 * Deterministically execute conversion on the provided JSON input.
 */
export function executeConvert(
  type: ConvertType,
  input: string,
  options: ConvertOptionsState = DEFAULT_CONVERT_OPTIONS
): ConvertExecutionResult {
  if (!input.trim()) {
    if (type === 'table') {
      return {
        success: true,
        tableData: jsonToTable([]),
      }
    }
    return {
      success: true,
      result: '',
    }
  }

  const parsed = parseJSON(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error || 'Invalid JSON syntax',
      errorLine: parsed.errorLine,
      errorColumn: parsed.errorColumn,
    }
  }

  try {
    switch (type) {
      case 'table': {
        const tableData = jsonToTable(parsed.data)
        return {
          success: true,
          tableData,
        }
      }
      case 'csv': {
        const result = jsonToCsv(parsed.data, {
          delimiter: options.csvDelimiter,
          includeHeader: options.csvIncludeHeader,
        })
        return {
          success: true,
          result,
        }
      }
      case 'typescript': {
        const result = jsonToTypeScript(parsed.data, {
          rootName: options.tsRootName || 'Root',
        })
        return {
          success: true,
          result,
        }
      }
      case 'dart': {
        const result = jsonToDart(parsed.data, {
          rootName: options.dartRootName || 'Root',
        })
        return {
          success: true,
          result,
        }
      }
      case 'json-schema': {
        const result = jsonToSchema(parsed.data)
        return {
          success: true,
          result,
        }
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Conversion failed',
    }
  }
}
