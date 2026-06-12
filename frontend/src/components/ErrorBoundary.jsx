import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Erro inesperado ao renderizar a aplicacao.',
    };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#0a0e1a',
            color: '#f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              padding: 24,
              borderRadius: 16,
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: 'rgba(10, 14, 26, 0.9)',
            }}
          >
            <h1 style={{ fontSize: '1.25rem', marginBottom: 12 }}>Algo deu errado</h1>
            <p style={{ color: '#94a3b8', marginBottom: 20, lineHeight: 1.6 }}>
              {this.state.message}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => window.location.reload()}
            >
              Recarregar pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
