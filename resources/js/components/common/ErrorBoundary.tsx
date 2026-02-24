import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                        <AlertCircle className="h-7 w-7 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Terjadi Kesalahan
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-slate-500">
                            {this.state.error?.message || 'Halaman tidak dapat ditampilkan.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            this.setState({ hasError: false, error: null });
                            window.location.reload();
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Muat Ulang
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
