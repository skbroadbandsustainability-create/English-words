import { createWorker } from 'tesseract.js'

/**
 * 사진(파일) 안의 글자를 읽어서 텍스트로 돌려준다. 브라우저 안에서 동작하며 서버로 사진을 보내지 않는다.
 * onProgress는 0~1 사이 값으로 인식 진행률을 알려준다.
 */
export async function extractTextFromImage(
  file: File | Blob,
  onProgress?: (progress: number) => void,
): Promise<string> {
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
    } = await worker.recognize(file)
    return text
  } finally {
    await worker.terminate()
  }
}
