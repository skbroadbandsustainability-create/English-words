import type { AppState, Batch, QuizResult, WordEntry } from '../types'

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>()
  for (const item of a) map.set(item.id, item)
  for (const item of b) map.set(item.id, item)
  return [...map.values()].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
}

/**
 * 부모 폰/아이 태블릿처럼 여러 기기가 번갈아 접속할 때, 클라우드에서 받아온 내용으로
 * 그냥 덮어쓰면 이 기기에서 방금 추가했지만 아직 안 올라간 단어가 사라질 수 있다.
 * 그래서 지금 상태와 클라우드 상태를 id 기준으로 합쳐서(합집합) 둘 다 보존한다.
 */
export function mergeAppState(a: AppState, b: AppState): AppState {
  return {
    words: mergeById<WordEntry>(a.words, b.words),
    batches: mergeById<Batch>(a.batches, b.batches),
    quizResults: mergeById<QuizResult>(a.quizResults, b.quizResults),
    studyDates: [...new Set([...a.studyDates, ...b.studyDates])].sort(),
    kidName: b.kidName || a.kidName,
  }
}
