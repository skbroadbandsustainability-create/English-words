function mergeById(a: unknown, b: unknown): unknown[] {
  const map = new Map<string, unknown>()
  for (const item of Array.isArray(a) ? a : []) {
    const id = (item as { id?: unknown } | null)?.id
    if (typeof id === 'string') map.set(id, item)
  }
  for (const item of Array.isArray(b) ? b : []) {
    const id = (item as { id?: unknown } | null)?.id
    if (typeof id === 'string') map.set(id, item)
  }
  return [...map.values()].sort((x, y) => {
    const xi = (x as { id: string }).id
    const yi = (y as { id: string }).id
    return xi < yi ? -1 : xi > yi ? 1 : 0
  })
}

/**
 * 부모 폰/아이 태블릿처럼 여러 기기가 번갈아 접속해서 각자 단어를 추가하는 경우, 그냥
 * 마지막으로 저장한 쪽이 통째로 덮어쓰면 다른 기기가 그 사이에 추가한 단어가 사라진다.
 * 그래서 저장되어 있던 데이터와 새로 올라온 데이터를 id 기준으로 합쳐서(둘 다의 합집합)
 * 저장한다. 같은 id가 둘 다에 있으면 새로 올라온 쪽(b) 내용으로 갱신한다.
 */
export function mergeAppState(a: unknown, b: unknown): Record<string, unknown> {
  const sa = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>
  const sb = (b && typeof b === 'object' ? b : {}) as Record<string, unknown>

  const studyDates = [
    ...new Set([
      ...((Array.isArray(sa.studyDates) ? sa.studyDates : []) as unknown[]).filter(
        (x): x is string => typeof x === 'string',
      ),
      ...((Array.isArray(sb.studyDates) ? sb.studyDates : []) as unknown[]).filter(
        (x): x is string => typeof x === 'string',
      ),
    ]),
  ].sort()

  return {
    words: mergeById(sa.words, sb.words),
    batches: mergeById(sa.batches, sb.batches),
    quizResults: mergeById(sa.quizResults, sb.quizResults),
    studyDates,
    kidName: (typeof sb.kidName === 'string' && sb.kidName) || (typeof sa.kidName === 'string' && sa.kidName) || undefined,
  }
}
