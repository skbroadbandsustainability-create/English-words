import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { AppState } from '../types'

export interface SyncPayload {
  state: AppState
  updatedAt: string
}

/** 클라우드에 저장된 우리 가족 단어장을 가져온다. 실패하면 조용히 null을 돌려준다(오프라인 등). */
export async function fetchCloudState(): Promise<SyncPayload | null> {
  try {
    const res = await fetchWithTimeout('/api/sync', { method: 'GET' }, 10000)
    if (!res.ok) return null
    const data = await res.json()
    return (data.payload ?? null) as SyncPayload | null
  } catch {
    return null
  }
}

/** 지금 이 기기의 단어장을 클라우드에 올려서 다른 기기와 공유되게 한다. 실패해도 조용히 넘어간다. */
export async function pushCloudState(state: AppState, updatedAt: string): Promise<void> {
  try {
    await fetchWithTimeout(
      '/api/sync',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, updatedAt }),
      },
      10000,
    )
  } catch {
    // 다음 변경이나 폴링 때 다시 시도되니 여기서는 무시한다.
  }
}
