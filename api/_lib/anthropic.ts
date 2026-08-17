import Anthropic from '@anthropic-ai/sdk'

let client: Anthropic | undefined

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않아요.')
    }
    client = new Anthropic({ apiKey })
  }
  return client
}

export interface AiWord {
  word: string
  partOfSpeech?: string
  definitionEn: string
  meaningKo: string
  synonyms: string[]
  antonyms: string[]
}

// Claude에게 구조화된 JSON을 강제로 받기 위한 tool 스키마의 단어 하나 분량.
export const WORD_ITEM_SCHEMA = {
  type: 'object' as const,
  properties: {
    word: {
      type: 'string',
      description: '단어의 기본형(사전형). 예: cats -> cat, ran -> run, happier -> happy',
    },
    partOfSpeech: { type: 'string', description: '품사 (noun, verb, adjective 등 영어로)' },
    definitionEn: { type: 'string', description: '초등학생도 이해할 수 있는 아주 쉬운 영어 설명 한 문장' },
    meaningKo: { type: 'string', description: '초등학생이 이해하기 쉬운 짧은 한글 뜻' },
    synonyms: {
      type: 'array',
      items: { type: 'string' },
      description: '비슷한 뜻의 영어 단어 (있는 만큼만, 최대 4개)',
    },
    antonyms: {
      type: 'array',
      items: { type: 'string' },
      description: '반대 뜻의 영어 단어 (있는 만큼만, 최대 4개)',
    },
  },
  required: ['word', 'definitionEn', 'meaningKo'],
}

/** Anthropic 응답에서 강제한 tool_use 블록의 input을 꺼낸다. 없으면 null. */
export function extractToolInput<T>(message: Anthropic.Message, toolName: string): T | null {
  const block = message.content.find((b) => b.type === 'tool_use' && b.name === toolName)
  if (!block || block.type !== 'tool_use') return null
  return block.input as T
}
