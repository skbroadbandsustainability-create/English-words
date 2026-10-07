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

/**
 * 지금 이 기기의 단어장을 클라우드에 올려서 다른 기기와 공유되게 한다. 서버가 기존
 * 내용과 합쳐서(병합) 저장한 뒤 그 합쳐진 결과를 돌려주므로, 다른 기기가 그 사이에
 * 추가한 내용도 함께 받아올 수 있다. 실패하면 null을 돌려주고 조용히 넘어간다.
 */
export async function pushCloudState(state: AppState): Promise<SyncPayload | null> {
  try {
    const res = await fetchWithTimeout(
      '/api/sync',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      },
      10000,
    )
    if (!res.ok) return null
    const data = await res.json()
    return (data.payload ?? null) as SyncPayload | null
  } catch {
    // 다음 변경이나 폴링 때 다시 시도되니 여기서는 무시한다.
    return null
  }
}
