import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_STATE, STORAGE_KEY } from '../types'
import type { AppState, Batch, QuizResult, WordEntry } from '../types'

type Action =
  | { type: 'ADD_BATCH'; batch: Batch; words: WordEntry[] }
  | { type: 'UPDATE_WORD'; word: WordEntry }
  | { type: 'DELETE_WORD'; id: string }
  | { type: 'BUMP_FAMILIARITY'; id: string; delta: number }
  | { type: 'RECORD_QUIZ_RESULT'; result: QuizResult }
  | { type: 'MARK_STUDIED_TODAY' }
  | { type: 'SET_KID_NAME'; name: string }
  | { type: 'IMPORT_STATE'; state: AppState }

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_STATE, ...parsed }
  } catch {
    return DEFAULT_STATE
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_BATCH':
      return {
        ...state,
        words: [...state.words, ...action.words],
        batches: [...state.batches, action.batch],
      }
    case 'UPDATE_WORD':
      return { ...state, words: state.words.map((w) => (w.id === action.word.id ? action.word : w)) }
    case 'DELETE_WORD':
      return {
        ...state,
        words: state.words.filter((w) => w.id !== action.id),
        batches: state.batches.map((b) => ({ ...b, wordIds: b.wordIds.filter((id) => id !== action.id) })),
      }
    case 'BUMP_FAMILIARITY':
      return {
        ...state,
        words: state.words.map((w) =>
          w.id === action.id ? { ...w, familiarity: Math.max(0, w.familiarity + action.delta) } : w,
        ),
      }
    case 'RECORD_QUIZ_RESULT':
      return { ...state, quizResults: [...state.quizResults, action.result] }
    case 'MARK_STUDIED_TODAY': {
      const today = todayKey()
      if (state.studyDates.includes(today)) return state
      return { ...state, studyDates: [...state.studyDates, today] }
    }
    case 'SET_KID_NAME':
      return { ...state, kidName: action.name }
    case 'IMPORT_STATE':
      return action.state
    default:
      return state
  }
}

interface WordContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const WordContext = createContext<WordContextValue | null>(null)

export function WordProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <WordContext.Provider value={value}>{children}</WordContext.Provider>
}

export function useWords() {
  const ctx = useContext(WordContext)
  if (!ctx) throw new Error('useWords는 WordProvider 안에서 사용해야 해요')
  return ctx
}

export function useLatestBatch(): Batch | undefined {
  const { state } = useWords()
  return state.batches.length > 0 ? state.batches[state.batches.length - 1] : undefined
}

/** 연속 학습일(streak)을 studyDates로부터 계산한다. 오늘 또는 어제까지 이어져 있어야 streak으로 친다. */
export function calcStreak(studyDates: string[]): number {
  if (studyDates.length === 0) return 0
  const dates = new Set(studyDates)
  const cursor = new Date()
  // 오늘 기록이 없으면 어제부터 셀 수 있게, 오늘이 없을 때는 어제 기준으로 시작
  if (!dates.has(todayKey())) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (true) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
    if (!dates.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
