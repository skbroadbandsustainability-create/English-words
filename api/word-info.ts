import { getGeminiClient, GEMINI_MODEL, SINGLE_WORD_SCHEMA } from './_lib/gemini.js'
import type { AiWord } from './_lib/gemini.js'
import type { ApiRequest, ApiResponse } from './_lib/types.js'

interface RequestBody {
  word?: string
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 가능해요.' })
    return
  }

  const { word } = (req.body ?? {}) as RequestBody
  const clean = word?.trim()
  if (!clean) {
    res.status(400).json({ error: '단어가 없어요.' })
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
              text: `영어 단어 "${clean}"의 품사, 초등학생 눈높이의 쉬운 영어 설명, 쉬운 한글 뜻, 유의어, 반의어를 정리해줘. 실제 영어 단어가 아니면 word 필드에 입력값을 그대로 담고 definitionEn에 "사전에 없는 단어예요"라고 적어줘.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: SINGLE_WORD_SCHEMA,
      },
    })

    const result = JSON.parse(response.text ?? 'null') as AiWord | null
    res.status(200).json({ word: result })
  } catch (err) {
    console.error('word-info failed', err)
    const detail = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: '단어를 찾는 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.', detail })
  }
}
