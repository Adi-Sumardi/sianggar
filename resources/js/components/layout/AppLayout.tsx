import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar, MobileSidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { GlobalDiscussionButton } from '@/components/common/GlobalDiscussionButton';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useSidebarStore } from '@/stores/sidebarStore';
import { pageVariants, pageTransition } from '@/lib/animations';
import { cn } from '@/lib/utils';

function PageLoader() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
    );
}

export function AppLayout() {
    const location = useLocation();
    const { isCollapsed, setMobileOpen } = useSidebarStore();

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname, setMobileOpen]);

    return (
        <div className="min-h-screen bg-background">
            {/* Top navbar */}
            <div className="print:hidden">
                <Navbar />
            </div>

            {/* Desktop sidebar */}
            <div className="print:hidden">
                <Sidebar />
            </div>

            {/* Mobile sidebar overlay */}
            <div className="print:hidden">
                <MobileSidebar />
            </div>

            {/* Main content area */}
            <main
                className={cn(
                    'pt-16 transition-[margin-left] duration-300 ease-out',
                    'pb-20 sm:pb-0',
                    isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[272px]',
                    'print:ml-0! print:pt-0! print:pb-0!',
                )}
            >
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 print:max-w-none! print:px-0! print:py-0!">
                    <ErrorBoundary key={location.pathname}>
                        <Suspense fallback={<PageLoader />}>
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={location.pathname}
                                    initial="initial"
                                    animate="animate"
                                    exit="exit"
                                    variants={pageVariants}
                                    transition={pageTransition}
                                >
                                    <Outlet />
                                </motion.div>
                            </AnimatePresence>
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </main>

            {/* Mobile bottom navigation */}
            <div className="print:hidden">
                <BottomNav />
            </div>

            {/* Global Discussion Floating Button */}
            <div className="print:hidden">
                <GlobalDiscussionButton />
            </div>
        </div>
    );
}
