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

const CHUNK_LOAD_ERROR_PATTERN = /failed to fetch dynamically imported module|loading chunk|error loading dynamically imported module|importing a module script failed/i;
const CHUNK_RETRY_STORAGE_KEY = 'chunk-load-retry-at';
const CHUNK_RETRY_WINDOW_MS = 10_000;

function isChunkLoadError(error: Error): boolean {
    return CHUNK_LOAD_ERROR_PATTERN.test(error.message);
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

        if (isChunkLoadError(error)) {
            const lastRetryAt = Number(sessionStorage.getItem(CHUNK_RETRY_STORAGE_KEY) || 0);
            const withinRetryWindow = Date.now() - lastRetryAt < CHUNK_RETRY_WINDOW_MS;

            if (!withinRetryWindow) {
                sessionStorage.setItem(CHUNK_RETRY_STORAGE_KEY, String(Date.now()));
                window.location.reload();
            }
        }
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const error = this.state.error;
            const isAutoRetrying = error && isChunkLoadError(error) &&
                Date.now() - Number(sessionStorage.getItem(CHUNK_RETRY_STORAGE_KEY) || 0) < CHUNK_RETRY_WINDOW_MS;

            if (isAutoRetrying) {
                return (
                    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                        <p className="text-sm text-slate-500">Memuat ulang halaman...</p>
                    </div>
                );
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
