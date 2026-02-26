import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRouter } from '@/router';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AppRouter />
                <Toaster
                    position="top-right"
                    richColors
                    closeButton
                    toastOptions={{
                        className: 'font-sans',
                    }}
                />
            </BrowserRouter>
        </QueryClientProvider>
    );
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );

    // Fade out and remove splash screen
    const splash = document.getElementById('splash');
    if (splash) {
        splash.classList.add('hide');
        splash.addEventListener('transitionend', () => splash.remove(), { once: true });
    }
}
