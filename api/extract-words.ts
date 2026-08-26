import { extractToolInput, getAnthropicClient, WORD_ITEM_SCHEMA } from './_lib/anthropic.js'
import type { AiWord } from './_lib/anthropic.js'
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
    const anthropic = getAnthropicClient()
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      tools: [
        {
          name: 'report_words',
          description: '사진에서 찾은 영어 학습 단어 목록을 보고한다.',
          input_schema: {
            type: 'object',
            properties: {
              words: { type: 'array', items: WORD_ITEM_SCHEMA },
            },
            required: ['words'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'report_words' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: (mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
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
    })

    const result = extractToolInput<{ words?: AiWord[] }>(message, 'report_words')
    res.status(200).json({ words: result?.words ?? [] })
  } catch (err) {
    console.error('extract-words failed', err)
    const detail = err instanceof Error ? err.message : String(err)
    res.status(500).json({ error: '사진을 분석하는 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.', detail })
  }
}
