/**
 * JSONZero — Pure JSON Web Worker
 *
 * Runs CPU-heavy JSON operations off the main UI thread.
 * Client-side only. Zero network activity. Zero analytics.
 */

import {
  formatJSON,
  minifyJSON,
  validateJSON,
  computeJsonStats,
  evaluateJsonPath,
} from '@/lib/json'
import { compareJson } from '@/lib/json/diff'
import { sortKeys } from '@/lib/json/sort'
import { flattenJson, unflattenJson } from '@/lib/json/flatten'
import { generateAssertions } from '@/lib/json/assertions'
import { validateJsonSchema } from '@/lib/json/schema-validator'
import type {
  WorkerOperation,
  WorkerPayloadMap,
  WorkerResultMap,
  WorkerRequest,
  WorkerResponse,
} from './types'

/**
 * Pure dispatcher function executing operations synchronously or inside worker.
 * Directly testable in unit tests without requiring browser worker mocking.
 */
export function processWorkerOperation<Op extends WorkerOperation>(
  operation: Op,
  payload: WorkerPayloadMap[Op]
): WorkerResultMap[Op] {
  switch (operation) {
    case 'format': {
      const p = payload as WorkerPayloadMap['format']
      return formatJSON(p.json, p.indent) as unknown as WorkerResultMap[Op]
    }
    case 'minify': {
      const p = payload as WorkerPayloadMap['minify']
      return minifyJSON(p.json) as unknown as WorkerResultMap[Op]
    }
    case 'validate': {
      const p = payload as WorkerPayloadMap['validate']
      return validateJSON(p.json) as unknown as WorkerResultMap[Op]
    }
    case 'diff': {
      const p = payload as WorkerPayloadMap['diff']
      try {
        const left = JSON.parse(p.jsonA)
        const right = JSON.parse(p.jsonB)
        return compareJson(left, right) as unknown as WorkerResultMap[Op]
      } catch (err) {
        throw new Error(
          `Diff comparison failed: ${err instanceof Error ? err.message : 'Invalid JSON'}`
        )
      }
    }
    case 'statistics': {
      const p = payload as WorkerPayloadMap['statistics']
      return computeJsonStats(p.json) as unknown as WorkerResultMap[Op]
    }
    case 'sort': {
      const p = payload as WorkerPayloadMap['sort']
      try {
        const data = JSON.parse(p.json)
        const sorted = sortKeys(data, { recursive: p.recursive ?? true })
        return {
          success: true,
          sorted: JSON.stringify(sorted, null, 2),
        } as unknown as WorkerResultMap[Op]
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : 'Invalid JSON for sorting',
        } as unknown as WorkerResultMap[Op]
      }
    }
    case 'flatten': {
      const p = payload as WorkerPayloadMap['flatten']
      try {
        const data = JSON.parse(p.json)
        const flattened = flattenJson(data)
        return {
          success: true,
          flattened: JSON.stringify(flattened, null, 2),
        } as unknown as WorkerResultMap[Op]
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error ? err.message : 'Invalid JSON for flattening',
        } as unknown as WorkerResultMap[Op]
      }
    }
    case 'unflatten': {
      const p = payload as WorkerPayloadMap['unflatten']
      try {
        const data = JSON.parse(p.json)
        const res = unflattenJson(data)
        if (!res.success) {
          return {
            success: false,
            error:
              res.error ?? 'Collision or invalid structure in flattened keys',
          } as unknown as WorkerResultMap[Op]
        }
        return {
          success: true,
          unflattened: JSON.stringify(res.data, null, 2),
        } as unknown as WorkerResultMap[Op]
      } catch (err) {
        return {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : 'Invalid JSON for unflattening',
        } as unknown as WorkerResultMap[Op]
      }
    }
    case 'jsonpath': {
      const p = payload as WorkerPayloadMap['jsonpath']
      try {
        const data = typeof p.json === 'string' ? JSON.parse(p.json) : p.json
        return evaluateJsonPath(data, p.query) as unknown as WorkerResultMap[Op]
      } catch (err) {
        return {
          success: false,
          results: [],
          error:
            err instanceof Error
              ? err.message
              : 'Invalid JSON for JSONPath query',
        } as unknown as WorkerResultMap[Op]
      }
    }
    case 'assertions': {
      const p = payload as WorkerPayloadMap['assertions']
      try {
        const data = JSON.parse(p.json)
        return generateAssertions(
          data,
          p.options
        ) as unknown as WorkerResultMap[Op]
      } catch (err) {
        throw new Error(
          `Assertion generation failed: ${err instanceof Error ? err.message : 'Invalid JSON'}`
        )
      }
    }
    case 'schema-validate': {
      const p = payload as WorkerPayloadMap['schema-validate']
      return validateJsonSchema(
        p.data,
        p.schema
      ) as unknown as WorkerResultMap[Op]
    }
    default: {
      throw new Error(`Unsupported worker operation: ${String(operation)}`)
    }
  }
}

// Worker thread listener (only active when executed inside dedicated worker context)
if (
  typeof self !== 'undefined' &&
  typeof self.postMessage === 'function' &&
  typeof window === 'undefined'
) {
  self.onmessage = (e: MessageEvent<WorkerRequest>) => {
    const { id, operation, payload } = e.data
    try {
      const result = processWorkerOperation(operation, payload)
      const response: WorkerResponse = {
        id,
        success: true,
        result,
      }
      self.postMessage(response)
    } catch (err) {
      const response: WorkerResponse = {
        id,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      }
      self.postMessage(response)
    }
  }
}
