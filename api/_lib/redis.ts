// Upstash Redis REST API를 순수 fetch로 호출한다(별도 SDK 없이).
// upstash.com에서 무료 Redis DB를 만들면 REST URL/TOKEN을 받을 수 있다.
const BASE_URL = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

function getConfig(): { baseUrl: string; token: string } {
  if (!BASE_URL || !TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되어 있지 않아요.')
  }
  return { baseUrl: BASE_URL, token: TOKEN }
}

export async function redisGet(key: string): Promise<string | null> {
  const { baseUrl, token } = getConfig()
  const res = await fetch(`${baseUrl}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Upstash GET 실패 (${res.status})`)
  const data = (await res.json()) as { result: string | null }
  return data.result
}

export async function redisSet(key: string, value: string): Promise<void> {
  const { baseUrl, token } = getConfig()
  const res = await fetch(`${baseUrl}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: value,
  })
  if (!res.ok) throw new Error(`Upstash SET 실패 (${res.status})`)
}
