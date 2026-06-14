"use client"

import { type ReactNode, Component } from "react"

type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-6 py-5 text-center shadow-sm">
            <p className="text-sm font-medium text-[color:var(--text-primary)]">出错了</p>
            <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
              {this.state.error?.message || "发生了一个意外错误"}
            </p>
            <button
              type="button"
              className="mt-4 rounded-md bg-[color:var(--primary)] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
              onClick={this.handleRetry}
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
