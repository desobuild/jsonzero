/**
 * JSONZero — Web Worker Protocol Types
 *
 * Strongly-typed request/response message contracts for offloading heavy JSON operations.
 */

import type { IndentOption, JsonStats, JsonValidationResult } from '@/lib/json'
import type { DiffResult } from '@/lib/json/diff'
import type { JsonPathResult } from '@/lib/json/jsonpath'
import type {
  AssertionOptions,
  GeneratedAssertions,
} from '@/lib/json/assertions'
import type { SchemaValidationResult } from '@/lib/json/schema-validator'

export type WorkerOperation =
  | 'format'
  | 'minify'
  | 'validate'
  | 'diff'
  | 'statistics'
  | 'sort'
  | 'flatten'
  | 'unflatten'
  | 'jsonpath'
  | 'assertions'
  | 'schema-validate'

export interface FormatPayload {
  json: string
  indent: IndentOption
}

export interface MinifyPayload {
  json: string
}

export interface ValidatePayload {
  json: string
}

export interface DiffPayload {
  jsonA: string
  jsonB: string
}

export interface StatisticsPayload {
  json: string
}

export interface SortPayload {
  json: string
  recursive?: boolean
}

export interface FlattenPayload {
  json: string
}

export interface UnflattenPayload {
  json: string
}

export interface JsonPathPayload {
  json: string
  query: string
}

export interface AssertionsPayload {
  json: string
  options?: AssertionOptions
}

export interface SchemaValidatePayload {
  data: unknown
  schema: unknown
}

export interface WorkerPayloadMap {
  format: FormatPayload
  minify: MinifyPayload
  validate: ValidatePayload
  diff: DiffPayload
  statistics: StatisticsPayload
  sort: SortPayload
  flatten: FlattenPayload
  unflatten: UnflattenPayload
  jsonpath: JsonPathPayload
  assertions: AssertionsPayload
  'schema-validate': SchemaValidatePayload
}

export interface WorkerResultMap {
  format: {
    success: boolean
    formatted?: string
    error?: string
    errorLine?: number
    errorColumn?: number
    snippet?: string
  }
  minify: {
    success: boolean
    minified?: string
    error?: string
    errorLine?: number
    errorColumn?: number
    snippet?: string
  }
  validate: JsonValidationResult
  diff: DiffResult
  statistics: JsonStats
  sort: { success: boolean; sorted?: string; error?: string }
  flatten: { success: boolean; flattened?: string; error?: string }
  unflatten: { success: boolean; unflattened?: string; error?: string }
  jsonpath: JsonPathResult
  assertions: GeneratedAssertions
  'schema-validate': SchemaValidationResult
}

export interface WorkerRequest<Op extends WorkerOperation = WorkerOperation> {
  id: string
  operation: Op
  payload: WorkerPayloadMap[Op]
}

export interface WorkerResponse<Op extends WorkerOperation = WorkerOperation> {
  id: string
  success: boolean
  result?: WorkerResultMap[Op]
  error?: string
}
