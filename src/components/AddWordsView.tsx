import { useRef, useState } from 'react'
import { useWords } from '../store/wordStore'
import { extractWordsFromPhoto, lookupWordAi } from '../services/aiWords'
import type { AiWordResult } from '../services/aiWords'
import { fetchWordInfo } from '../services/dictionary'
import { naverDictUrl } from '../utils/naverDict'
import { generateId } from '../utils/words'
import type { Batch, WordEntry } from '../types'

interface Candidate {
  word: string
  partOfSpeech?: string
  definitionEn: string
  meaning: string // 아이에게 보여줄 뜻(한글), 편집 가능
  synonyms: string[]
  antonyms: string[]
  phonetic?: string
  audioUrl?: string
  included: boolean
}

const ENRICH_CONCURRENCY = 4

function toCandidate(ai: AiWordResult): Candidate {
  return {
    word: ai.word,
    partOfSpeech: ai.partOfSpeech,
    definitionEn: ai.definitionEn,
    meaning: ai.meaningKo,
    synonyms: ai.synonyms ?? [],
    antonyms: ai.antonyms ?? [],
    included: true,
  }
}

/** 무료 사전 API로 실제 발음(오디오)만 있으면 덤으로 붙여준다. 실패해도 무시한다. */
async function enrichWithAudio(candidates: Candidate[]): Promise<Candidate[]> {
  const result = [...candidates]
  let cursor = 0

  async function worker() {
    while (cursor < result.length) {
      const i = cursor++
      const info = await fetchWordInfo(result[i].word)
      if (info) {
        result[i] = { ...result[i], phonetic: info.phonetic, audioUrl: info.audioUrl }
      }
    }
  }

  const workerCount = Math.min(ENRICH_CONCURRENCY, result.length)
  await Promise.all(Array.from({ length: workerCount }, worker))
  return result
}

