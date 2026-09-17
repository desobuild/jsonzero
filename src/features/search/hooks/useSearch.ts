import { useState, useCallback, useMemo, type RefObject } from 'react'
import {
  findMatches,
  getNextMatchIndex,
  getPrevMatchIndex,
  replaceCurrent,
  replaceAll,
  type SearchOptions,
  type SearchMatch,
} from '@/lib/search'

export interface UseSearchOptions {
  text: string
  setText: (newText: string) => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
  onToast?: (message: string, type: 'info' | 'success' | 'error') => void
}

export function useSearch({
  text,
  setText,
  textareaRef,
  onToast,
}: UseSearchOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [isReplaceOpen, setIsReplaceOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [options, setOptions] = useState<SearchOptions>({
    matchCase: false,
    wholeWord: false,
  })
  const [matchIndexState, setMatchIndexState] = useState(0)

  // Compute matches whenever text, query, or options change
  const matches = useMemo(
    () => findMatches(text, query, options),
    [text, query, options]
  )

  // Derived current match index: immediately valid on every render
  const currentMatchIndex = useMemo(() => {
    if (matches.length === 0) return -1
    if (matchIndexState < 0 || matchIndexState >= matches.length) return 0
    return matchIndexState
  }, [matches.length, matchIndexState])

  const openSearch = useCallback((opts?: { replace?: boolean }) => {
    setIsOpen(true)
    if (opts?.replace) {
      setIsReplaceOpen(true)
    }
  }, [])

  const closeSearch = useCallback(() => {
    setIsOpen(false)
    // Return focus to the editor textarea
    requestAnimationFrame(() => {
      textareaRef?.current?.focus()
    })
  }, [textareaRef])

  const toggleReplace = useCallback(() => {
    setIsReplaceOpen((prev) => !prev)
  }, [])

  const toggleMatchCase = useCallback(() => {
    setOptions((prev) => ({ ...prev, matchCase: !prev.matchCase }))
  }, [])

  const toggleWholeWord = useCallback(() => {
    setOptions((prev) => ({ ...prev, wholeWord: !prev.wholeWord }))
  }, [])

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return
    setMatchIndexState((prev) => getNextMatchIndex(prev, matches.length))
  }, [matches.length])

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return
    setMatchIndexState((prev) => getPrevMatchIndex(prev, matches.length))
  }, [matches.length])

  const handleReplaceCurrent = useCallback(() => {
    if (
      matches.length === 0 ||
      currentMatchIndex < 0 ||
      currentMatchIndex >= matches.length
    ) {
      return
    }

    const matchToReplace = matches[currentMatchIndex]
    const { newText } = replaceCurrent(text, matchToReplace, replaceText)
    setText(newText)
  }, [matches, currentMatchIndex, text, replaceText, setText])

  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0) return

    const { newText, count } = replaceAll(text, matches, replaceText)
    setText(newText)

    onToast?.(`${count} replacement${count === 1 ? '' : 's'}`, 'success')
  }, [matches, text, replaceText, setText, onToast])

  return {
    isOpen,
    isReplaceOpen,
    query,
    replaceText,
    options,
    matches,
    currentMatchIndex,
    currentMatch: matches[currentMatchIndex] as SearchMatch | undefined,
    openSearch,
    closeSearch,
    toggleReplace,
    setQuery,
    setReplaceText,
    toggleMatchCase,
    toggleWholeWord,
    nextMatch,
    prevMatch,
    replaceCurrent: handleReplaceCurrent,
    replaceAll: handleReplaceAll,
  }
}
