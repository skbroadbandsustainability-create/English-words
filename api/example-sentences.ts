import { getGeminiClient, GEMINI_MODEL, SENTENCES_SCHEMA } from './_lib/gemini.js'
import type { AiSentence } from './_lib/gemini.js'
import type { ApiRequest, ApiResponse } from './_lib/types.js'

export const config = { maxDuration: 30 }

interface RequestBody {
  words?: string[]
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 가능해요.' })
    return
  }

  const { words } = (req.body ?? {}) as RequestBody
  const clean = Array.isArray(words)
    ? [...new Set(words.map((w) => (typeof w === 'string' ? w.trim() : '')).filter(Boolean))].slice(0, 25)
    : []
  if (clean.length === 0) {
    res.status(400).json({ error: '단어 목록이 없어요.' })
    return
  }

  try {
    const ai = getGeminiClient()
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                '다음 영어 단어들 각각에 대해, 빈칸 채우기 문제에 쓸 예문을 하나씩 만들어줘.',
                '초등학생이 읽기 쉬운 문장으로, 그 단어가 자연스럽게 들어가야 해.',
                '문장 안에는 그 단어를 입력받은 철자 그대로(복수형/과거형 등으로 바꾸지 말고) 정확히 포함시켜줘.',
                `단어 목록: ${clean.join(', ')}`,
              ].join(' '),
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: SENTENCES_SCHEMA,
      },
    })

    const parsed = JSON.parse(response.text ?? '{}') as { sentences?: AiSentence[] }
    const sentences: Record<string, string> = {}
    for (const item of parsed.sentences ?? []) {
      if (item.word && item.sentence) sentences[item.word] = item.sentence
    }
    res.status(200).json({ sentences })
  } catch (err) {
    console.error('example-sentences failed', err)
    const detail = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: '예문을 만드는 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.', detail })
  }
}
