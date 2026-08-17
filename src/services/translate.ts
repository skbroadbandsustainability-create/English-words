/**
 * 무료 번역 API(MyMemory)로 아주 간단한 한글 뜻을 보조로 가져온다.
 * 품질은 기계번역 수준이라 참고용으로만 쓴다. 실패하면 조용히 undefined를 돌려준다.
 */
export async function fetchKoreanGloss(word: string): Promise<string | undefined> {
  const clean = word.trim()
  if (!clean) return undefined

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|ko`,
    )
    if (!res.ok) return undefined
    const data = await res.json()
    const text: string | undefined = data?.responseData?.translatedText
    if (!text) return undefined
    // 번역이 안 되면 원문을 그대로 돌려주는 경우가 있어, 그럴 땐 버린다.
    if (text.trim().toLowerCase() === clean.toLowerCase()) return undefined
    return text.trim()
  } catch {
    return undefined
  }
}
