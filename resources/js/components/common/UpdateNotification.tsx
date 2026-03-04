import { RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export function UpdateNotification() {
    const { updateAvailable, reload } = useVersionCheck();

    return (
        <AnimatePresence>
            {updateAvailable && (
                <motion.div
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -80, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center bg-blue-600 px-4 py-2.5 text-white shadow-lg print:hidden"
                >
                    <div className="flex items-center gap-3 text-sm">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Versi terbaru tersedia.</span>
                        <button
                            onClick={reload}
                            className="rounded-md bg-white/20 px-3 py-1 text-sm font-semibold hover:bg-white/30 transition-colors"
                        >
                            Muat Ulang
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
