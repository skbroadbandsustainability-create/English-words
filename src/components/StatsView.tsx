import { useMemo } from 'react'
import { calcStreak, useWords } from '../store/wordStore'

export default function StatsView() {
  const { state } = useWords()
  const streak = calcStreak(state.studyDates)
  const recentResults = state.quizResults.slice(-10)

  const missedCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of state.quizResults) {
      for (const id of r.missedWordIds) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ word: state.words.find((w) => w.id === id), count }))
      .filter((x): x is { word: NonNullable<typeof x.word>; count: number } => Boolean(x.word))
  }, [state.quizResults, state.words])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon="🔥" label="연속 학습일" value={`${streak}일`} />
        <StatCard icon="📚" label="모은 단어" value={`${state.words.length}개`} />
      </div>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="mb-3 font-display text-lg text-slate-700">최근 테스트 점수</p>
        {recentResults.length === 0 ? (
          <p className="text-sm text-slate-400">아직 테스트한 기록이 없어요</p>
        ) : (
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {recentResults.map((r) => {
              const pct = r.total ? r.correct / r.total : 0
              return (
                <div key={r.id} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-sky-400"
                    style={{ height: `${Math.max(6, pct * 100)}%` }}
                    title={`${r.correct}/${r.total}`}
                  />
                  <span className="text-[10px] text-slate-400">
                    {r.correct}/{r.total}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <p className="mb-3 font-display text-lg text-slate-700">자주 틀리는 단어</p>
        {missedCounts.length === 0 ? (
          <p className="text-sm text-slate-400">아직 데이터가 없어요</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {missedCounts.map(({ word, count }) => (
              <li key={word.id} className="flex items-center justify-between">
                <span className="font-bold text-slate-700">{word.word}</span>
                <span className="text-sm text-slate-400">{count}번 틀림</span>
              </li>
            ))}
          </ul>
        )}
      </section>
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
