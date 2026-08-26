import { getGeminiClient, GEMINI_MODEL, WORDS_LIST_SCHEMA } from './_lib/gemini.js'
import type { AiWord } from './_lib/gemini.js'
import type { ApiRequest, ApiResponse } from './_lib/types.js'

interface RequestBody {
  imageBase64?: string
  mediaType?: string
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST 요청만 가능해요.' })
    return
  }

  const { imageBase64, mediaType } = (req.body ?? {}) as RequestBody
  if (!imageBase64) {
    res.status(400).json({ error: '사진 데이터가 없어요.' })
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
            { inlineData: { mimeType: mediaType || 'image/jpeg', data: imageBase64 } },
            {
              text: [
                '이 사진은 초등학생이 읽는 영어 책의 한 페이지야.',
                '사진 속에서 아이가 배우면 좋을 영어 단어를 최대 20개까지 골라줘.',
                'a, an, the, is, and, it, this 같은 아주 흔한 기능어는 빼줘.',
                '복수형(cats)이나 과거형(ran)처럼 변형된 단어는 사전형(기본형: cat, run)으로 정리해줘.',
                '같은 단어가 여러 번 나오면 한 번만 담아줘.',
                '각 단어마다 품사, 아이 눈높이의 쉬운 영어 설명, 쉬운 한글 뜻, 유의어, 반의어를 채워줘.',
                '글자를 하나도 찾지 못했으면 빈 배열을 보고해줘.',
              ].join(' '),
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: WORDS_LIST_SCHEMA,
      },
    })

    const parsed = JSON.parse(response.text ?? '{}') as { words?: AiWord[] }
    res.status(200).json({ words: parsed.words ?? [] })
  } catch (err) {
    console.error('extract-words failed', err)
    const detail = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: '사진을 분석하는 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.', detail })
  }
}
