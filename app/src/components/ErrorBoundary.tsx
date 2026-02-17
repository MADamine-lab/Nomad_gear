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
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f8f9fa',
          color: '#333',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Something went wrong</h1>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
            {this.state.error?.message}
          </p>
          <details style={{
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '20px',
            maxWidth: '600px',
            textAlign: 'left',
            overflow: 'auto'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              marginTop: '10px',
              fontSize: '12px'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
            Check the browser console for more details
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
