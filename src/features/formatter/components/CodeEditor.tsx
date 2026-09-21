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
  type ReactNode,
} from 'react'
import { FileJson, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  tokenizeJson,
  buildHighlightSegments,
  type TokenType,
} from '@/lib/json/tokenizer'
import type { SearchMatch } from '@/lib/search/types'
import type { TokenizerDiffHighlight } from '@/lib/json/tokenizer'
import type { DiffKind } from '@/lib/json/diff'

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
  diffHighlights?: TokenizerDiffHighlight[]
  diffLines?: Record<number, DiffKind>
  onSelectionChange?: (start: number, end: number) => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
  emptyFooter?: ReactNode
}

// Token color styles — using theme-aware CSS custom properties
const TOKEN_CLASS_MAP: Record<TokenType, string> = {
  key: 'text-syntax-key font-medium',
  string: 'text-syntax-string',
  number: 'text-syntax-number',
  boolean: 'text-syntax-boolean',
  null: 'text-syntax-boolean',
  punctuation: 'text-text-muted',
  plain: 'text-text-primary',
}

export const MAX_HIGHLIGHT_BYTES = 150 * 1024 // 150 KB
export const MAX_HIGHLIGHT_LINES = 2500
export const VIRTUALIZE_GUTTER_LINE_THRESHOLD = 1000
const LINE_HEIGHT = 24

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
  diffHighlights = [],
  diffLines,
  onSelectionChange,
  textareaRef: externalTextareaRef,
  emptyFooter,
}: CodeEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [currentLine, setCurrentLine] = useState(1)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = externalTextareaRef || internalTextareaRef
  const gutterRef = useRef<HTMLDivElement>(null)
  const backdropRef = useRef<HTMLPreElement>(null)

  // Split lines for line numbers
  const lines = value.split('\n')
  const lineCount = Math.max(1, lines.length)

  // Check if document exceeds threshold for expensive DOM highlighting
  const isLargeDocument =
    value.length > MAX_HIGHLIGHT_BYTES || lineCount > MAX_HIGHLIGHT_LINES

  // Tokenize document and build match segments (bypassed in large document mode)
  const tokens = useMemo(() => {
    if (isLargeDocument) return []
    return tokenizeJson(value)
  }, [value, isLargeDocument])

  const segments = useMemo(() => {
    if (isLargeDocument) return []
    return buildHighlightSegments(
      value,
      tokens,
      searchMatches,
      currentMatchIndex,
      diffHighlights
    )
  }, [
    value,
    tokens,
    searchMatches,
    currentMatchIndex,
    diffHighlights,
    isLargeDocument,
  ])

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
    const height = e.currentTarget.clientHeight

    setScrollTop(top)
    if (height > 0) setViewportHeight(height)

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

  // Virtualized gutter calculation when line count exceeds threshold
  const shouldVirtualizeGutter = lineCount > VIRTUALIZE_GUTTER_LINE_THRESHOLD
  const visibleStartLine = shouldVirtualizeGutter
    ? Math.max(1, Math.floor(scrollTop / LINE_HEIGHT) - 5)
    : 1
  const visibleLineCount = shouldVirtualizeGutter
    ? Math.ceil(viewportHeight / LINE_HEIGHT) + 15
    : lineCount
  const visibleEndLine = shouldVirtualizeGutter
    ? Math.min(lineCount, visibleStartLine + visibleLineCount)
    : lineCount

  const gutterTopPadding = shouldVirtualizeGutter
    ? (visibleStartLine - 1) * LINE_HEIGHT
    : 0
  const gutterBottomPadding = shouldVirtualizeGutter
    ? (lineCount - visibleEndLine) * LINE_HEIGHT
    : 0

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
        className="flex w-14 shrink-0 select-none flex-col overflow-hidden border-r border-border bg-surface/40 py-3 pl-3.5 pr-3.5 text-right font-mono text-xs leading-6 text-text-muted"
      >
        {gutterTopPadding > 0 && (
          <div style={{ height: `${gutterTopPadding}px` }} aria-hidden="true" />
        )}
        {Array.from(
          { length: visibleEndLine - visibleStartLine + 1 },
          (_, i) => {
            const lineNum = visibleStartLine + i
            const isErrorOnLine = errorLine === lineNum
            const isCurrentLine = !readOnly && currentLine === lineNum
            const lineDiffKind = diffLines?.[lineNum]

            const diffGutterClass =
              lineDiffKind === 'changed'
                ? 'font-semibold text-diff-changed border-l-2 border-diff-changed pl-0.5'
                : lineDiffKind === 'added'
                  ? 'font-semibold text-diff-added border-l-2 border-diff-added pl-0.5'
                  : lineDiffKind === 'removed'
                    ? 'font-semibold text-diff-removed border-l-2 border-diff-removed pl-0.5'
                    : ''

            return (
              <span
                key={lineNum}
                className={cn(
                  'tabular-nums transition-colors',
                  lineDiffKind &&
                    !isErrorOnLine &&
                    !isCurrentLine &&
                    diffGutterClass,
                  isErrorOnLine && 'font-bold text-error',
                  isCurrentLine && !isErrorOnLine && 'font-semibold text-accent'
                )}
              >
                {lineNum}
              </span>
            )
          }
        )}
        {gutterBottomPadding > 0 && (
          <div
            style={{ height: `${gutterBottomPadding}px` }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Editor Area: Backdrop Layer + Active Textarea */}
      <div className="relative flex flex-1 overflow-hidden">
        {showEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto text-center text-text-muted">
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
            {emptyFooter}
          </div>
        ) : (
          <>
            {/* Syntax Highlighted & Match Highlighted Backdrop (Bypassed for large documents) */}
            {!isLargeDocument && (
              <pre
                ref={backdropRef}
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute inset-0 z-0 h-full w-full m-0 overflow-hidden py-3 px-4 font-mono text-xs sm:text-sm leading-6 select-none',
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
                              ? 'bg-match-current-bg text-accent-foreground font-semibold ring-1 ring-match-ring'
                              : 'bg-match-bg text-syntax-string ring-1 ring-match-ring'
                          )}
                        >
                          {seg.text}
                        </mark>
                      )
                    }

                    if (seg.diffKind) {
                      const diffClass =
                        seg.diffKind === 'changed'
                          ? 'bg-diff-changed/20 text-diff-changed font-medium ring-1 ring-diff-changed/40 rounded-xs px-0.5 py-0.2'
                          : seg.diffKind === 'added'
                            ? 'bg-diff-added/20 text-diff-added font-medium ring-1 ring-diff-added/40 rounded-xs px-0.5 py-0.2'
                            : 'bg-diff-removed/20 text-diff-removed font-medium ring-1 ring-diff-removed/40 rounded-xs px-0.5 py-0.2'

                      return (
                        <mark
                          key={idx}
                          data-testid={`diff-highlight-${seg.diffKind}`}
                          className={diffClass}
                        >
                          {seg.text}
                        </mark>
                      )
                    }

                    return (
                      <span
                        key={idx}
                        className={TOKEN_CLASS_MAP[seg.tokenType]}
                      >
                        {seg.text}
                      </span>
                    )
                  })}
                  {value.endsWith('\n') && ' '}
                </code>
              </pre>
            )}

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
                'relative z-10 h-full w-full resize-none border-0 bg-transparent py-3 px-4 font-mono text-xs sm:text-sm leading-6 focus:outline-none',
                wordWrap
                  ? 'whitespace-pre-wrap break-words overflow-x-hidden'
                  : 'whitespace-pre overflow-x-auto',
                isLargeDocument
                  ? 'text-text-primary caret-text-primary selection:bg-accent/30 selection:text-text-primary'
                  : 'text-transparent caret-text-primary selection:bg-accent/25 selection:text-transparent',
                readOnly && 'cursor-default'
              )}
              style={{ tabSize: 2 }}
            />

            {/* Subtle Large Document Mode Indicator */}
            {isLargeDocument && (
              <div
                data-testid="large-doc-indicator"
                className="pointer-events-none absolute bottom-2 right-4 z-20 rounded border border-border/80 bg-surface/90 px-2 py-0.5 text-3xs font-mono text-text-muted select-none backdrop-blur-xs shadow-xs"
                title="Full DOM syntax highlighting bypassed to maintain high performance for large JSON documents"
              >
                High-performance mode active (&gt;150 KB)
              </div>
            )}
          </>
        )}
      </div>

      {/* Drag & Drop Overlay */}
      {isDragging && !readOnly && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-accent bg-background/90 p-4 text-center backdrop-blur-sm animate-in fade-in duration-150">
          <UploadCloud className="h-10 w-10 text-accent" />
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
