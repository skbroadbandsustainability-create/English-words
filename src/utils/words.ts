import type { WordEntry } from '../types'

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export interface QuizQuestion {
  word: WordEntry
  choices: string[]
  answerIndex: number
}

function meaningOf(word: WordEntry): string {
  return word.meaningKo || word.definitionEn
}

/** 단어 목록으로 4지선다(가능한 만큼) 퀴즈 문제를 만든다. 오답 보기는 다른 단어의 뜻에서 가져온다. */
export function buildQuizQuestions(pool: WordEntry[], count: number): QuizQuestion[] {
  const shuffled = shuffle(pool)
  const picked = shuffled.slice(0, Math.min(count, shuffled.length))

  return picked.map((word) => {
    const correct = meaningOf(word)
    const otherMeanings = shuffle(
      pool.filter((w) => w.id !== word.id && meaningOf(w) !== correct).map(meaningOf),
    )
    const distractors = [...new Set(otherMeanings)].slice(0, 3)
    const choices = shuffle([correct, ...distractors])
    return { word, choices, answerIndex: choices.indexOf(correct) }
  })
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}
