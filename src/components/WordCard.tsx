import type { WordEntry } from '../types'

interface Props {
  word: WordEntry
  flipped: boolean
  onFlip: () => void
}

export default function WordCard({ word, flipped, onFlip }: Props) {
  return (
    <button
      onClick={onFlip}
      className={`flip-card no-select h-72 w-full max-w-sm ${flipped ? 'flipped' : ''}`}
      aria-label="카드를 눌러 뜻 보기"
    >
      <div className="flip-card-inner relative h-full w-full">
        <div className="flip-card-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-sky-200 bg-white p-6 shadow-md">
          {word.partOfSpeech && (
            <span className="rounded-full bg-sky-100 px-3 py-0.5 text-sm font-bold text-sky-600">
              {word.partOfSpeech}
            </span>
          )}
          <p className="font-display text-4xl text-slate-800 sm:text-5xl">{word.word}</p>
          {word.phonetic && <p className="text-lg text-slate-400">{word.phonetic}</p>}
          <p className="mt-4 text-sm text-slate-300">👆 눌러서 뜻 보기</p>
        </div>
        <div className="flip-card-face flip-card-back absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-6 shadow-md">
          <p className="font-display text-2xl text-slate-800">{word.word}</p>
          {word.meaningKo && <p className="text-xl font-bold text-emerald-700">{word.meaningKo}</p>}
          <p className="text-center text-base text-slate-600">{word.definitionEn}</p>
          {word.synonyms.length > 0 && (
            <p className="text-center text-sm text-slate-500">비슷한 말: {word.synonyms.join(', ')}</p>
          )}
          {word.antonyms.length > 0 && (
            <p className="text-center text-sm text-slate-500">반대말: {word.antonyms.join(', ')}</p>
          )}
        </div>
      </div>
    </button>
  )
}
