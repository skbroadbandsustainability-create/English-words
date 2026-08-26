import type { QuizDirection, WordEntry } from '../types'

export type { QuizDirection }

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 예문 안에서 그 단어를 찾아 빈칸으로 바꾼다. 단어가 예문에 없으면 null(사용 불가). */
export function blankOutSentence(sentence: string, word: string): string | null {
  const re = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i')
  if (!re.test(sentence)) return null
  return sentence.replace(re, '(　　　　)')
}

/** 빈칸 채우기 문제로 쓸 수 있는(예문에 단어가 정확히 들어있는) 단어인지 확인한다. */
export function hasUsableExampleSentence(word: WordEntry): boolean {
  return Boolean(word.exampleSentence && blankOutSentence(word.exampleSentence, word.word))
}

/**
 * 단어 목록으로 4지선다(가능한 만큼) 퀴즈 문제를 만든다.
 * - 'wordToMeaning': 단어를 보여주고 뜻을 고른다.
 * - 'meaningToWord': 뜻을 보여주고 단어를 고른다.
 * - 'fillBlank': 단어가 빈칸으로 빠진 예문을 보여주고 알맞은 단어를 고른다.
 *   (exampleSentence가 없거나 단어가 그 안에 없는 항목은 미리 걸러서 넘겨줘야 한다.)
 */
export function buildQuizQuestions(
  pool: WordEntry[],
  count: number,
  direction: QuizDirection = 'wordToMeaning',
): QuizQuestion[] {
  const shuffled = shuffle(pool)
  const picked = shuffled.slice(0, Math.min(count, shuffled.length))

  return picked.map((word) => {
    if (direction === 'fillBlank') {
      const correct = word.word
      const prompt = (word.exampleSentence && blankOutSentence(word.exampleSentence, word.word)) || word.word
      const otherWords = shuffle(pool.filter((w) => w.id !== word.id && w.word !== correct).map((w) => w.word))
      const distractors = [...new Set(otherWords)].slice(0, 3)
      const choices = shuffle([correct, ...distractors])
      return { word, prompt, choices, answerIndex: choices.indexOf(correct), direction }
    }

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
