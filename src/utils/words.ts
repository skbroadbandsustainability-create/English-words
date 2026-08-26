import type { WordEntry } from '../types'

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export type QuizDirection = 'wordToMeaning' | 'meaningToWord'

export interface QuizQuestion {
  word: WordEntry
  prompt: string // 화면 위쪽에 보여줄 문제(단어 또는 뜻)
  choices: string[]
  answerIndex: number
  direction: QuizDirection
}

function meaningOf(word: WordEntry): string {
  return word.meaningKo || word.definitionEn
}

/**
 * 단어 목록으로 4지선다(가능한 만큼) 퀴즈 문제를 만든다.
 * direction이 'wordToMeaning'이면 단어를 보여주고 뜻을 고르고,
 * 'meaningToWord'면 뜻을 보여주고 단어를 고른다.
 */
export function buildQuizQuestions(
  pool: WordEntry[],
  count: number,
  direction: QuizDirection = 'wordToMeaning',
): QuizQuestion[] {
  const shuffled = shuffle(pool)
  const picked = shuffled.slice(0, Math.min(count, shuffled.length))

  return picked.map((word) => {
    if (direction === 'meaningToWord') {
      const correct = word.word
      const otherWords = shuffle(pool.filter((w) => w.id !== word.id && w.word !== correct).map((w) => w.word))
      const distractors = [...new Set(otherWords)].slice(0, 3)
      const choices = shuffle([correct, ...distractors])
      return { word, prompt: meaningOf(word), choices, answerIndex: choices.indexOf(correct), direction }
    }

    const correct = meaningOf(word)
    const otherMeanings = shuffle(
      pool.filter((w) => w.id !== word.id && meaningOf(w) !== correct).map(meaningOf),
    )
    const distractors = [...new Set(otherMeanings)].slice(0, 3)
    const choices = shuffle([correct, ...distractors])
    return { word, prompt: word.word, choices, answerIndex: choices.indexOf(correct), direction }
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
