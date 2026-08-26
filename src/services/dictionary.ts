import { lemmaCandidates } from '../utils/lemmatize'

export interface DictionaryResult {
  word: string
  phonetic?: string
  audioUrl?: string
  partOfSpeech?: string
  definitionEn: string
  synonyms: string[]
  antonyms: string[]
}

interface ApiPhonetic {
  text?: string
  audio?: string
}

interface ApiDefinition {
  definition: string
  synonyms?: string[]
  antonyms?: string[]
}

interface ApiMeaning {
  partOfSpeech: string
  definitions: ApiDefinition[]
  synonyms?: string[]
  antonyms?: string[]
}

interface ApiEntry {
  word: string
  phonetic?: string
  phonetics?: ApiPhonetic[]
  meanings: ApiMeaning[]
}

/**
 * 무료 사전 API(dictionaryapi.dev)에서 단어 뜻/발음/유의어/반의어를 가져온다.
 * 사전에 없는 단어는 null을 돌려준다(고유명사, 오타 등).
 */
export async function fetchWordInfo(word: string): Promise<DictionaryResult | null> {
  const clean = word.trim().toLowerCase()
  if (!clean) return null

  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data: ApiEntry[] = await res.json()
    const entry = data[0]
    if (!entry) return null

    const phoneticWithAudio = entry.phonetics?.find((p) => p.audio)
    const phoneticAny = phoneticWithAudio ?? entry.phonetics?.find((p) => p.text)
    const phonetic = entry.phonetic ?? phoneticAny?.text

    // 여러 뜻 중, 아이가 읽기 쉬운(가장 짧은) 정의 하나를 대표 뜻으로 고른다.
    let bestDef = ''
    let bestPos = ''
    const synonyms = new Set<string>()
    const antonyms = new Set<string>()

    for (const meaning of entry.meanings ?? []) {
      for (const s of meaning.synonyms ?? []) synonyms.add(s)
      for (const a of meaning.antonyms ?? []) antonyms.add(a)
      for (const def of meaning.definitions ?? []) {
        for (const s of def.synonyms ?? []) synonyms.add(s)
        for (const a of def.antonyms ?? []) antonyms.add(a)
        if (!bestDef || def.definition.length < bestDef.length) {
          bestDef = def.definition
          bestPos = meaning.partOfSpeech
        }
      }
    }

    if (!bestDef) return null

    return {
      word: entry.word || clean,
      phonetic,
      audioUrl: phoneticWithAudio?.audio ? normalizeAudioUrl(phoneticWithAudio.audio) : undefined,
      partOfSpeech: bestPos || undefined,
      definitionEn: bestDef,
      synonyms: [...synonyms].slice(0, 6),
      antonyms: [...antonyms].slice(0, 6),
    }
  } catch {
    return null
  }
}

/**
 * 원래 단어로 사전에 없으면, 복수형/과거형 등을 원형으로 되돌린 후보들로 다시 시도해본다.
 * 후보로 찾았을 때는 결과의 word 필드가 원형으로 바뀌어 있으니, 그걸 저장용 단어로 쓰면 된다.
 */
export async function fetchWordInfoSmart(word: string): Promise<DictionaryResult | null> {
  const direct = await fetchWordInfo(word)
  if (direct) return direct

  for (const candidate of lemmaCandidates(word)) {
    const result = await fetchWordInfo(candidate)
    if (result) return result
  }
  return null
}

function normalizeAudioUrl(url: string): string {
  if (url.startsWith('http')) return url
  if (url.startsWith('//')) return `https:${url}`
  return `https://${url}`
}
