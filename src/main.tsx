import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { WordProvider } from './store/wordStore.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <WordProvider>
        <App />
      </WordProvider>
    </ErrorBoundary>
  </StrictMode>,
)
