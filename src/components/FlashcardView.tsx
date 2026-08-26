import { useEffect, useMemo, useState } from 'react'
import WordCard from './WordCard'
import { useWords } from '../store/wordStore'
import { playPronunciation } from '../services/speech'
import { shuffle } from '../utils/words'
import { dateKeyOf, formatDateShort, groupWordsByDate } from '../utils/dateGroups'

export default function FlashcardView() {
  const { state, dispatch } = useWords()
  const dateGroups = useMemo(() => groupWordsByDate(state.words), [state.words])

  // 기본값은 가장 최근에 등록한 날짜. 매일 새 단어를 등록하면 카드가 계속 쌓이니,
  // 오늘/최근 등록분만 먼저 보여주고, 전체로 보고 싶으면 '전체'를 고를 수 있게 한다.
  const [selectedDate, setSelectedDate] = useState<string>(dateGroups[0]?.date ?? 'all')

  const pool = useMemo(
    () => (selectedDate === 'all' ? state.words : state.words.filter((w) => dateKeyOf(w) === selectedDate)),
    [state.words, selectedDate],
  )

  const [order, setOrder] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    // 익숙하지 않은(familiarity 낮은) 단어일수록 더 자주 나오게 가중치를 준다.
    const weighted = pool.flatMap((w) => Array(Math.max(1, 3 - Math.min(w.familiarity, 2))).fill(w.id))
    setOrder(shuffle(weighted.length > 0 ? weighted : pool.map((w) => w.id)))
    setIndex(0)
    setFlipped(false)
  }, [pool.length, selectedDate])

  useEffect(() => {
    if (state.words.length > 0) dispatch({ type: 'MARK_STUDIED_TODAY' })
  }, [dispatch, state.words.length])

  const currentWord = useMemo(() => {
    if (order.length === 0) return undefined
    const id = order[index % order.length]
    return state.words.find((w) => w.id === id)
  }, [order, index, state.words])

  if (state.words.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-16 text-center text-slate-400">
        <p className="text-5xl">📸</p>
        <p className="font-display text-xl text-slate-500">아직 모은 단어가 없어요</p>
        <p>아래 '단어 추가' 탭에서 책 사진을 올리거나 단어를 입력해보세요!</p>
      </div>
    )
  }

  function next() {
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  function markKnow() {
    dispatch({ type: 'BUMP_FAMILIARITY', id: currentWord!.id, delta: 1 })
    next()
  }

  function markReview() {
    dispatch({ type: 'BUMP_FAMILIARITY', id: currentWord!.id, delta: -1 })
    next()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-8 sm:px-6">
      {dateGroups.length > 1 && (
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
          <DateChip
            label={`전체 (${state.words.length})`}
            active={selectedDate === 'all'}
            onClick={() => setSelectedDate('all')}
          />
          {dateGroups.map((g) => (
            <DateChip
              key={g.date}
              label={`${formatDateShort(g.date)} (${g.words.length})`}
              active={selectedDate === g.date}
              onClick={() => setSelectedDate(g.date)}
            />
          ))}
        </div>
      )}

      {pool.length === 0 || !currentWord ? (
        <p className="py-16 text-slate-400">이 날짜에는 카드가 없어요.</p>
      ) : (
        <>
          <p className="text-sm font-bold text-slate-400">
            {(index % order.length) + 1} / {order.length}
          </p>

          <WordCard word={currentWord} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

          <button
            onClick={() => playPronunciation(currentWord.word, currentWord.audioUrl)}
            className="no-select rounded-full bg-sky-100 px-6 py-3 text-lg font-bold text-sky-600 transition-transform active:scale-95"
          >
            🔊 발음 듣기
          </button>

          <div className="flex w-full max-w-sm gap-3">
            <button
              onClick={markReview}
              className="no-select flex-1 rounded-2xl border-2 border-amber-300 bg-amber-50 py-4 text-lg font-bold text-amber-600 transition-transform active:scale-95"
            >
              🔁 다시 볼래요
            </button>
            <button
              onClick={markKnow}
              className="no-select flex-1 rounded-2xl border-2 border-emerald-400 bg-emerald-400 py-4 text-lg font-bold text-white transition-transform active:scale-95"
            >
              ✅ 알아요
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function DateChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`no-select shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
        active ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}
