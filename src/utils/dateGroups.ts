import type { WordEntry } from '../types'

export function dateKeyOf(word: WordEntry): string {
  return word.addedAt.slice(0, 10) // YYYY-MM-DD
}

export interface DateGroup {
  date: string
  words: WordEntry[]
}

/** 단어들을 등록한 날짜(YYYY-MM-DD)별로 묶고, 최근 날짜가 먼저 오도록 정렬한다. */
export function groupWordsByDate(words: WordEntry[]): DateGroup[] {
  const map = new Map<string, WordEntry[]>()
  for (const w of words) {
    const key = dateKeyOf(w)
    const list = map.get(key) ?? []
    list.push(w)
    map.set(key, list)
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, groupWords]) => ({ date, words: groupWords }))
}

/** "2026-08-26" -> "8/26". 형식이 아닌 값이 들어와도 죽지 않고 그대로 돌려준다. */
export function formatDateShort(dateKey: string): string {
  const parts = dateKey?.split('-') ?? []
  if (parts.length < 3) return dateKey ?? ''
  const [, month, day] = parts
  return `${Number(month)}/${Number(day)}`
}
