import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Listens for a new service worker becoming available (via the
 * `controllerchange` event) and shows a Sonner toast prompting the user to
 * reload. Because VitePWA is configured with `registerType: 'autoUpdate'`,
 * the new SW is installed automatically -- this component simply surfaces the
 * reload prompt so the user can pick up the latest assets.
 */
export function PwaUpdatePrompt() {
    const promptReload = useCallback((waitingWorker: ServiceWorker) => {
        toast.info('Update tersedia! Klik untuk memperbarui.', {
            duration: Infinity,
            action: {
                label: 'Perbarui',
                onClick: () => {
                    // Tell the waiting SW to activate; the resulting
                    // `controllerchange` event below triggers the reload.
                    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                },
            },
        });
    }, []);

    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        let reloaded = false;
        const handleControllerChange = () => {
            // Guard against the browser firing this more than once.
            if (reloaded) return;
            reloaded = true;
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener(
            'controllerchange',
            handleControllerChange,
        );

        navigator.serviceWorker.ready.then((registration) => {
            if (registration.waiting) {
                promptReload(registration.waiting);
            }

            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (
                        newWorker.state === 'installed' &&
                        navigator.serviceWorker.controller
                    ) {
                        promptReload(newWorker);
                    }
                });
            });
        });

        return () => {
            navigator.serviceWorker.removeEventListener(
                'controllerchange',
                handleControllerChange,
            );
        };
    }, [promptReload]);

    // This component renders nothing -- it only triggers toasts.
    return null;
}
