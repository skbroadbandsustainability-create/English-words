import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import QuizQuestion from './QuizQuestion'
import DateChip from './DateChip'
import { useWords } from '../store/wordStore'
import { buildQuizQuestions, generateId, hasUsableExampleSentence } from '../utils/words'
import type { QuizDirection, QuizQuestion as QuizQuestionType } from '../utils/words'
import { dateKeyOf, formatDateShort, groupWordsByDate } from '../utils/dateGroups'
import { fetchExampleSentences } from '../services/aiWords'
import type { QuizResult, WordEntry } from '../types'

type Stage = 'setup' | 'loading' | 'in-progress' | 'result'

const DIRECTION_OPTIONS: { key: QuizDirection; label: string }[] = [
  { key: 'wordToMeaning', label: '단어 → 뜻' },
  { key: 'meaningToWord', label: '뜻 → 단어' },
  { key: 'fillBlank', label: '빈칸 채우기' },
]

export default function TestView() {
  const { state, dispatch } = useWords()
  const dateGroups = useMemo(() => groupWordsByDate(state.words), [state.words])

  const [selectedDate, setSelectedDate] = useState<string>(dateGroups[0]?.date ?? 'all')
  const [direction, setDirection] = useState<QuizDirection>('wordToMeaning')
  const [stage, setStage] = useState<Stage>('setup')
  const [error, setError] = useState<string | undefined>()
  const [questions, setQuestions] = useState<QuizQuestionType[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [missed, setMissed] = useState<string[]>([])

  const pool = useMemo(
    () => (selectedDate === 'all' ? state.words : state.words.filter((w) => dateKeyOf(w) === selectedDate)),
    [state.words, selectedDate],
  )

  function launch(withPool: WordEntry[]) {
    const count = selectedDate === 'all' ? Math.min(20, withPool.length) : withPool.length
    setQuestions(buildQuizQuestions(withPool, count, direction))
    setQIndex(0)
    setCorrectCount(0)
    setMissed([])
    setStage('in-progress')
  }

  async function start() {
    setError(undefined)

    if (direction !== 'fillBlank') {
      launch(pool)
      return
    }

    // 빈칸 채우기는 단어마다 예문이 있어야 해서, 없는 단어는 AI에게 새로 만들어달라고 요청한다.
    setStage('loading')
    try {
      const missing = pool.filter((w) => !hasUsableExampleSentence(w))
      const sentenceMap = missing.length > 0 ? await fetchExampleSentences(missing.map((w) => w.word)) : {}

      const merged = pool.map((w) => {
        if (hasUsableExampleSentence(w)) return w
        const sentence = sentenceMap[w.word]
        return sentence ? { ...w, exampleSentence: sentence } : w
      })
      merged.forEach((w, i) => {
        if (w.exampleSentence && w.exampleSentence !== pool[i].exampleSentence) {
          dispatch({ type: 'UPDATE_WORD', word: w })
        }
      })

      const usable = merged.filter(hasUsableExampleSentence)
      if (usable.length < 2) {
        setError('예문을 만들 수 있는 단어가 부족해요. 다른 유형으로 시도해보세요.')
        setStage('setup')
        return
      }
      launch(usable)
    } catch (err) {
      setError(err instanceof Error ? err.message : '예문을 만드는 중 문제가 생겼어요.')
      setStage('setup')
    }
  }

  function handleAnswered(correct: boolean) {
    if (correct) {
      setCorrectCount((c) => c + 1)
    } else {
      setMissed((m) => [...m, questions[qIndex].word.id])
    }

    if (qIndex + 1 < questions.length) {
      setQIndex((i) => i + 1)
      return
    }

    // 마지막 문제였으면 결과를 저장하고 결과 화면으로 이동
    const finalCorrect = correct ? correctCount + 1 : correctCount
    const result: QuizResult = {
      id: generateId(),
      scope: selectedDate,
      direction,
      total: questions.length,
      correct: finalCorrect,
      takenAt: new Date().toISOString(),
      missedWordIds: correct ? missed : [...missed, questions[qIndex].word.id],
    }
    dispatch({ type: 'RECORD_QUIZ_RESULT', result })
    dispatch({ type: 'MARK_STUDIED_TODAY' })
    if (finalCorrect / questions.length >= 0.7) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }
    setStage('result')
  }

  if (stage === 'setup') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
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

        <div className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
          {DIRECTION_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setDirection(opt.key)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors sm:text-base ${
                direction === opt.key ? 'bg-sky-500 text-white' : 'text-slate-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="font-display text-xl text-slate-700">
            {selectedDate === 'all' ? '지금까지 모은 모든 단어를 섞어서' : `${formatDateShort(selectedDate)}에 등록한 단어`}
          </p>
          <p className="mt-1 text-slate-400">
            {selectedDate === 'all'
              ? `${Math.min(20, pool.length)}문제로 테스트해요`
              : `${pool.length}개 전부 테스트해요`}
          </p>
          {direction === 'fillBlank' && (
            <p className="mt-1 text-xs text-slate-400">문장에 예문이 없는 단어는 AI가 시작할 때 새로 만들어요</p>
          )}

          {pool.length < 2 ? (
            <p className="mt-4 text-sm text-amber-500">테스트하려면 단어가 2개 이상 필요해요.</p>
          ) : (
            <button
              onClick={() => void start()}
              className="mt-4 rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white active:scale-95"
            >
              테스트 시작
            </button>
          )}
        </div>

        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">{error}</p>}
      </div>
    )
  }

  if (stage === 'loading') {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-16 text-center">
        <div className="h-3 w-40 overflow-hidden rounded-full bg-sky-100">
          <div className="h-full w-2/5 animate-pulse rounded-full bg-sky-400" />
        </div>
        <p className="font-bold text-slate-500">AI가 빈칸 채우기 예문을 만들고 있어요...</p>
      </div>
    )
  }

  if (stage === 'in-progress') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <QuizQuestion
          key={qIndex}
          question={questions[qIndex]}
          index={qIndex}
          total={questions.length}
          onAnswered={handleAnswered}
        />
      </div>
    )
  }

  const missedWords = state.words.filter((w) => missed.includes(w.id))

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-8 text-center sm:px-6">
      <p className="text-6xl">{correctCount === questions.length ? '🏆' : correctCount / questions.length >= 0.7 ? '🎉' : '💪'}</p>
      <p className="font-display text-2xl text-slate-800">
        {questions.length}문제 중 {correctCount}개 맞혔어요!
      </p>

      {missedWords.length > 0 && (
        <div className="w-full rounded-2xl bg-white p-4 text-left shadow-sm">
          <p className="mb-2 font-bold text-slate-500">다시 볼 단어</p>
          <ul className="flex flex-col gap-1">
            {missedWords.map((w) => (
              <li key={w.id} className="text-slate-600">
                <span className="font-bold">{w.word}</span> — {w.meaningKo ?? w.definitionEn}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setStage('setup')}
        className="rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white active:scale-95"
      >
        다시 하기
      </button>
    </div>
  )
}
