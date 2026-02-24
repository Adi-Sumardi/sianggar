import { motion } from 'motion/react';
import { pageVariants, pageTransition } from '@/lib/animations';

interface PageTransitionProps {
    children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="h-full"
        >
            {children}
        </motion.div>
    );
}
