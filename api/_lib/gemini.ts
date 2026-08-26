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

// 단어 하나 분량의 JSON 스키마 (Gemini의 구조화 출력 강제 기능에 사용)
const WORD_ITEM_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    word: {
      type: Type.STRING,
      description: '단어의 기본형(사전형). 예: cats -> cat, ran -> run, happier -> happy',
    },
    partOfSpeech: { type: Type.STRING, description: '품사 (noun, verb, adjective 등 영어로)' },
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

export const WORDS_LIST_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    words: { type: Type.ARRAY, items: WORD_ITEM_SCHEMA, maxItems: '20' },
  },
  required: ['words'],
}

export const SINGLE_WORD_SCHEMA: Schema = WORD_ITEM_SCHEMA

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
