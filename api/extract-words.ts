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
                '- (중요) 줄마다 짧은 영어 구(phrase)가 있고, 그 구 안에서 한 단어만 굵게 또는',
                '  다른 색(초록색/파란색 등, 나머지는 검은색)으로 눈에 띄게 표시된 "연어(collocation)"',
                '  형태. 예를 들어 "raise the money"에서 raise만 굵은 초록색이고 the money는',
                '  검은색이면, 핵심 단어는 raise 하나뿐이고 the money는 그냥 그 단어가 쓰인 문맥',
                '  예시일 뿐이야. 같은 식으로 "ask for donations from students"는 donations만,',
                '  "another incident of violence"는 incident만, "attract much media attention"은',
                '  attention만 핵심 단어야. 이 형태일 때는 절대 구 전체를 하나의 단어로 담지 말고,',
                '  굵고 색이 다른 그 한 단어만 뽑아내. 줄 오른쪽에 있는 한글 뜻 앞에 보통 품사',
                '  표시(v, n, adj 등)가 작게 붙어 있는데, 있으면 그 품사와 한글 뜻을 참고해서',
                '  partOfSpeech와 meaningKo를 채워줘.',
                '중 하나로 나타나는 경우가 많아.',
                '반면 예문 속 단어, "Trace the word", "Look and say", "Unit 3", "Lesson 5",',
                'page 12 같은 안내 문구·유닛 제목·페이지 번호·저자/출판사 정보는 가르치려는 핵심',
                '단어가 아니니까 절대 포함하지 마.',
                '이 페이지가 실제로 가르치는 핵심 단어만 골라줘. 체크박스(□)가 각 줄 앞에 있다면',
                '그 줄 개수만큼 핵심 단어가 있다는 뜻이니 하나도 빠뜨리지 말고 전부 찾아줘.',
                '확신이 안 서면 가장 눈에 띄고 굵거나 색이 다르게 강조된 단어 위주로 좁혀서 골라줘.',
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
