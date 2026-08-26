import { useState } from 'react'
import type { QuizQuestion as QuizQuestionType } from '../utils/words'
import { playPronunciation } from '../services/speech'

interface Props {
  question: QuizQuestionType
  index: number
  total: number
  onAnswered: (correct: boolean) => void
}

export default function QuizQuestion({ question, index, total, onAnswered }: Props) {
  const [selected, setSelected] = useState<number | null>(null)

  function choose(choiceIndex: number) {
    if (selected !== null) return
    setSelected(choiceIndex)
  }

  function next() {
    if (selected === null) return
    onAnswered(selected === question.answerIndex)
  }

  const isCorrectChoice = selected !== null && selected === question.answerIndex

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-sm font-bold text-slate-400">
        {index + 1} / {total}
      </p>

      <div className="flex flex-col items-center gap-2 rounded-3xl bg-white p-6 text-center shadow-sm">
        {question.direction === 'wordToMeaning' ? (
          <>
            <p className="font-display text-3xl text-slate-800 sm:text-4xl">{question.prompt}</p>
            <button
              onClick={() => playPronunciation(question.word.word, question.word.audioUrl)}
              className="no-select rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-600"
            >
              🔊 발음 듣기
            </button>
          </>
        ) : (
          // 뜻→단어 문제에서는 발음을 들려주면 답이 그대로 드러나니 발음 버튼은 숨긴다.
          <p className="text-xl font-bold text-slate-800 sm:text-2xl">{question.prompt}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {question.choices.map((choice, i) => {
          const isSelected = selected === i
          const isAnswer = i === question.answerIndex
          let style = 'border-slate-200 bg-white text-slate-700'
          if (selected !== null && isAnswer) style = 'border-emerald-400 bg-emerald-50 text-emerald-700'
          else if (isSelected) style = 'border-rose-400 bg-rose-50 text-rose-600'

          return (
            <button
              key={choice + i}
              onClick={() => choose(i)}
              disabled={selected !== null}
              className={`rounded-2xl border-2 px-4 py-4 text-left text-lg font-bold transition-colors ${style}`}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <button
          onClick={next}
          className={`no-select rounded-2xl py-4 text-lg font-bold text-white transition-transform active:scale-95 ${
            isCorrectChoice ? 'bg-emerald-500' : 'bg-sky-500'
          }`}
        >
          {isCorrectChoice ? '🎉 다음 문제' : '정답 확인했어요, 다음 문제'}
        </button>
      )}
    </div>
  )
}
