export interface SearchOptions {
  matchCase: boolean
  wholeWord: boolean
}

export interface SearchMatch {
  start: number
  end: number
  line: number
  column: number
  text: string
}

export interface SearchState {
  query: string
  replaceText: string
  options: SearchOptions
  matches: SearchMatch[]
  currentMatchIndex: number
  isOpen: boolean
  isReplaceOpen: boolean
}

export interface ReplaceResult {
  newText: string
  count: number
}
