import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-5"
                    style={{ background: 'var(--color-bg)' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 20,
                        background: 'rgba(239,68,68,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28,
                    }}>
                        ⚠
                    </div>
                    <div>
                        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                            Algo salió mal
                        </h1>
                        <p style={{ fontSize: 14, color: 'var(--color-text-tertiary)', maxWidth: 280 }}>
                            Por favor recarga la página para continuar.
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: 'var(--color-gold)',
                            color: 'var(--color-bg)',
                            border: 'none',
                            borderRadius: 14,
                            padding: '14px 32px',
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Recargar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
