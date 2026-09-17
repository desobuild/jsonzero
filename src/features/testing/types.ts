/**
 * JSONZero — Testing / Developer Tools Types
 */

import type {
  AssertionItem,
  AssertionOptions,
  AssertionStyle,
  GeneratedAssertions,
} from '@/lib/json/assertions'
import type { MockJsonOptions } from '@/lib/json/mock'
import type {
  SchemaValidationResult,
  SchemaValidationError,
} from '@/lib/json/schema-validator'
import type { DiffResult } from '@/lib/json/diff'

export type TestingType =
  | 'schema-validation'
  | 'api-assertions'
  | 'playwright-assertions'
  | 'generic-assertions'
  | 'mock-json'
  | 'expected-actual'
  | 'diff-assertions'

export type TestingCategory = 'VALIDATE' | 'ASSERTIONS' | 'MOCK' | 'WORKFLOW'

export interface TestingToolItem {
  id: TestingType
  label: string
  shortLabel: string
  category: TestingCategory
  description: string
}

export type MobileTestingTab =
  'input' | 'schema' | 'preview' | 'actual' | 'diff'

export interface TestingOptionsState {
  assertions: AssertionOptions
  mock: MockJsonOptions
}

export {
  type AssertionItem,
  type AssertionOptions,
  type AssertionStyle,
  type GeneratedAssertions,
  type MockJsonOptions,
  type SchemaValidationResult,
  type SchemaValidationError,
  type DiffResult,
}
