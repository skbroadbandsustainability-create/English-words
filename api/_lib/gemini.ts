import { GoogleGenAI, Type } from '@google/genai'
import type { Schema } from '@google/genai'

let client: GoogleGenAI | undefined

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 환경변수가 설정되어 있지 않아요.')
    }
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

// Google AI Studio(ai.google.dev)에서 무료로 발급받는 키로 쓸 수 있는 모델.
export const GEMINI_MODEL = 'gemini-3.6-flash'

export interface AiWord {
  word: string
  partOfSpeech?: string
  definitionEn: string
  meaningKo: string
  synonyms: string[]
  antonyms: string[]
}

// 단어 하나 분량의 JSON 스키마 (Gemini의 구조화 출력 강제 기능에 사용).
// word 필드 설명만 용도에 따라 다르게 줘야 해서(사진 추출은 사전형으로, 직접 입력은
// 입력한 형태 그대로) 나머지 필드를 공유하는 빌더 함수로 뺐다.
function buildWordItemSchema(wordFieldDescription: string): Schema {
  return {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING, description: wordFieldDescription },
      partOfSpeech: {
        type: Type.STRING,
        description: '이 단어가 지금 이 형태로 흔히 쓰이는 품사 (noun, verb, adjective 등 영어로)',
      },
      definitionEn: { type: Type.STRING, description: '초등학생도 이해할 수 있는 아주 쉬운 영어 설명 한 문장' },
      meaningKo: { type: Type.STRING, description: '초등학생이 이해하기 쉬운 짧은 한글 뜻' },
      synonyms: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '비슷한 뜻의 영어 단어. 가장 흔하고 쉬운 것 위주로 딱 2~3개만.',
        maxItems: '3',
      },
      antonyms: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '반대 뜻의 영어 단어. 가장 흔하고 쉬운 것 위주로 딱 2~3개만.',
        maxItems: '3',
      },
    },
    required: ['word', 'definitionEn', 'meaningKo'],
  }
}

// 사진에서 뽑은 단어용: 복수형/과거형 등을 사전형(기본형)으로 정리한다.
const WORD_ITEM_SCHEMA = buildWordItemSchema(
  '단어의 기본형(사전형). 예: cats -> cat, ran -> run, happier -> happy',
)

// 직접 입력한 단어용: 입력한 철자를 절대 바꾸지 않고, 그 형태 그대로 분석한다.
// (예: "linked"를 입력했으면 동사 link의 과거형이 아니라, "연결된"이라는 뜻의
// 형용사처럼 그 형태 자체로 흔히 쓰이는 뜻/품사를 그대로 설명해야 함)
const EXACT_WORD_ITEM_SCHEMA = buildWordItemSchema('입력받은 단어의 철자를 절대 바꾸지 말고 정확히 그대로 담아라.')

export const WORDS_LIST_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    words: { type: Type.ARRAY, items: WORD_ITEM_SCHEMA, maxItems: '20' },
  },
  required: ['words'],
}

export const SINGLE_WORD_SCHEMA: Schema = EXACT_WORD_ITEM_SCHEMA

export interface AiSentence {
  word: string
  sentence: string
}

export const SENTENCES_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    sentences: {
      type: Type.ARRAY,
      maxItems: '25',
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: '입력받은 단어 철자 그대로' },
          sentence: {
            type: Type.STRING,
            description:
              '그 단어가 자연스럽게 들어간, 초등학생이 읽기 쉬운 영어 예문 한 문장. 문장 안에 그 단어를 반드시 입력받은 철자 그대로(변형 없이) 포함시켜야 함.',
          },
        },
        required: ['word', 'sentence'],
      },
    },
  },
  required: ['sentences'],
}
