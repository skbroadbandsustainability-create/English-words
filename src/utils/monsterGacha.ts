import { MONSTERS } from '../data/monsters'
import type { Monster, MonsterRarity } from '../data/monsters'

// 등급별 뽑힐 확률(%). 일반이 가장 잘 나오고, 전설은 아주 가끔만 나오게 한다.
const RARITY_WEIGHTS: Record<MonsterRarity, number> = { common: 70, rare: 25, legendary: 5 }

export function pullRandomMonster(): Monster {
  const roll = Math.random() * 100
  const rarity: MonsterRarity =
    roll < RARITY_WEIGHTS.legendary ? 'legendary' : roll < RARITY_WEIGHTS.legendary + RARITY_WEIGHTS.rare ? 'rare' : 'common'

  const pool = MONSTERS.filter((m) => m.rarity === rarity)
  return pool[Math.floor(Math.random() * pool.length)]
}
