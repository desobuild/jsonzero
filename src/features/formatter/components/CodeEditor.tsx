import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ChangeEvent,
  type UIEvent,
  type DragEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { FileJson, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  tokenizeJson,
  buildHighlightSegments,
  type TokenType,
} from '@/lib/json/tokenizer'
import type { SearchMatch } from '@/lib/search/types'

export interface CodeEditorProps {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  emptyMessage?: string
  hasError?: boolean
  errorLine?: number
  onFileDrop?: (file: File) => void
  className?: string
  wordWrap?: boolean
  searchMatches?: SearchMatch[]
  currentMatchIndex?: number
  onSelectionChange?: (start: number, end: number) => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

// Token color styles consistent with JSONZero dark/light design system
const TOKEN_CLASS_MAP: Record<TokenType, string> = {
  key: 'text-[#B4C5FF] font-medium',
  string: 'text-[#68DBA9]',
  number: 'text-[#F0C674]',
  boolean: 'text-[#E06C75]',
  null: 'text-[#E06C75]',
  punctuation: 'text-text-muted',
  plain: 'text-text-primary',
}

export function CodeEditor({
  id,
  label,
  value,
  onChange,
  readOnly = false,
  placeholder = 'Paste JSON here...',
  emptyMessage,
  hasError = false,
  errorLine,
  onFileDrop,
  className,
  wordWrap = false,
  searchMatches = [],
  currentMatchIndex = -1,
  onSelectionChange,
  textareaRef: externalTextareaRef,
}: CodeEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [currentLine, setCurrentLine] = useState(1)
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = externalTextareaRef || internalTextareaRef
  const gutterRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLPreElement>(null)

  // Split lines for line numbers
  const lines = value.split('\n')
  const lineCount = Math.max(1, lines.length)

  // Tokenize document and build match segments
  const tokens = useMemo(() => tokenizeJson(value), [value])
  const segments = useMemo(
    () =>
      buildHighlightSegments(value, tokens, searchMatches, currentMatchIndex),
    [value, tokens, searchMatches, currentMatchIndex]
  )

  // Update current line number from cursor position
  const updateCursorLine = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const pos = textarea.selectionStart
    onSelectionChange?.(pos, textarea.selectionEnd)

    let line = 1
    for (let i = 0; i < pos; i++) {
      if (value[i] === '\n') {
        line++
      }
    }
    setCurrentLine(line)
  }, [value, textareaRef, onSelectionChange])

  // Synchronize scroll between textarea, backdrop, and line numbers gutter
  const handleScroll = useCallback((e: UIEvent<HTMLTextAreaElement>) => {
    const top = e.currentTarget.scrollTop
    const left = e.currentTarget.scrollLeft

    if (gutterRef.current) {
      gutterRef.current.scrollTop = top
    }
    if (backdropRef.current) {
      backdropRef.current.scrollTop = top
      backdropRef.current.scrollLeft = left
    }
  }, [])

  // Scroll current match into view and highlight selection in textarea
  useEffect(() => {
    if (
      currentMatchIndex >= 0 &&
      currentMatchIndex < searchMatches.length &&
      textareaRef.current
    ) {
      const match = searchMatches[currentMatchIndex]
      const textarea = textareaRef.current

      // Set native selection on the textarea
      try {
        textarea.setSelectionRange(match.start, match.end)
      } catch {
        // Ignored if not focusable
      }

      // Scroll to match line
      const lineHeight = 24
      const matchTop = (match.line - 1) * lineHeight
      const visibleTop = textarea.scrollTop
      const visibleBottom = visibleTop + textarea.clientHeight

      if (matchTop < visibleTop || matchTop > visibleBottom - lineHeight * 2) {
        const targetScroll = Math.max(
          0,
          matchTop - Math.floor(textarea.clientHeight / 2)
        )
        textarea.scrollTop = targetScroll
        if (gutterRef.current) gutterRef.current.scrollTop = targetScroll
        if (backdropRef.current) backdropRef.current.scrollTop = targetScroll
      }
    }
  }, [currentMatchIndex, searchMatches, textareaRef])

  // Handle Tab key in editable mode
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab' && !readOnly) {
        e.preventDefault()
        const textarea = e.currentTarget
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const currentVal = textarea.value

        const nextVal =
          currentVal.substring(0, start) + '  ' + currentVal.substring(end)
        onChange?.(nextVal)

        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart =
              textareaRef.current.selectionEnd = start + 2
            updateCursorLine()
          }
        })
      }
    },
    [readOnly, onChange, textareaRef, updateCursorLine]
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
      updateCursorLine()
    },
    [onChange, updateCursorLine]
  )

  // Drag & drop handlers
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (readOnly || !onFileDrop) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        onFileDrop(files[0])
      }
    },
    [readOnly, onFileDrop]
  )

  const showEmptyState = readOnly && !value && emptyMessage

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-1 overflow-hidden bg-background font-mono text-xs sm:text-sm select-text',
        hasError && 'ring-1 ring-error/50',
        className
      )}
    >
      {/* Line Numbers Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="flex w-11 shrink-0 select-none flex-col overflow-hidden border-r border-border bg-surface/40 py-2.5 pr-2.5 text-right font-mono text-xs leading-6 text-text-dim"
      >
        {Array.from({ length: lineCount }, (_, i) => {
          const lineNum = i + 1
          const isErrorOnLine = errorLine === lineNum
          const isCurrentLine = !readOnly && currentLine === lineNum

          return (
            <span
              key={lineNum}
              className={cn(
                'tabular-nums transition-colors',
                isErrorOnLine && 'font-bold text-error',
                isCurrentLine && !isErrorOnLine && 'font-semibold text-accent'
              )}
            >
              {lineNum}
            </span>
          )
        })}
      </div>

      {/* Editor Area: Backdrop Layer + Active Textarea */}
      <div className="relative flex flex-1 overflow-hidden">
        {showEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-text-muted">
            <FileJson className="mb-2 h-8 w-8 text-text-dim" />
            <p className="text-sm font-medium text-text-secondary">
              {emptyMessage}
            </p>
            <p className="mt-1 text-xs text-text-dim">
              Click Format on the toolbar or press{' '}
              <kbd className="rounded border border-border bg-surface-elevated px-1 py-0.5 text-3xs font-semibold text-text-primary">
                Ctrl+Shift+F
              </kbd>
            </p>
          </div>
        ) : (
          <>
            {/* Syntax Highlighted & Match Highlighted Backdrop */}
            <pre
              ref={backdropRef}
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute inset-0 z-0 h-full w-full m-0 overflow-hidden py-2.5 px-3 font-mono text-xs sm:text-sm leading-6 select-none',
                wordWrap
                  ? 'whitespace-pre-wrap break-words overflow-x-hidden'
                  : 'whitespace-pre overflow-x-auto'
              )}
              style={{ tabSize: 2 }}
            >
              <code>
                {segments.map((seg, idx) => {
                  if (seg.isMatch) {
                    return (
                      <mark
                        key={idx}
                        className={cn(
                          'rounded-xs px-0.5 py-0.2',
                          seg.isCurrentMatch
                            ? 'bg-[#68DBA9] text-[#003825] font-semibold ring-1 ring-[#85F8C4]'
                            : 'bg-[#68DBA9]/20 text-[#68DBA9] ring-1 ring-[#68DBA9]/40'
                        )}
                      >
                        {seg.text}
                      </mark>
                    )
                  }

                  return (
                    <span key={idx} className={TOKEN_CLASS_MAP[seg.tokenType]}>
                      {seg.text}
                    </span>
                  )
                })}
                {value.endsWith('\n') && ' '}
              </code>
            </pre>

            {/* Native Interactive Textarea Surface */}
            <textarea
              id={id}
              ref={textareaRef}
              aria-label={label}
              value={value}
              onChange={handleChange}
              onScroll={handleScroll}
              onKeyDown={handleKeyDown}
              onKeyUp={updateCursorLine}
              onClick={updateCursorLine}
              onSelect={updateCursorLine}
              readOnly={readOnly}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              placeholder={value ? undefined : placeholder}
              className={cn(
                'relative z-10 h-full w-full resize-none border-0 bg-transparent py-2.5 px-3 font-mono text-xs sm:text-sm leading-6 focus:outline-none',
                wordWrap
                  ? 'whitespace-pre-wrap break-words overflow-x-hidden'
                  : 'whitespace-pre overflow-x-auto',
                // Text is transparent so highlighted tokens show through, while caret and selection remain visible
                'text-transparent caret-text-primary selection:bg-accent/25 selection:text-transparent',
                readOnly && 'cursor-default'
              )}
              style={{ tabSize: 2 }}
            />
          </>
        )}
      </div>

      {/* Drag & Drop Overlay */}
      {isDragging && !readOnly && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-accent bg-background/90 p-4 text-center backdrop-blur-sm animate-in fade-in duration-150">
          <UploadCloud className="h-10 w-10 text-accent animate-bounce" />
          <p className="text-sm font-semibold text-accent">
            Drop JSON file here
          </p>
          <p className="text-xs text-text-muted">
            File will be read locally in your browser
          </p>
        </div>
      )}
    </div>
  )
}
