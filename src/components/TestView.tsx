import { useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import QuizQuestion from './QuizQuestion'
import DateChip from './DateChip'
import { useWords } from '../store/wordStore'
import { buildQuizQuestions, generateId } from '../utils/words'
import type { QuizQuestion as QuizQuestionType } from '../utils/words'
import { dateKeyOf, formatDateShort, groupWordsByDate } from '../utils/dateGroups'
import type { QuizResult } from '../types'

type Stage = 'setup' | 'in-progress' | 'result'

export default function TestView() {
  const { state, dispatch } = useWords()
  const dateGroups = useMemo(() => groupWordsByDate(state.words), [state.words])

  const [selectedDate, setSelectedDate] = useState<string>(dateGroups[0]?.date ?? 'all')
  const [stage, setStage] = useState<Stage>('setup')
  const [questions, setQuestions] = useState<QuizQuestionType[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [missed, setMissed] = useState<string[]>([])

  const pool = useMemo(
    () => (selectedDate === 'all' ? state.words : state.words.filter((w) => dateKeyOf(w) === selectedDate)),
    [state.words, selectedDate],
  )

  function start() {
    // 특정 날짜를 골랐으면 그날 등록한 단어 전체가 다 나오고,
    // '전체'를 섞어서 볼 때는 너무 길어지지 않게 최대 20문제로 제한한다.
    const count = selectedDate === 'all' ? Math.min(20, pool.length) : pool.length
    setQuestions(buildQuizQuestions(pool, count))
    setQIndex(0)
    setCorrectCount(0)
    setMissed([])
    setStage('in-progress')
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

        <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
          <p className="font-display text-xl text-slate-700">
            {selectedDate === 'all' ? '지금까지 모은 모든 단어를 섞어서' : `${formatDateShort(selectedDate)}에 등록한 단어`}
          </p>
          <p className="mt-1 text-slate-400">
            {selectedDate === 'all'
              ? `${Math.min(20, pool.length)}문제로 테스트해요`
              : `${pool.length}개 전부 테스트해요`}
          </p>

          {pool.length < 2 ? (
            <p className="mt-4 text-sm text-amber-500">테스트하려면 단어가 2개 이상 필요해요.</p>
          ) : (
            <button
              onClick={start}
              className="mt-4 rounded-full bg-sky-500 px-8 py-3 text-lg font-bold text-white active:scale-95"
            >
              테스트 시작
            </button>
          )}
        </div>
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
