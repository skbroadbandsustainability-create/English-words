export interface WordEntry {
  id: string
  word: string
  phonetic?: string
  audioUrl?: string
  partOfSpeech?: string
  definitionEn: string // 사전 API 정의 중 가장 짧고 쉬운 것 하나
  meaningKo?: string // 무료 번역 API가 만들어준 간단한 한글 뜻 (실패하면 없음)
  synonyms: string[]
  antonyms: string[]
  batchId: string
  addedAt: string // ISO timestamp
  source: 'photo' | 'manual'
  familiarity: number // 카드에서 "알아요"를 누른 횟수
}

export interface Batch {
  id: string
  createdAt: string
  label: string // 예: "8/17에 등록한 단어"
  wordIds: string[]
}

export interface QuizResult {
  id: string
  scope: string // 'all' 또는 시험 본 날짜(YYYY-MM-DD)
  total: number
  correct: number
  takenAt: string
  missedWordIds: string[]
}

export interface AppState {
  words: WordEntry[]
  batches: Batch[]
  quizResults: QuizResult[]
  kidName: string
  studyDates: string[] // 학습(카드/테스트)한 날짜(YYYY-MM-DD) 기록, 연속 학습일 계산용
}

export const STORAGE_KEY = 'english-words-v1'

export const DEFAULT_STATE: AppState = {
  words: [],
  batches: [],
  quizResults: [],
  kidName: '우리 아이',
  studyDates: [],
}
