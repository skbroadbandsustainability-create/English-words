/**
 * 영어 단어의 흔한 변형(복수형/과거형/현재분사/비교급 등)을 사전형(기본형)으로
 * 되돌릴 만한 후보들을 규칙 기반으로 만든다. 무료 사전 API는 사전형만 알고 있는
 * 경우가 많아서, 원래 단어로 못 찾으면 이 후보들을 순서대로 시도해본다.
 * 완벽하지 않지만(불규칙 변화는 못 잡음) 흔한 경우는 꽤 커버한다.
 */
export function lemmaCandidates(word: string): string[] {
  const w = word.toLowerCase()
  const candidates: string[] = []

  const add = (candidate: string) => {
    if (candidate.length >= 2 && candidate !== w && !candidates.includes(candidate)) {
      candidates.push(candidate)
    }
  }

  // 복수형: babies -> baby, boxes -> box, cats -> cat
  if (w.endsWith('ies')) add(w.slice(0, -3) + 'y')
  if (w.endsWith('es')) add(w.slice(0, -2))
  if (w.endsWith('s') && !w.endsWith('ss')) add(w.slice(0, -1))

  // 과거형: studied -> study, liked -> like, walked -> walk
  if (w.endsWith('ied')) add(w.slice(0, -3) + 'y')
  if (w.endsWith('ed')) {
    add(w.slice(0, -2))
    add(w.slice(0, -1))
  }

  // 현재분사: making -> make, running -> run, walking -> walk
  if (w.endsWith('ing')) {
    const stem = w.slice(0, -3)
    add(stem)
    add(stem + 'e')
    if (stem.length > 2 && stem[stem.length - 1] === stem[stem.length - 2]) {
      add(stem.slice(0, -1))
    }
  }

  // 비교급/최상급: happier/happiest -> happy, taller/tallest -> tall
  if (w.endsWith('iest')) add(w.slice(0, -4) + 'y')
  if (w.endsWith('ier')) add(w.slice(0, -3) + 'y')
  if (w.endsWith('est')) add(w.slice(0, -3))
  if (w.endsWith('er')) add(w.slice(0, -2))

  return candidates
}
