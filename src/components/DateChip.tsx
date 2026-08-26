interface Props {
  label: string
  active: boolean
  onClick: () => void
}

export default function DateChip({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`no-select shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
        active ? 'border-sky-500 bg-sky-500 text-white' : 'border-slate-200 bg-white text-slate-500'
      }`}
    >
      {label}
    </button>
  )
}
