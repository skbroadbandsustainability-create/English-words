import { createWorker } from 'tesseract.js'

/**
 * 사진을 흑백으로 바꾸고 대비를 높여서 OCR이 글자를 더 잘 읽도록 전처리한다.
 * 조명이 고르지 않거나 살짝 흐릿한 사진에서 인식률을 꽤 끌어올려준다.
 */
async function preprocessImage(file: File | Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const maxDim = 1800
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const contrast = 1.35
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const adjusted = Math.min(255, Math.max(0, (gray - 128) * contrast + 128))
    data[i] = data[i + 1] = data[i + 2] = adjusted
  }
  ctx.putImageData(imageData, 0, 0)

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지 전처리에 실패했어요.'))), 'image/png'),
  )
}

/**
 * 사진(파일) 안의 글자를 읽어서 텍스트로 돌려준다. 브라우저 안에서 동작하며 서버로 사진을 보내지 않는다.
 * onProgress는 0~1 사이 값으로 인식 진행률을 알려준다.
 */
export async function extractTextFromImage(
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const processed = await preprocessImage(file)
  const worker = await createWorker('eng', undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text' && typeof m.progress === 'number') {
        onProgress?.(m.progress)
      }
    },
  })
  try {
    const {
      data: { text },
    } = await worker.recognize(processed)
    return text
  } finally {
    await worker.terminate()
  }
}