export default function AddWordsView() {
  const [mode, setMode] = useState<'photo' | 'manual'>('photo')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
        <button
          onClick={() => setMode('photo')}
          className={`flex-1 rounded-xl py-2.5 text-base font-bold transition-colors ${
            mode === 'photo' ? 'bg-sky-500 text-white' : 'text-slate-400'
          }`}
        >
          📸 사진으로 추가
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 rounded-xl py-2.5 text-base font-bold transition-colors ${
            mode === 'manual' ? 'bg-sky-500 text-white' : 'text-slate-400'
          }`}
        >
          ✏️ 직접 입력
        </button>
      </div>

      {mode === 'photo' ? <PhotoAdd /> : <ManualAdd />}
    </div>
  )
}

type Stage = 'idle' | 'analyzing' | 'review' | 'saved'

function PhotoAdd() {
  const { dispatch } = useWords()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [error, setError] = useState<string | undefined>()

  async function handleFile(file: File) {
    setError(undefined)
    setPreviewUrl(URL.createObjectURL(file))
    setStage('analyzing')

    try {
      const aiWords = await extractWordsFromPhoto(file)
      if (aiWords.length === 0) {
        setError('사진에서 영어 단어를 찾지 못했어요. 글자가 잘 보이는 사진으로 다시 시도해보세요.')
        setStage('idle')
        return
      }
      const enriched = await enrichWithAudio(aiWords.map(toCandidate))
      setCandidates(enriched)
      setStage('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI가 사진을 분석하지 못했어요. 다시 시도해주세요.')
      setStage('idle')
    }
  }

  function updateCandidate(index: number, patch: Partial<Candidate>) {
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  }

  function reset() {
    setStage('idle')
    setPreviewUrl(undefined)
    setCandidates([])
    setError(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function save() {
    const toSave = candidates.filter((c) => c.included && c.meaning.trim())
    if (toSave.length === 0) {
      setError('저장할 단어를 1개 이상 선택하고 뜻을 입력해주세요.')
      return
    }

    const now = new Date()
    const words: WordEntry[] = toSave.map((c) => ({
      id: generateId(),
      word: c.word,
      phonetic: c.phonetic,
      audioUrl: c.audioUrl,
      partOfSpeech: c.partOfSpeech,
      definitionEn: c.definitionEn || c.meaning.trim(),
      meaningKo: c.meaning.trim() || undefined,
      synonyms: c.synonyms,
      antonyms: c.antonyms,
      batchId: '',
      addedAt: now.toISOString(),
      source: 'photo',
      familiarity: 0,
    }))
    const batch: Batch = {
      id: generateId(),
      createdAt: now.toISOString(),
      label: `${now.getMonth() + 1}/${now.getDate()}에 찍은 사진`,
      wordIds: words.map((w) => w.id),
    }
    words.forEach((w) => (w.batchId = batch.id))

    dispatch({ type: 'ADD_BATCH', batch, words })
    dispatch({ type: 'MARK_STUDIED_TODAY' })
    setStage('saved')
  }

  return (
    <div className="flex flex-col gap-4">
      {stage === 'idle' && (
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-3xl border-4 border-dashed border-sky-200 bg-white py-12 text-center transition-colors active:border-sky-400">
          <span className="text-5xl">📷</span>
          <span className="font-display text-xl text-sky-600">책 사진 올리기</span>
          <span className="text-sm text-slate-400">카메라로 찍거나, 사진첩에서 골라주세요</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </label>
      )}

      {previewUrl && stage !== 'idle' && stage !== 'saved' && (
        <img src={previewUrl} alt="올린 사진" className="max-h-48 w-full rounded-2xl object-cover shadow-sm" />
      )}

      {stage === 'analyzing' && <LoadingCard label="AI가 사진 속 단어를 읽고 정리하고 있어요..." />}

      {stage === 'review' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">
            찾은 단어 {candidates.length}개예요. 저장할 단어를 고르고, 뜻을 확인·수정해주세요.
          </p>
          {candidates.map((c, i) => (
            <CandidateRow key={`${c.word}-${i}`} candidate={c} onChange={(patch) => updateCandidate(i, patch)} />
          ))}
          <div className="flex gap-3 pt-2">
            <button
              onClick={reset}
              className="flex-1 rounded-2xl border-2 border-slate-200 py-3 font-bold text-slate-500"
            >
              취소
            </button>
            <button
              onClick={save}
              className="flex-1 rounded-2xl bg-sky-500 py-3 font-bold text-white active:scale-95"
            >
              단어장에 저장
            </button>
          </div>
        </div>
      )}

      {stage === 'saved' && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-emerald-50 py-10 text-center">
          <span className="text-5xl">🎉</span>
          <p className="font-display text-xl text-emerald-600">단어장에 저장했어요!</p>
          <button onClick={reset} className="mt-2 rounded-full bg-emerald-500 px-6 py-2 font-bold text-white">
            사진 또 올리기
          </button>
        </div>
      )}

      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">{error}</p>}
    </div>
  )
}

function ManualAdd() {
  const { dispatch } = useWords()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [candidate, setCandidate] = useState<Candidate | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [saved, setSaved] = useState(false)

  async function search() {
    const word = input.trim().toLowerCase()
    if (!word) return
    setLoading(true)
    setError(undefined)
    setSaved(false)
    setCandidate(undefined)

    try {
      const ai = await lookupWordAi(word)
      if (!ai) {
        setError('AI가 이 단어를 찾지 못했어요. 잠시 후 다시 시도해주세요.')
        return
      }
      // 사진 추출과 달리 직접 입력은 사용자가 정확히 원하는 형태를 타이핑한 거라,
      // AI가 사전형으로 바꿔놨어도(예: linked -> link) 입력한 그대로 저장한다.
      const [withAudio] = await enrichWithAudio([toCandidate({ ...ai, word })])
      setCandidate(withAudio)
    } catch (err) {
      setError(err instanceof Error ? err.message : '단어를 찾는 중 문제가 생겼어요.')
    } finally {
      setLoading(false)
    }
  }

  function save() {
    if (!candidate || !candidate.meaning.trim()) {
      setError('뜻을 입력해주세요.')
      return
    }
    const now = new Date()
    const id = generateId()
    const word: WordEntry = {
      id,
      word: candidate.word,
      phonetic: candidate.phonetic,
      audioUrl: candidate.audioUrl,
      partOfSpeech: candidate.partOfSpeech,
      definitionEn: candidate.definitionEn || candidate.meaning.trim(),
      meaningKo: candidate.meaning.trim() || undefined,
      synonyms: candidate.synonyms,
      antonyms: candidate.antonyms,
      batchId: '',
      addedAt: now.toISOString(),
      source: 'manual',
      familiarity: 0,
    }
    const batch: Batch = {
      id: generateId(),
      createdAt: now.toISOString(),
      label: `직접 추가한 "${word.word}"`,
      wordIds: [id],
    }
    word.batchId = batch.id

    dispatch({ type: 'ADD_BATCH', batch, words: [word] })
    dispatch({ type: 'MARK_STUDIED_TODAY' })
    setSaved(true)
    setCandidate(undefined)
    setInput('')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void search()}
          placeholder="영어 단어를 입력하세요 (예: apple)"
          className="flex-1 rounded-2xl border-2 border-slate-200 px-4 py-3 text-lg outline-none focus:border-sky-400"
        />
        <button
          onClick={() => void search()}
          disabled={loading}
          className="rounded-2xl bg-sky-500 px-5 font-bold text-white disabled:opacity-50"
        >
          {loading ? '찾는 중...' : '찾기'}
        </button>
      </div>

      {loading && <LoadingCard label="AI가 단어 뜻을 찾고 있어요..." />}

      {candidate && (
        <CandidateRow candidate={candidate} onChange={(patch) => setCandidate({ ...candidate, ...patch })} />
      )}

      {candidate && (
        <button onClick={save} className="rounded-2xl bg-sky-500 py-3 font-bold text-white active:scale-95">
          단어장에 저장
        </button>
      )}

      {saved && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center font-bold text-emerald-600">🎉 저장했어요!</p>
      )}
      {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">{error}</p>}
    </div>
  )
}

function CandidateRow({
  candidate,
  onChange,
}: {
  candidate: Candidate
  onChange: (patch: Partial<Candidate>) => void
}) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${candidate.included ? 'border-sky-200 bg-white' : 'border-slate-100 bg-slate-50'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={candidate.included}
          onChange={(e) => onChange({ included: e.target.checked })}
          className="mt-1.5 h-5 w-5 shrink-0 accent-sky-500"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-xl text-slate-800">{candidate.word}</span>
            {candidate.phonetic && <span className="text-sm text-slate-400">{candidate.phonetic}</span>}
            {candidate.partOfSpeech && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-600">
                {candidate.partOfSpeech}
              </span>
            )}
            <a
              href={naverDictUrl(candidate.word)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 underline"
            >
              네이버 사전 🔗
            </a>
          </div>
          {candidate.definitionEn && <p className="mt-1 text-sm text-slate-400">{candidate.definitionEn}</p>}
          <input
            value={candidate.meaning}
            onChange={(e) => onChange({ meaning: e.target.value })}
            placeholder="아이가 이해하기 쉬운 뜻을 적어주세요"
            className="mt-2 w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base outline-none focus:border-sky-400"
          />
          {(candidate.synonyms?.length ?? 0) > 0 && (
            <p className="mt-1 text-xs text-slate-400">비슷한 말: {candidate.synonyms.join(', ')}</p>
          )}
          {(candidate.antonyms?.length ?? 0) > 0 && (
            <p className="text-xs text-slate-400">반대말: {candidate.antonyms.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-2 text-center font-bold text-slate-600">{label}</p>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full w-2/5 animate-pulse rounded-full bg-sky-400" />
      </div>
    </div>
  )
}
