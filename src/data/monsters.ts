export type MonsterRarity = 'common' | 'rare' | 'legendary'

export interface Monster {
  id: string
  name: string
  emoji: string
  rarity: MonsterRarity
}

// 실제 포켓몬 캐릭터를 쓰지 않고, 이모지 기반의 오리지널 몬스터 도감을 만들었다.
// 너무 빨리 다 모으면 재미가 없어서 60종(일반 30 / 레어 20 / 전설 10)으로 넉넉하게 준비했다.
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
  { id: 'mouse', name: '찍찍생쥐', emoji: '🐭', rarity: 'common' },
  { id: 'hamster', name: '볼빵빵햄스터', emoji: '🐹', rarity: 'common' },
  { id: 'cat', name: '까망고양이', emoji: '🐱', rarity: 'common' },
  { id: 'dog', name: '멍멍강아지', emoji: '🐶', rarity: 'common' },
  { id: 'pig', name: '꿀꿀돼지', emoji: '🐷', rarity: 'common' },
  { id: 'sheep', name: '복슬복슬양', emoji: '🐑', rarity: 'common' },
  { id: 'goat', name: '수염염소', emoji: '🐐', rarity: 'common' },
  { id: 'chick', name: '삐약병아리', emoji: '🐤', rarity: 'common' },
  { id: 'duck', name: '뒤뚱오리', emoji: '🦆', rarity: 'common' },
  { id: 'swan', name: '우아한백조', emoji: '🦢', rarity: 'common' },
  { id: 'parrot', name: '수다쟁이앵무', emoji: '🦜', rarity: 'common' },
  { id: 'rooster', name: '꼬끼오수탉', emoji: '🐓', rarity: 'common' },
  { id: 'turkey', name: '칠면조', emoji: '🦃', rarity: 'common' },
  { id: 'snake', name: '쉭쉭뱀', emoji: '🐍', rarity: 'common' },
  { id: 'cricket', name: '폴짝귀뚜라미', emoji: '🦗', rarity: 'common' },
  { id: 'spider', name: '거미줄거미', emoji: '🕷️', rarity: 'common' },
  { id: 'ant', name: '부지런개미', emoji: '🐜', rarity: 'common' },
  { id: 'fish', name: '반짝물고기', emoji: '🐟', rarity: 'common' },

  { id: 'wolf', name: '은빛늑대', emoji: '🐺', rarity: 'rare' },
  { id: 'otter', name: '물장난수달', emoji: '🦦', rarity: 'rare' },
  { id: 'panda', name: '느긋판다', emoji: '🐼', rarity: 'rare' },
  { id: 'koala', name: '잠꾸러기코알라', emoji: '🐨', rarity: 'rare' },
  { id: 'bear', name: '북극곰돌이', emoji: '🐻', rarity: 'rare' },
  { id: 'lion', name: '황금사자', emoji: '🦁', rarity: 'rare' },
  { id: 'tiger', name: '줄무늬호랑이', emoji: '🐯', rarity: 'rare' },
  { id: 'elephant', name: '거대코끼리', emoji: '🐘', rarity: 'rare' },
  { id: 'shark', name: '쌩쌩상어', emoji: '🦈', rarity: 'rare' },
  { id: 'crocodile', name: '악어친구', emoji: '🐊', rarity: 'rare' },
  { id: 'camel', name: '쌍봉낙타', emoji: '🐫', rarity: 'rare' },
  { id: 'llama', name: '보송라마', emoji: '🦙', rarity: 'rare' },
  { id: 'giraffe', name: '키다리기린', emoji: '🦒', rarity: 'rare' },
  { id: 'rhino', name: '코뿔소', emoji: '🦏', rarity: 'rare' },
  { id: 'hippo', name: '하마', emoji: '🦛', rarity: 'rare' },
  { id: 'buffalo', name: '물소', emoji: '🐃', rarity: 'rare' },
  { id: 'ox', name: '황소', emoji: '🐂', rarity: 'rare' },
  { id: 'horse', name: '날쌘말', emoji: '🐴', rarity: 'rare' },
  { id: 'zebra', name: '줄무늬얼룩말', emoji: '🦓', rarity: 'rare' },
  { id: 'boar', name: '멧돼지', emoji: '🐗', rarity: 'rare' },

  { id: 'dragon', name: '전설의 용', emoji: '🐉', rarity: 'legendary' },
  { id: 'dino', name: '고대 공룡', emoji: '🦖', rarity: 'legendary' },
  { id: 'whale', name: '신비한 고래', emoji: '🐋', rarity: 'legendary' },
  { id: 'unicorn', name: '무지개 유니콘', emoji: '🦄', rarity: 'legendary' },
  { id: 'eagle', name: '하늘의 독수리', emoji: '🦅', rarity: 'legendary' },
  { id: 'peacock', name: '화려한 공작', emoji: '🦚', rarity: 'legendary' },
  { id: 'flamingo', name: '분홍 플라밍고', emoji: '🦩', rarity: 'legendary' },
  { id: 'spouting-whale', name: '거대 향고래', emoji: '🐳', rarity: 'legendary' },
  { id: 'seal', name: '바다 물범요정', emoji: '🦭', rarity: 'legendary' },
  { id: 'baby-dragon', name: '아기 드래곤', emoji: '🐲', rarity: 'legendary' },
]

export const RARITY_LABEL: Record<MonsterRarity, string> = {
  common: '일반',
  rare: '레어',
  legendary: '전설',
}
