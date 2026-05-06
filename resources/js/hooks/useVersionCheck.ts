import { useEffect, useRef, useState } from 'react';

// =============================================================================
// useVersionCheck – detects new deployments by comparing script hashes
// =============================================================================

/**
 * Extracts the hash portion from Vite-bundled script filenames in raw HTML.
 * E.g. from `<script src="/build/assets/app-DO2FFU2V.js">` → "DO2FFU2V"
 */
function extractScriptHashes(html: string): string {
    const matches = [...html.matchAll(/\/build\/assets\/[^"']*?-([A-Za-z0-9_-]+)\.(js|css)/g)];
    return matches.map((m) => m[1]).sort().join(',');
}

async function fetchPageHash(): Promise<string | null> {
    try {
        const res = await fetch('/?_vc=' + Date.now(), {
            cache: 'no-store',
            headers: { Accept: 'text/html' },
        });
        if (!res.ok) return null;
        const html = await res.text();
        const hash = extractScriptHashes(html);
        return hash || null;
    } catch {
        return null;
    }
}

const CHECK_INTERVAL = 5 * 60 * 1000; // check every 5 minutes

export function useVersionCheck() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const baselineHash = useRef<string | null>(null);
    const initialized = useRef(false);

    useEffect(() => {
        // Don't run in development
        if ((import.meta as any).env?.DEV) return;

        // Fetch baseline on mount
        const init = async () => {
            baselineHash.current = await fetchPageHash();
            initialized.current = true;
        };
        init();

        const check = async () => {
            if (!initialized.current || !baselineHash.current) return;

            const currentHash = await fetchPageHash();
            if (currentHash && currentHash !== baselineHash.current) {
                setUpdateAvailable(true);
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
