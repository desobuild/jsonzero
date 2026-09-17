/**
 * JSONZero — Shared Types
 *
 * Types used across multiple features.
 * Keep this lean — feature-specific types belong in their feature directories.
 */

/** Active tool/feature identifier */
export type ToolId =
  | 'format'
  | 'minify'
  | 'validate'
  | 'search'
  | 'diff'
  | 'tree'
  | 'repair'
  | 'sort-keys'
  | 'flatten'
  | 'unflatten'
  | 'escape'
  | 'unescape'
  | 'table'
  | 'csv'
  | 'typescript'
  | 'dart'
  | 'json-schema'
  | 'assertions'
  | 'playwright'
  | 'expected-vs-actual'
  | 'mock-json'
