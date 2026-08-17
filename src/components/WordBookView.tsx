import { useMemo, useState } from 'react'
import { useWords } from '../store/wordStore'
import { playPronunciation } from '../services/speech'
import type { WordEntry } from '../types'

export default function WordBookView() {
  const { state, dispatch } = useWords()
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? state.words.filter(
          (w) =>
            w.word.includes(q) ||
            (w.meaningKo ?? '').includes(q) ||
            w.definitionEn.toLowerCase().includes(q),
        )
      : state.words

    const byBatch = new Map<string, WordEntry[]>()
    for (const w of filtered) {
      const list = byBatch.get(w.batchId) ?? []
      list.push(w)
      byBatch.set(w.batchId, list)
    }

    return [...state.batches]
      .reverse()
      .map((b) => ({ batch: b, words: byBatch.get(b.id) ?? [] }))
      .filter((g) => g.words.length > 0)
  }, [state.words, state.batches, query])

  function remove(id: string) {
    if (window.confirm('이 단어를 단어장에서 삭제할까요?')) {
      dispatch({ type: 'DELETE_WORD', id })
    }
  }

  if (state.words.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-16 text-center text-slate-400">
        <p className="text-5xl">📖</p>
        <p className="font-display text-xl text-slate-500">단어장이 비어있어요</p>
        <p>'단어 추가' 탭에서 첫 단어를 등록해보세요!</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 단어 검색"
        className="rounded-2xl border-2 border-slate-200 px-4 py-3 text-base outline-none focus:border-sky-400"
      />

      {groups.map(({ batch, words }) => (
        <section key={batch.id} className="flex flex-col gap-2">
          <p className="text-sm font-bold text-slate-400">
            {batch.label} · {words.length}개
          </p>
          <div className="flex flex-col gap-2">
            {words.map((w) => (
              <WordRow
                key={w.id}
                word={w}
                onDelete={() => remove(w.id)}
                onUpdate={(patch) => dispatch({ type: 'UPDATE_WORD', word: { ...w, ...patch } })}
              />
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 && <p className="text-center text-slate-400">검색 결과가 없어요</p>}
    </div>
  )
}

function WordRow({
  word,
  onDelete,
  onUpdate,
}: {
  word: WordEntry
  onDelete: () => void
  onUpdate: (patch: Partial<WordEntry>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(word.meaningKo ?? word.definitionEn)

  return (
    <div className="rounded-2xl border-2 border-slate-100 bg-white p-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => playPronunciation(word.word, word.audioUrl)}
          className="shrink-0 rounded-full bg-sky-100 p-2.5 text-lg"
          aria-label="발음 듣기"
        >
          🔊
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-display text-lg text-slate-800">{word.word}</span>
            {word.phonetic && <span className="text-xs text-slate-400">{word.phonetic}</span>}
          </div>
          {editing ? (
            <div className="mt-1 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1 rounded-lg border-2 border-slate-200 px-2 py-1 text-sm outline-none focus:border-sky-400"
              />
              <button
                onClick={() => {
                  onUpdate({ meaningKo: draft })
                  setEditing(false)
                }}
                className="rounded-lg bg-sky-500 px-3 text-sm font-bold text-white"
              >
                저장
              </button>
            </div>
          ) : (
            <p className="truncate text-sm text-slate-500">{word.meaningKo ?? word.definitionEn}</p>
          )}
        </div>
        <button onClick={() => setEditing((v) => !v)} aria-label="뜻 수정" className="shrink-0 text-lg">
          ✏️
        </button>
        <button onClick={onDelete} aria-label="단어 삭제" className="shrink-0 text-lg">
          🗑️
        </button>
      </div>
    </div>
  )
}
