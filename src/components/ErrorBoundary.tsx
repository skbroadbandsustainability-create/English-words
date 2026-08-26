import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * 화면이 아무 설명 없이 하얗게 죽는 걸 막는 마지막 안전망.
 * 렌더링 중 어디선가 예외가 나도, 최소한 무슨 문제인지 보여주고 새로고침/초기화 버튼을 제공한다.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('앱이 죽었어요:', error, info.componentStack)
  }

  resetData = () => {
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sky-50 px-6 text-center">
        <p className="text-5xl">😵</p>
        <p className="font-display text-xl text-slate-700">문제가 생겼어요</p>
        <p className="max-w-sm break-words text-sm text-slate-400">{error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-sky-500 px-6 py-3 font-bold text-white active:scale-95"
          >
            새로고침
          </button>
          <button
            onClick={this.resetData}
            className="rounded-full border-2 border-rose-300 px-6 py-3 font-bold text-rose-500 active:scale-95"
          >
            데이터 초기화
          </button>
        </div>
        <p className="max-w-sm text-xs text-slate-400">
          그래도 안 되면 이 화면을 캡처해서 보내주세요. "데이터 초기화"는 이 기기에 저장된 단어 기록을 지워요(클라우드에
          동기화된 내용은 남아있어요).
        </p>
      </div>
    )
  }
}
