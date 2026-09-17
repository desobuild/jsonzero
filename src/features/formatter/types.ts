import type { IndentOption, JsonStats } from '@/lib/json'

export type ValidationState = 'idle' | 'valid' | 'invalid'
export type FormatMode = 'format' | 'minify' | 'validate'

export interface FormatterError {
  message: string
  line?: number
  column?: number
  snippet?: string
}

export interface FormatterState {
  input: string
  output: string
  indent: IndentOption
  lastOperation: FormatMode | null
  validationState: ValidationState
  error: FormatterError | null
  processingTimeMs: number | null
  inputStats: JsonStats
  outputStats: JsonStats
}

export interface FormatterActions {
  setInput: (value: string) => void
  setIndent: (indent: IndentOption) => void
  format: () => void
  minify: () => void
  validate: () => void
  clear: () => void
  loadFile: (file: File) => Promise<boolean>
  loadText: (text: string) => void
}
