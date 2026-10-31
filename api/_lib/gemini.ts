import { GoogleGenAI, Type } from '@google/genai'
import type { GenerateContentParameters, GenerateContentResponse, Schema } from '@google/genai'

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
// flash(gemini-3.6-flash)는 무료 등급 일일 요청 한도가 낮아서 이 앱처럼 하루에 AI 요청을
// 여러 번 보내는 경우 429(요청 제한)에 자주 걸린다. flash-lite는 성능은 조금 가볍지만
// 무료 등급 한도가 훨씬 넉넉해서(분당/일일 요청 수 모두 더 큼) 이쪽으로 바꿨다.
export const GEMINI_MODEL = 'gemini-3.1-flash-lite'

// 최신 모델(위)이 전 세계적으로 수요가 몰려서 503(UNAVAILABLE)이 나거나, Google이 모델을
// 교체/폐기해서 404(NOT_FOUND)가 날 때를 대비한 대체 모델. Google 쪽에서 모델을 자주 바꾸니,
// 이 모델도 나중에 404가 나면 그때 최신 이름으로 바꿔주면 된다.
const GEMINI_MODEL_FALLBACK = 'gemini-3.5-flash-lite'

function isModelUnavailableError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err)
  return (
    raw.includes('UNAVAILABLE') ||
    raw.includes('"code":503') ||
    raw.includes('code: 503') ||
    raw.includes('NOT_FOUND') ||
    raw.includes('"code":404') ||
    raw.includes('code: 404')
  )
}

/**
 * 기본 모델이 너무 붐벼서(503) 응답하지 못하거나 Google이 모델을 바꿔서 없어졌으면(404),
 * 대체 모델로 한 번 더 시도해본다. 그 외 오류(요청 제한 등)는 그대로 올려서
 * describeGeminiError가 처리하게 둔다.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: Omit<GenerateContentParameters, 'model'>,
): Promise<GenerateContentResponse> {
  try {
    return await ai.models.generateContent({ ...params, model: GEMINI_MODEL })
  } catch (err) {
    if (!isModelUnavailableError(err)) throw err
    return await ai.models.generateContent({ ...params, model: GEMINI_MODEL_FALLBACK })
  }
}

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

export interface GeminiErrorInfo {
  status: number
  message: string
  detail?: string
  retryAfterSeconds?: number
}

/**
 * Gemini 무료 등급에서 흔히 나는 오류(분당 요청 제한 초과, 일시적 과부하)는
 * 복잡한 원본 JSON 대신 사람이 이해할 수 있는 메시지로 바꿔서 돌려준다.
 */
export function describeGeminiError(err: unknown): GeminiErrorInfo {
  const raw = err instanceof Error ? err.message : String(err)

  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('"code":429') || raw.includes('code: 429')) {
    const match = raw.match(/retry in ([\d.]+)\s*s/i)
    const seconds = match ? Math.ceil(Number(match[1])) : undefined
    return {
      status: 429,
      message: seconds
        ? `지금 요청이 많이 몰려서 잠깐 막혔어요. 약 ${seconds}초 후 다시 시도해주세요.`
        : '지금 요청이 많이 몰려서 잠깐 막혔어요. 1분 정도 후 다시 시도해주세요.',
      retryAfterSeconds: seconds ?? 60,
    }
  }

  if (raw.includes('UNAVAILABLE') || raw.includes('"code":503') || raw.includes('code: 503')) {
    // 자꾸 반복되면 재시도만으로는 해결이 안 되는 경우일 수 있어서, 원인 파악을 위해 상세 내용도 같이 보낸다.
    return { status: 503, message: 'AI 서버가 지금 많이 붐벼요. 잠시 후 다시 시도해주세요.', detail: raw }
  }

  return { status: 500, message: '문제가 생겼어요. 잠시 후 다시 시도해주세요.', detail: raw }
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
