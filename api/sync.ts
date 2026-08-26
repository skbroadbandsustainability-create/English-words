import { redisGet, redisSet } from './_lib/redis.js'
import type { ApiRequest, ApiResponse } from './_lib/types.js'

export const config = { maxDuration: 15 }

// 우리 가족 단어장 하나만 저장하면 되니, 키는 고정값 하나만 쓴다(로그인 없는 개인용 앱).
const SYNC_KEY = 'english-words:family-state'

interface SyncPayload {
  state: unknown
  updatedAt: string
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'GET') {
    try {
      const raw = await redisGet(SYNC_KEY)
      res.status(200).json({ payload: raw ? (JSON.parse(raw) as SyncPayload) : null })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      res.status(500).json({ error: '동기화 서버에서 불러오지 못했어요.', detail })
    }
    return
  }

  if (req.method === 'POST') {
    const body = (req.body ?? {}) as Partial<SyncPayload>
    if (!body.state || typeof body.updatedAt !== 'string') {
      res.status(400).json({ error: '저장할 데이터가 없어요.' })
      return
    }
    try {
      await redisSet(SYNC_KEY, JSON.stringify({ state: body.state, updatedAt: body.updatedAt }))
      res.status(200).json({ ok: true })
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err)
      res.status(500).json({ error: '동기화 서버에 저장하지 못했어요.', detail })
    }
    return
  }

  res.status(405).json({ error: 'GET 또는 POST만 가능해요.' })
}
