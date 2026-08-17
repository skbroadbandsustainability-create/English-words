import { useRef, useState } from 'react'
import { useWords } from '../store/wordStore'
import { extractTextFromImage } from '../services/ocr'
import { fetchWordInfo } from '../services/dictionary'
import type { DictionaryResult } from '../services/dictionary'
import { fetchKoreanGloss } from '../services/translate'
import { extractCandidateWords, generateId } from '../utils/words'
import type { Batch, WordEntry } from '../types'

interface Candidate {
  word: string
  info: DictionaryResult | null
  meaning: string // 아이에게 보여줄 뜻 (번역 성공 시 한글, 실패 시 영어 정의)
  included: boolean
}

type Stage = 'idle' | 'reading' | 'looking-up' | 'review' | 'saved'

const LOOKUP_CONCURRENCY = 4

async function lookupCandidates(
  words: string[],
  onProgress: (done: number, total: number) => void,
): Promise<Candidate[]> {
  const results: Candidate[] = new Array(words.length)
  let cursor = 0
  let done = 0

  async function worker() {
    while (cursor < words.length) {
      const i = cursor++
      const word = words[i]
      const [info, koGloss] = await Promise.all([fetchWordInfo(word), fetchKoreanGloss(word)])
      results[i] = {
        word,
        info,
        meaning: koGloss ?? info?.definitionEn ?? '',
        included: Boolean(info),
      }
      done += 1
      onProgress(done, words.length)
    }
  }

  const workerCount = Math.min(LOOKUP_CONCURRENCY, words.length)
  await Promise.all(Array.from({ length: workerCount }, worker))
  return results
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

function PhotoAdd() {
  const { dispatch } = useWords()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const [ocrProgress, setOcrProgress] = useState(0)
  const [lookupDone, setLookupDone] = useState({ done: 0, total: 0 })
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [error, setError] = useState<string | undefined>()

  async function handleFile(file: File) {
    setError(undefined)
    setPreviewUrl(URL.createObjectURL(file))
    setStage('reading')
    setOcrProgress(0)

    try {
      const text = await extractTextFromImage(file, (p) => setOcrProgress(p))
      const words = extractCandidateWords(text)
      if (words.length === 0) {
        setError('사진에서 영어 단어를 찾지 못했어요. 글자가 잘 보이는 사진으로 다시 시도해보세요.')
        setStage('idle')
        return
      }
      setStage('looking-up')
      setLookupDone({ done: 0, total: words.length })
      const results = await lookupCandidates(words, (done, total) => setLookupDone({ done, total }))
      setCandidates(results)
      setStage('review')
    } catch {
      setError('사진을 읽는 중에 문제가 생겼어요. 다시 시도해주세요.')
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
      phonetic: c.info?.phonetic,
      audioUrl: c.info?.audioUrl,
      partOfSpeech: c.info?.partOfSpeech,
      definitionEn: c.info?.definitionEn ?? c.meaning.trim(),
      meaningKo: c.meaning.trim() || undefined,
      synonyms: c.info?.synonyms ?? [],
      antonyms: c.info?.antonyms ?? [],
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
          <span className="text-sm text-slate-400">영어 단어가 보이는 페이지를 찍어주세요</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
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

      {stage === 'reading' && (
        <ProgressCard label="사진에서 글자를 읽고 있어요..." percent={ocrProgress} />
      )}

      {stage === 'looking-up' && (
        <ProgressCard
          label={`단어 뜻을 찾고 있어요... (${lookupDone.done}/${lookupDone.total})`}
          percent={lookupDone.total ? lookupDone.done / lookupDone.total : 0}
        />
      )}

      {stage === 'review' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">
            찾은 단어 {candidates.length}개예요. 저장할 단어를 고르고, 뜻을 확인·수정해주세요.
          </p>
          {candidates.map((c, i) => (
            <CandidateRow key={c.word} candidate={c} onChange={(patch) => updateCandidate(i, patch)} />
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
    const [info, koGloss] = await Promise.all([fetchWordInfo(word), fetchKoreanGloss(word)])
    setCandidate({ word, info, meaning: koGloss ?? info?.definitionEn ?? '', included: true })
    if (!info) {
      setError('사전에 없는 단어예요. 뜻을 직접 입력해주세요.')
    }
    setLoading(false)
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
      phonetic: candidate.info?.phonetic,
      audioUrl: candidate.info?.audioUrl,
      partOfSpeech: candidate.info?.partOfSpeech,
      definitionEn: candidate.info?.definitionEn ?? candidate.meaning.trim(),
      meaningKo: candidate.meaning.trim() || undefined,
      synonyms: candidate.info?.synonyms ?? [],
      antonyms: candidate.info?.antonyms ?? [],
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

      {candidate && <CandidateRow candidate={candidate} onChange={(patch) => setCandidate({ ...candidate, ...patch })} />}

      {candidate && (
        <button onClick={save} className="rounded-2xl bg-sky-500 py-3 font-bold text-white active:scale-95">
          단어장에 저장
        </button>
      )}

      {saved && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center font-bold text-emerald-600">🎉 저장했어요!</p>}
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
            {candidate.info?.phonetic && <span className="text-sm text-slate-400">{candidate.info.phonetic}</span>}
            {candidate.info?.partOfSpeech && (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-600">
                {candidate.info.partOfSpeech}
              </span>
            )}
            {!candidate.info && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-600">
                사전에 없어요
              </span>
            )}
          </div>
          {candidate.info?.definitionEn && (
            <p className="mt-1 text-sm text-slate-400">{candidate.info.definitionEn}</p>
          )}
          <input
            value={candidate.meaning}
            onChange={(e) => onChange({ meaning: e.target.value })}
            placeholder="아이가 이해하기 쉬운 뜻을 적어주세요"
            className="mt-2 w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base outline-none focus:border-sky-400"
          />
          {(candidate.info?.synonyms?.length ?? 0) > 0 && (
            <p className="mt-1 text-xs text-slate-400">비슷한 말: {candidate.info!.synonyms.join(', ')}</p>
          )}
          {(candidate.info?.antonyms?.length ?? 0) > 0 && (
            <p className="text-xs text-slate-400">반대말: {candidate.info!.antonyms.join(', ')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ProgressCard({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-2 text-center font-bold text-slate-600">{label}</p>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-sky-400 transition-all"
          style={{ width: `${Math.round(percent * 100)}%` }}
        />
      </div>
    </div>
  )
}
