import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_STATE, STORAGE_KEY } from '../types'
import type { AppState, Batch, QuizResult, WordEntry } from '../types'
import { fetchCloudState, pushCloudState } from '../services/sync'

const SYNC_PUSH_DEBOUNCE_MS = 1500
const SYNC_POLL_INTERVAL_MS = 20000

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

/**
 * 예전 버전에서 저장된 테스트 기록(scope/direction 필드가 없던 시절 등)을 읽어와도
 * 화면이 죽지 않도록, 필드가 빠져있으면 안전한 기본값으로 채워 넣는다.
 */
function normalizeQuizResult(raw: unknown): QuizResult | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (
    typeof r.id !== 'string' ||
    typeof r.total !== 'number' ||
    typeof r.correct !== 'number' ||
    typeof r.takenAt !== 'string'
  ) {
    return null
  }
  return {
    id: r.id,
    scope: typeof r.scope === 'string' ? r.scope : 'all',
    direction:
      r.direction === 'meaningToWord' || r.direction === 'fillBlank' ? r.direction : 'wordToMeaning',
    total: r.total,
    correct: r.correct,
    takenAt: r.takenAt,
    missedWordIds: Array.isArray(r.missedWordIds)
      ? r.missedWordIds.filter((x): x is string => typeof x === 'string')
      : [],
  }
}

/**
 * localStorage든 클라우드든, 어디서 온 상태 데이터든 이 함수를 거쳐야 안전하다.
 * 예전 버전 형식이거나 필드가 빠져있어도 기본값으로 채워서, 화면이 통째로 죽는 걸 막는다.
 */
function normalizeAppState(parsed: unknown): AppState {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return DEFAULT_STATE
  const p = parsed as Record<string, unknown>
  return {
    words: Array.isArray(p.words) ? (p.words as WordEntry[]) : [],
    batches: Array.isArray(p.batches) ? (p.batches as Batch[]) : [],
    studyDates: Array.isArray(p.studyDates) ? (p.studyDates as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    kidName: typeof p.kidName === 'string' ? p.kidName : DEFAULT_STATE.kidName,
    quizResults: Array.isArray(p.quizResults)
      ? (p.quizResults as unknown[]).map(normalizeQuizResult).filter((r): r is QuizResult => r !== null)
      : [],
  }
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return normalizeAppState(JSON.parse(raw))
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

  // 클라우드 동기화: 마지막으로 이 기기가 알고 있는(올렸거나 받아온) 버전의 시각.
  // 이거보다 새 버전이 클라우드에 있을 때만 받아와서 덮어쓴다.
  const lastKnownUpdatedAt = useRef('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const updatedAt = new Date().toISOString()
      lastKnownUpdatedAt.current = updatedAt
      void pushCloudState(state, updatedAt)
    }, SYNC_PUSH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [state])

  const pullFromCloud = useCallback(async () => {
    try {
      const cloud = await fetchCloudState()
      if (cloud && cloud.updatedAt > lastKnownUpdatedAt.current) {
        lastKnownUpdatedAt.current = cloud.updatedAt
        dispatch({ type: 'IMPORT_STATE', state: normalizeAppState(cloud.state) })
      }
    } catch {
      // 클라우드에서 받아오다 문제가 생겨도 화면은 지금 상태 그대로 유지한다.
    }
  }, [])

  useEffect(() => {
    void pullFromCloud()
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pullFromCloud()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', pullFromCloud)
    const interval = window.setInterval(pullFromCloud, SYNC_POLL_INTERVAL_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', pullFromCloud)
      window.clearInterval(interval)
    }
  }, [pullFromCloud])

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
