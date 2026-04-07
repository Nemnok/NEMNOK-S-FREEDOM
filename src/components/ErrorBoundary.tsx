import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            fontFamily: 'monospace',
            padding: '2rem',
            background: '#1e1e2e',
            color: '#f38ba8',
            minHeight: '100vh',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            ⚠ Something went wrong
          </h1>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#181825',
              padding: '1rem',
              borderRadius: '4px',
            }}
          >
            {this.state.error?.stack ?? String(this.state.error)}
          </pre>
          <button
            onClick={() =>
              this.setState((s) => ({
                hasError: false,
                error: null,
                retryKey: s.retryKey + 1,
              }))
            }
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#cba6f7',
              color: '#1e1e2e',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}
