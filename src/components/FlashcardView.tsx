import { useEffect, useMemo, useState } from 'react'
import WordCard from './WordCard'
import DateChip from './DateChip'
import { useWords } from '../store/wordStore'
import { playPronunciation } from '../services/speech'
import { shuffle } from '../utils/words'
import { dateKeyOf, formatDateShort, groupWordsByDate } from '../utils/dateGroups'
import type { WordEntry } from '../types'

type Phase = 'round1' | 'round2' | 'review' | 'done'

function shuffledIds(pool: WordEntry[]): string[] {
  return shuffle(pool.map((w) => w.id))
}

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

  // 학습 순서: 1라운드에서 전체를 한 번, 2라운드에서 전체를 한 번 더 무조건 다 보여준 다음,
  // 그 뒤로는 "다시 볼래요"였던 단어만 알아요를 누를 때까지 계속 돌려서 보여준다.
  const [phase, setPhase] = useState<Phase>('round1')
  const [linearQueue, setLinearQueue] = useState<string[]>([])
  const [linearIndex, setLinearIndex] = useState(0)
  const [reviewQueue, setReviewQueue] = useState<string[]>([])
  const [needsReview, setNeedsReview] = useState<Set<string>>(new Set())
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    setPhase('round1')
    setLinearQueue(shuffledIds(pool))
    setLinearIndex(0)
    setReviewQueue([])
    setNeedsReview(new Set(pool.map((w) => w.id)))
    setFlipped(false)
  }, [pool.length, selectedDate])

  useEffect(() => {
    if (state.words.length > 0) dispatch({ type: 'MARK_STUDIED_TODAY' })
  }, [dispatch, state.words.length])

  const currentId =
    phase === 'round1' || phase === 'round2' ? linearQueue[linearIndex] : phase === 'review' ? reviewQueue[0] : undefined
  const currentWord = useMemo(() => pool.find((w) => w.id === currentId), [pool, currentId])

  if (state.words.length === 0) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 py-16 text-center text-slate-400">
        <p className="text-5xl">📸</p>
        <p className="font-display text-xl text-slate-500">아직 모은 단어가 없어요</p>
        <p>아래 '단어 추가' 탭에서 책 사진을 올리거나 단어를 입력해보세요!</p>
      </div>
    )
  }

  function restart() {
    setPhase('round1')
    setLinearQueue(shuffledIds(pool))
    setLinearIndex(0)
    setReviewQueue([])
    setNeedsReview(new Set(pool.map((w) => w.id)))
    setFlipped(false)
  }

  function answer(know: boolean) {
    if (!currentWord) return
    dispatch({ type: 'BUMP_FAMILIARITY', id: currentWord.id, delta: know ? 1 : -1 })
    setFlipped(false)

    if (phase === 'round1' || phase === 'round2') {
      const updatedNeedsReview = new Set(needsReview)
      if (know) updatedNeedsReview.delete(currentWord.id)
      else updatedNeedsReview.add(currentWord.id)
      setNeedsReview(updatedNeedsReview)

      const nextIndex = linearIndex + 1
      if (nextIndex < linearQueue.length) {
        setLinearIndex(nextIndex)
        return
      }
      if (phase === 'round1') {
        setPhase('round2')
        setLinearQueue(shuffledIds(pool))
        setLinearIndex(0)
        return
      }
      // 2라운드까지 다 봤으니, 아직 "다시 볼래요"였던 단어만 모아서 복습 단계로 넘어간다.
      const reviewIds = shuffle([...updatedNeedsReview])
      if (reviewIds.length === 0) {
        setPhase('done')
      } else {
        setPhase('review')
        setReviewQueue(reviewIds)
      }
      return
    }

    // 복습 단계: "알아요"면 목록에서 빼고, "다시 볼래요"면 맨 뒤로 보내서 계속 돈다.
    const rest = reviewQueue.slice(1)
    const updated = know ? rest : [...rest, currentWord.id]
    setReviewQueue(updated)
    if (updated.length === 0) setPhase('done')
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-8 sm:px-6">
      {dateGroups.length > 0 && (
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

      {pool.length === 0 ? (
        <p className="py-16 text-slate-400">이 날짜에는 카드가 없어요.</p>
      ) : phase === 'done' ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-emerald-50 py-16 text-center">
          <span className="text-5xl">🎉</span>
          <p className="font-display text-xl text-emerald-600">이 단어들은 다 익혔어요!</p>
          <button onClick={restart} className="mt-2 rounded-full bg-emerald-500 px-6 py-2 font-bold text-white">
            다시 학습하기
          </button>
        </div>
      ) : !currentWord ? null : (
        <>
          <p className="text-sm font-bold text-slate-400">
            {phase === 'round1' && `1번째 보기 · ${linearIndex + 1}/${linearQueue.length}`}
            {phase === 'round2' && `2번째 보기 · ${linearIndex + 1}/${linearQueue.length}`}
            {phase === 'review' && `복습 중 · 남은 단어 ${reviewQueue.length}개`}
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
              onClick={() => answer(false)}
              className="no-select flex-1 rounded-2xl border-2 border-amber-300 bg-amber-50 py-4 text-lg font-bold text-amber-600 transition-transform active:scale-95"
            >
              🔁 다시 볼래요
            </button>
            <button
              onClick={() => answer(true)}
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
