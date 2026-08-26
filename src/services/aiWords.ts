export interface AiWordResult {
  word: string
  partOfSpeech?: string
  definitionEn: string
  meaningKo: string
  synonyms: string[]
  antonyms: string[]
}

interface ApiErrorBody {
  error?: string
  detail?: string
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody
  const base = body.error ?? fallback
  return body.detail ? `${base} (${body.detail})` : base
}

/** 사진을 서버로 보내기 전, 브라우저에서 적당한 크기로 줄여서 base64로 바꾼다(용량/속도 절약). */
async function fileToResizedBase64(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<{ base64: string; mediaType: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('이미지를 처리할 수 없어요.')
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 변환에 실패했어요.'))), 'image/jpeg', quality),
  )
  const base64 = await blobToBase64(blob)
  return { base64, mediaType: 'image/jpeg' }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = () => reject(new Error('이미지를 읽지 못했어요.'))
    reader.readAsDataURL(blob)
  })
}

/** 책 사진을 AI(Gemini)에게 보내 사진 속 영어 단어들을 뜻과 함께 정리해서 받아온다. */
export async function extractWordsFromPhoto(file: File): Promise<AiWordResult[]> {
  const { base64, mediaType } = await fileToResizedBase64(file)
  const res = await fetch('/api/extract-words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mediaType }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'AI 서버에 연결하지 못했어요.'))
  }
  const data = await res.json()
  return (data.words ?? []) as AiWordResult[]
}

/** 단어 하나를 AI(Gemini)에게 물어서 뜻/유의어/반의어를 받아온다. */
export async function lookupWordAi(word: string): Promise<AiWordResult | null> {
  const res = await fetch('/api/word-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'AI 서버에 연결하지 못했어요.'))
  }
  const data = await res.json()
  return (data.word ?? null) as AiWordResult | null
}
