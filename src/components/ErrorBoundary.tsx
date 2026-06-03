import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 32,
          textAlign: 'center',
          background: 'var(--bx-bg)',
          color: 'var(--bx-color)',
          fontFamily: 'var(--font-effra)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>⚠</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: 'var(--bx-muted)', marginBottom: 24, maxWidth: 400 }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.href = '/'
            }}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--bx-accent)',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Go to Homepage
          </button>
          {this.state.error && (
            <details style={{ marginTop: 24, fontSize: 12, color: 'var(--bx-muted)', maxWidth: 500 }}>
              <summary>Error details</summary>
              <pre style={{ marginTop: 8, padding: 12, background: 'rgba(0,0,0,0.05)', borderRadius: 6, overflow: 'auto' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
