import type { WordEntry } from '../types'

// 학습 단어로는 의미가 약한 아주 흔한 기능어들은 사진에서 추출할 때 기본적으로 걸러낸다.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'to', 'of', 'in', 'on', 'at', 'and', 'or', 'but', 'so', 'for', 'if', 'be',
  'am', 'are', 'was', 'were', 'do', 'does', 'did', 'has', 'have', 'had', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'our', 'their', 'with', 'as', 'by',
  'from', 'not', 'no', 'yes', 'can', 'will', 'just', 'out', 'up', 'down', 'into', 'over', 'under', 'than',
  'then', 'there', 'here', 'when', 'what', 'who', 'how',
])

/** OCR로 읽은 텍스트에서 학습할 만한 영단어 후보를 뽑아낸다(중복 제거, 흔한 기능어 제외). */
export function extractCandidateWords(text: string, maxCount = 40): string[] {
  const matches = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? []
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of matches) {
    const word = raw.toLowerCase()
    if (word.length < 2 || word.length > 20) continue
    if (STOPWORDS.has(word)) continue
    if (seen.has(word)) continue
    seen.add(word)
    result.push(word)
    if (result.length >= maxCount) break
  }
  return result
}

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
