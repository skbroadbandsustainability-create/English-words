import { useMemo } from 'react'
import { useWords } from '../store/wordStore'
import { MONSTERS, RARITY_LABEL } from '../data/monsters'
import type { MonsterRarity } from '../data/monsters'

const RARITY_ORDER: MonsterRarity[] = ['legendary', 'rare', 'common']

export default function MonsterDexView() {
  const { state } = useWords()

  const countByMonsterId = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of state.monsterDex) {
      map.set(c.monsterId, (map.get(c.monsterId) ?? 0) + 1)
    }
    return map
  }, [state.monsterDex])

  const ownedCount = countByMonsterId.size

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 sm:px-6">
      <div className="rounded-3xl bg-white p-5 text-center shadow-sm">
        <p className="font-display text-xl text-slate-700">몬스터 도감</p>
        <p className="mt-1 text-slate-400">
          {ownedCount} / {MONSTERS.length}마리 모았어요
        </p>
        <p className="mt-1 text-xs text-slate-400">테스트에서 90% 이상 맞히면 몬스터볼을 뽑을 수 있어요</p>
      </div>

      {RARITY_ORDER.map((rarity) => (
        <section key={rarity} className="flex flex-col gap-2">
          <p className="text-sm font-bold text-slate-400">{RARITY_LABEL[rarity]}</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {MONSTERS.filter((m) => m.rarity === rarity).map((m) => {
              const count = countByMonsterId.get(m.id) ?? 0
              const owned = count > 0
              return (
                <div
                  key={m.id}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center ${
                    owned ? 'border-sky-100 bg-white' : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <span className={`text-3xl ${owned ? '' : 'opacity-30 grayscale'}`}>{owned ? m.emoji : '❓'}</span>
                  <span className={`text-xs font-bold ${owned ? 'text-slate-700' : 'text-slate-300'}`}>
                    {owned ? m.name : '???'}
                  </span>
                  {owned && count > 1 && <span className="text-[10px] text-slate-400">x{count}</span>}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
