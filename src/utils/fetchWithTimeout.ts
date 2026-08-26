/**
 * 일정 시간 안에 응답이 안 오면 자동으로 취소하는 fetch. 네트워크가 느리거나
 * 서버가 응답 없이 멈춰있을 때, 화면이 "찾는 중..."에 무한정 멈춰있지 않게 해준다.
 */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = 20000,
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('응답이 너무 오래 걸려서 요청을 중단했어요. 잠시 후 다시 시도해주세요.')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
