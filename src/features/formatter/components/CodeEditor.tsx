import {
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  type UIEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react'
import { FileJson, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}: CodeEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  // Split lines for line numbers
  const lines = value.split('\n')
  const lineCount = Math.max(1, lines.length)

  // Synchronize scroll between textarea and line numbers gutter
  const handleScroll = useCallback((e: UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.currentTarget.scrollTop
    }
  }, [])

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
          }
        })
      }
    },
    [readOnly, onChange]
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    },
    [onChange]
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
        'relative flex flex-1 overflow-hidden bg-background font-mono text-xs sm:text-sm',
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
          return (
            <span
              key={lineNum}
              className={cn(
                'tabular-nums transition-colors',
                isErrorOnLine && 'font-bold text-error'
              )}
            >
              {lineNum}
            </span>
          )
        })}
      </div>

      {/* Editor Content Area */}
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
          <textarea
            id={id}
            ref={textareaRef}
            aria-label={label}
            value={value}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            placeholder={placeholder}
            className={cn(
              'h-full w-full resize-none bg-transparent py-2.5 px-3 font-mono leading-6 text-text-primary placeholder:text-text-dim focus:outline-none overflow-auto whitespace-pre',
              readOnly && 'cursor-default selection:bg-accent/20'
            )}
          />
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
