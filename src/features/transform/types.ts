/**
 * JSONZero — JSON Transform Types
 */

export type TransformType =
  | 'sort-keys'
  | 'sort-recursive'
  | 'flatten'
  | 'unflatten'
  | 'escape'
  | 'unescape'

export type TransformGroup = 'SORT' | 'STRUCTURE' | 'ESCAPE'

export interface TransformDefinition {
  id: TransformType
  label: string
  group: TransformGroup
  description: string
  expectsValidJson: boolean
}

export interface TransformState {
  input: string
  selectedTransform: TransformType
  preview: string
  error: string | null
  isEscapedJsonDetected: boolean
  wordWrap: boolean
  activeMobileTab: 'input' | 'preview'
}
