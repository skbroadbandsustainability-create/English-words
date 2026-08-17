export type ViewKey = 'cards' | 'add' | 'test' | 'book' | 'stats'

const ITEMS: { key: ViewKey; label: string; icon: string }[] = [
  { key: 'cards', label: '카드', icon: '🃏' },
  { key: 'add', label: '단어 추가', icon: '📸' },
  { key: 'test', label: '테스트', icon: '📝' },
  { key: 'book', label: '단어장', icon: '📖' },
  { key: 'stats', label: '기록', icon: '📊' },
]

interface Props {
  active: ViewKey
  onChange: (key: ViewKey) => void
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="sticky bottom-0 z-30 border-t-2 border-sky-100 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-5">
        {ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`no-select flex flex-col items-center gap-1 py-3 text-xs font-bold transition-colors sm:text-sm ${
              active === item.key ? 'text-sky-600' : 'text-slate-400'
            }`}
          >
            <span className={`text-xl transition-transform sm:text-2xl ${active === item.key ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
