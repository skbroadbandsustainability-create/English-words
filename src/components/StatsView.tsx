import { calcStreak, useWords } from '../store/wordStore'
import { formatDateShort } from '../utils/dateGroups'
import type { QuizDirection, QuizResult, WordEntry } from '../types'

function formatTakenAt(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`
}

function scopeLabel(scope: string): string {
  return scope === 'all' ? '전체' : `${formatDateShort(scope)} 등록분`
}

function directionLabel(direction: QuizDirection): string {
  if (direction === 'meaningToWord') return '뜻 → 단어'
  if (direction === 'fillBlank') return '빈칸 채우기'
  return '단어 → 뜻'
}

export default function StatsView() {
  const { state } = useWords()
  const streak = calcStreak(state.studyDates)
  const recentResults = [...state.quizResults].slice(-10).reverse()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="🔥" label="연속 학습일" value={`${streak}일`} />
        <StatCard icon="📚" label="모은 단어" value={`${state.words.length}개`} />
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="mb-3 font-display text-lg text-slate-700">최근 테스트 기록</p>
        {recentResults.length === 0 ? (
          <p className="text-sm text-slate-400">아직 테스트한 기록이 없어요</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentResults.map((r) => (
              <QuizResultCard key={r.id} result={r} words={state.words} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function QuizResultCard({ result, words }: { result: QuizResult; words: WordEntry[] }) {
  const missedWords = result.missedWordIds
    .map((id) => words.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => Boolean(w))
  const pct = result.total ? result.correct / result.total : 0

  return (
    <div className="rounded-2xl border-2 border-slate-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-slate-700">
            {scopeLabel(result.scope)} · {directionLabel(result.direction)}
          </p>
          <p className="text-xs text-slate-400">{formatTakenAt(result.takenAt)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            pct >= 0.7 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
          }`}
        >
          {result.correct}/{result.total}
        </span>
      </div>

      {missedWords.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1 border-t border-slate-100 pt-2">
          {missedWords.map((w) => (
            <li key={w.id} className="text-sm text-slate-600">
              <span className="font-bold">{w.word}</span> — {w.meaningKo ?? w.definitionEn}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 border-t border-slate-100 pt-2 text-sm text-emerald-600">🎉 다 맞혔어요!</p>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 text-center shadow-sm">
      <p className="text-3xl">{icon}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
      <p className="font-display text-2xl text-slate-800">{value}</p>
    </div>
  )
}
