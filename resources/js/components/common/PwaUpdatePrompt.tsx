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
    const handleUpdate = useCallback(() => {
        toast.info('Update tersedia! Klik untuk memperbarui.', {
            duration: Infinity,
            action: {
                label: 'Perbarui',
                onClick: () => {
                    window.location.reload();
                },
            },
        });
    }, []);

    useEffect(() => {
        // Detect when a new service worker takes over
        if ('serviceWorker' in navigator) {
            const handleControllerChange = () => {
                handleUpdate();
            };

            navigator.serviceWorker.addEventListener(
                'controllerchange',
                handleControllerChange,
            );

            // Also check on first load if an update is already waiting
            navigator.serviceWorker.ready.then((registration) => {
                if (registration.waiting) {
                    handleUpdate();
                }

                // Listen for future updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (
                            newWorker.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            handleUpdate();
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
        }
    }, [handleUpdate]);

    // This component renders nothing -- it only triggers toasts.
    return null;
}
