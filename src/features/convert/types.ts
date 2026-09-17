/**
 * JSONZero — JSON Convert Types
 */

import type { TableData } from '@/lib/json/table'

export type ConvertType =
  'table' | 'csv' | 'typescript' | 'dart' | 'json-schema'

export type ConvertGroup = 'DATA' | 'CODE' | 'SCHEMA'

export interface ConvertDefinition {
  id: ConvertType
  label: string
  group: ConvertGroup
  description: string
  extension: string
  mimeType: string
  defaultFileName: string
}

export interface ConvertOptionsState {
  csvDelimiter: ',' | '\t' | ';'
  csvIncludeHeader: boolean
  tsRootName: string
  dartRootName: string
}

export interface ConvertExecutionResult {
  success: boolean
  result?: string
  tableData?: TableData
  error?: string
  errorLine?: number
  errorColumn?: number
}
