export type MonsterRarity = 'common' | 'rare' | 'legendary'

export interface Monster {
  id: string
  name: string
  emoji: string
  rarity: MonsterRarity
}

// 실제 포켓몬 캐릭터를 쓰지 않고, 이모지 기반의 오리지널 몬스터 도감을 만들었다.
export const MONSTERS: Monster[] = [
  { id: 'frog', name: '개구리꼬마', emoji: '🐸', rarity: 'common' },
  { id: 'caterpillar', name: '꼬물애벌레', emoji: '🐛', rarity: 'common' },
  { id: 'ladybug', name: '점박이무당벌레', emoji: '🐞', rarity: 'common' },
  { id: 'butterfly', name: '팔랑나비', emoji: '🦋', rarity: 'common' },
  { id: 'octopus', name: '문어도치', emoji: '🐙', rarity: 'common' },
  { id: 'turtle', name: '느릿거북', emoji: '🐢', rarity: 'common' },
  { id: 'squirrel', name: '줄무늬다람쥐', emoji: '🐿️', rarity: 'common' },
  { id: 'raccoon', name: '너구리친구', emoji: '🦝', rarity: 'common' },
  { id: 'fox', name: '빨간여우', emoji: '🦊', rarity: 'common' },
  { id: 'rabbit', name: '솜뭉치토끼', emoji: '🐰', rarity: 'common' },
  { id: 'snail', name: '반짝달팽이', emoji: '🐌', rarity: 'common' },
  { id: 'bee', name: '붕붕꿀벌', emoji: '🐝', rarity: 'common' },

  { id: 'wolf', name: '은빛늑대', emoji: '🐺', rarity: 'rare' },
  { id: 'otter', name: '물장난수달', emoji: '🦦', rarity: 'rare' },
  { id: 'panda', name: '느긋판다', emoji: '🐼', rarity: 'rare' },
  { id: 'koala', name: '잠꾸러기코알라', emoji: '🐨', rarity: 'rare' },
  { id: 'bear', name: '북극곰돌이', emoji: '🐻', rarity: 'rare' },
  { id: 'lion', name: '황금사자', emoji: '🦁', rarity: 'rare' },
  { id: 'tiger', name: '줄무늬호랑이', emoji: '🐯', rarity: 'rare' },
  { id: 'elephant', name: '거대코끼리', emoji: '🐘', rarity: 'rare' },

  { id: 'dragon', name: '전설의 용', emoji: '🐉', rarity: 'legendary' },
  { id: 'dino', name: '고대 공룡', emoji: '🦖', rarity: 'legendary' },
  { id: 'whale', name: '신비한 고래', emoji: '🐋', rarity: 'legendary' },
  { id: 'unicorn', name: '무지개 유니콘', emoji: '🦄', rarity: 'legendary' },
]

export const RARITY_LABEL: Record<MonsterRarity, string> = {
  common: '일반',
  rare: '레어',
  legendary: '전설',
}
