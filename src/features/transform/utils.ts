/**
 * JSONZero — Transform Execution Utilities and Metadata
 */

import {
  parseJSON,
  sortKeys,
  sortKeysRecursive,
  flattenJson,
  unflattenJson,
  escapeJson,
  unescapeJson,
} from '@/lib/json'
import type { TransformDefinition, TransformType } from './types'

export const TRANSFORM_DEFINITIONS: Record<TransformType, TransformDefinition> =
  {
    'sort-keys': {
      id: 'sort-keys',
      label: 'Sort Keys',
      group: 'SORT',
      description:
        'Alphabetically sort top-level object keys (lexicographic ascending).',
      expectsValidJson: true,
    },
    'sort-recursive': {
      id: 'sort-recursive',
      label: 'Recursive Sort',
      group: 'SORT',
      description:
        'Alphabetically sort all nested object keys. Preserves array element ordering.',
      expectsValidJson: true,
    },
    flatten: {
      id: 'flatten',
      label: 'Flatten',
      group: 'STRUCTURE',
      description:
        'Flatten nested structures into a single-depth map using dot and bracket notation.',
      expectsValidJson: true,
    },
    unflatten: {
      id: 'unflatten',
      label: 'Unflatten',
      group: 'STRUCTURE',
      description:
        'Reconstruct nested JSON from flattened path keys with strict collision detection.',
      expectsValidJson: true,
    },
    escape: {
      id: 'escape',
      label: 'Escape JSON',
      group: 'ESCAPE',
      description:
        'Encode JSON as an escaped string literal for embedding in code or configuration.',
      expectsValidJson: false,
    },
    unescape: {
      id: 'unescape',
      label: 'Unescape JSON',
      group: 'ESCAPE',
      description:
        'Decode an escaped JSON string back into a formatted, valid JSON structure.',
      expectsValidJson: false,
    },
  }

export interface TransformExecutionResult {
  success: boolean
  result?: string
  error?: string
}

/**
 * Pure dispatcher that applies the selected transformation to the input string.
 */
export function executeTransform(
  type: TransformType,
  input: string
): TransformExecutionResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return {
      success: true,
      result: '',
    }
  }

  switch (type) {
    case 'sort-keys': {
      const parsed = parseJSON(trimmed)
      if (!parsed.success) {
        return {
          success: false,
          error: `Invalid JSON syntax:\n${parsed.error || 'Cannot parse JSON for sorting.'}${parsed.errorLine ? ` at line ${parsed.errorLine}, col ${parsed.errorColumn}` : ''}`,
        }
      }
      const sorted = sortKeys(parsed.data, { recursive: false })
      return {
        success: true,
        result: JSON.stringify(sorted, null, 2),
      }
    }

    case 'sort-recursive': {
      const parsed = parseJSON(trimmed)
      if (!parsed.success) {
        return {
          success: false,
          error: `Invalid JSON syntax:\n${parsed.error || 'Cannot parse JSON for sorting.'}${parsed.errorLine ? ` at line ${parsed.errorLine}, col ${parsed.errorColumn}` : ''}`,
        }
      }
      const sorted = sortKeysRecursive(parsed.data)
      return {
        success: true,
        result: JSON.stringify(sorted, null, 2),
      }
    }

    case 'flatten': {
      const parsed = parseJSON(trimmed)
      if (!parsed.success) {
        return {
          success: false,
          error: `Invalid JSON syntax:\n${parsed.error || 'Cannot parse JSON for flattening.'}${parsed.errorLine ? ` at line ${parsed.errorLine}, col ${parsed.errorColumn}` : ''}`,
        }
      }
      const flattened = flattenJson(parsed.data)
      return {
        success: true,
        result: JSON.stringify(flattened, null, 2),
      }
    }

    case 'unflatten': {
      const parsed = parseJSON(trimmed)
      if (!parsed.success) {
        return {
          success: false,
          error: `Invalid JSON syntax:\n${parsed.error || 'Cannot parse JSON for unflattening.'}${parsed.errorLine ? ` at line ${parsed.errorLine}, col ${parsed.errorColumn}` : ''}`,
        }
      }
      const unflattened = unflattenJson(parsed.data)
      if (!unflattened.success) {
        return {
          success: false,
          error: unflattened.error || 'Failed to unflatten JSON.',
        }
      }
      return {
        success: true,
        result: JSON.stringify(unflattened.data, null, 2),
      }
    }

    case 'escape': {
      const escaped = escapeJson(trimmed)
      if (!escaped.success) {
        return {
          success: false,
          error: escaped.error || 'Failed to escape input.',
        }
      }
      return {
        success: true,
        result: escaped.result,
      }
    }

    case 'unescape': {
      const unescaped = unescapeJson(trimmed)
      if (!unescaped.success) {
        return {
          success: false,
          error: unescaped.error || 'Failed to unescape input into valid JSON.',
        }
      }
      return {
        success: true,
        result: unescaped.result,
      }
    }

    default:
      return {
        success: false,
        error: `Unknown transformation type: ${String(type)}`,
      }
  }
}
