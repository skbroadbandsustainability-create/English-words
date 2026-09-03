import { describeGeminiError, getGeminiClient, GEMINI_MODEL, WORDS_LIST_SCHEMA } from './_lib/gemini.js'
import type { AiWord } from './_lib/gemini.js'
import type { ApiRequest, ApiResponse } from './_lib/types.js'

// 사진 분석(비전)은 텍스트보다 오래 걸릴 수 있어, Vercel 무료 플랜 한도(60초)까지 늘려준다.
export const config = { maxDuration: 60 }

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
                '이 사진은 초등학생용 "영어 단어 학습 책"의 한 페이지를 찍은 거야.',
                '이런 책은 보통 페이지마다 그날 가르치려는 핵심 단어(들)가 있고, 그 단어는',
                '- 페이지에서 가장 크거나 굵게 강조된 글씨',
                '- 그림/삽화와 함께 짝지어진 표제어(헤드워드)',
                '- 단어 목록/단어 카드 형태로 나열된 것',
                '중 하나로 나타나는 경우가 많아.',
                '반면 예문 속 단어, "Trace the word", "Look and say", "Unit 3", "Lesson 5",',
                'page 12 같은 안내 문구·유닛 제목·페이지 번호·저자/출판사 정보는 가르치려는 핵심',
                '단어가 아니니까 절대 포함하지 마.',
                '이 페이지가 실제로 가르치는 핵심 단어만 골라줘. 보통 한 페이지에 1~10개 정도일',
                '거야. 확신이 안 서면 가장 눈에 띄고 크게 강조된 단어 위주로 좁혀서 골라줘.',
                '최대 20개를 넘기지 마.',
                '복수형(cats)이나 과거형(ran)처럼 변형된 단어는 사전형(기본형: cat, run)으로 정리해줘.',
                '같은 단어가 여러 번 나오면 한 번만 담아줘.',
                '각 단어마다 품사, 아이 눈높이의 쉬운 영어 설명, 쉬운 한글 뜻, 유의어, 반의어를 채워줘.',
                '이 페이지에서 가르치는 핵심 단어를 하나도 찾지 못했으면 빈 배열을 보고해줘.',
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
    const { status, message, detail } = describeGeminiError(err)
    res.status(status).json({ error: message, detail })
  }
}
