import { useEffect, useRef, useState } from 'react';

// =============================================================================
// useVersionCheck – detects new deployments by comparing script hashes
// =============================================================================

/**
 * Extracts the hash portion from Vite-bundled script filenames.
 * E.g. from `<script src="/build/assets/app-DO2FFU2V.js">` → "DO2FFU2V"
 */
function extractScriptHashes(html: string): string[] {
    const matches = [...html.matchAll(/\/build\/assets\/[^"']*?-([A-Za-z0-9_-]+)\.(js|css)/g)];
    return matches.map((m) => m[1]).sort();
}

function getCurrentHashes(): string[] {
    const scripts = document.querySelectorAll('script[src*="/build/assets/"]');
    const links = document.querySelectorAll('link[href*="/build/assets/"]');
    const hashes: string[] = [];

    scripts.forEach((el) => {
        const src = el.getAttribute('src') || '';
        const match = src.match(/-([A-Za-z0-9_-]+)\.js/);
        if (match) hashes.push(match[1]);
    });

    links.forEach((el) => {
        const href = el.getAttribute('href') || '';
        const match = href.match(/-([A-Za-z0-9_-]+)\.css/);
        if (match) hashes.push(match[1]);
    });

    return hashes.sort();
}

const CHECK_INTERVAL = 60 * 1000; // check every 60 seconds

export function useVersionCheck() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const initialHashes = useRef<string[]>(getCurrentHashes());

    useEffect(() => {
        // Don't run in development
        if (import.meta.env.DEV) return;

        const check = async () => {
            try {
                const res = await fetch('/?_version_check=' + Date.now(), {
                    cache: 'no-store',
                    headers: { Accept: 'text/html' },
                });
                if (!res.ok) return;

                const html = await res.text();
                const newHashes = extractScriptHashes(html);
                const currentHashes = initialHashes.current;

                if (
                    currentHashes.length > 0 &&
                    newHashes.length > 0 &&
                    currentHashes.join(',') !== newHashes.join(',')
                ) {
                    setUpdateAvailable(true);
                }
            } catch {
                // Silently ignore network errors
            }
        };

        const interval = setInterval(check, CHECK_INTERVAL);

        // Also check on visibility change (user comes back to tab)
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                check();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    const reload = () => {
        window.location.reload();
    };

    return { updateAvailable, reload };
}
