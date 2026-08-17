import { useState } from 'react'
import BottomNav from './components/BottomNav'
import type { ViewKey } from './components/BottomNav'
import FlashcardView from './components/FlashcardView'
import AddWordsView from './components/AddWordsView'
import TestView from './components/TestView'
import WordBookView from './components/WordBookView'
import StatsView from './components/StatsView'
import { calcStreak, useWords } from './store/wordStore'

function App() {
  const [view, setView] = useState<ViewKey>('cards')
  const { state } = useWords()
  const streak = calcStreak(state.studyDates)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-50 via-indigo-50/40 to-white">
      <header className="sticky top-0 z-20 border-b-2 border-sky-100 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="font-display text-2xl text-slate-800 sm:text-3xl">🐝 {state.kidName}의 영어 단어 놀이터</p>
            <p className="text-sm text-slate-400">모은 단어 {state.words.length}개</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-orange-100 px-4 py-2 font-bold text-orange-600">
            🔥 {streak}일
          </div>
        </div>
      </header>

      <main className="flex-1">
        {view === 'cards' && <FlashcardView />}
        {view === 'add' && <AddWordsView />}
        {view === 'test' && <TestView />}
        {view === 'book' && <WordBookView />}
        {view === 'stats' && <StatsView />}
      </main>

      <BottomNav active={view} onChange={setView} />
    </div>
  )
}

export default App
