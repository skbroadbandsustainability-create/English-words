// Firebase Realtime Database REST API를 순수 fetch로 호출한다(SDK 없이).
// Firebase 콘솔에서 Realtime Database를 만들면 나오는 "데이터베이스 URL"을 그대로 쓰면 된다.
const DB_URL = process.env.FIREBASE_DB_URL

function getBaseUrl(): string {
  if (!DB_URL) {
    throw new Error('FIREBASE_DB_URL 환경변수가 설정되어 있지 않아요.')
  }
  return DB_URL.replace(/\/$/, '')
}

export async function firebaseGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`${getBaseUrl()}/${path}.json`)
  if (!res.ok) throw new Error(`Firebase 조회 실패 (${res.status})`)
  return (await res.json()) as T | null
}

export async function firebaseSet(path: string, value: unknown): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  })
  if (!res.ok) throw new Error(`Firebase 저장 실패 (${res.status})`)
}
