// ---------------------------------------------------------------------------
// Page transitions
// ---------------------------------------------------------------------------

export const pageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
};

export const pageTransition = { duration: 0.2, ease: 'easeInOut' as const };

// ---------------------------------------------------------------------------
// Card hover effect (blue shadow)
// ---------------------------------------------------------------------------

export const cardHover = {
    whileHover: { y: -2, boxShadow: '0 8px 25px -5px rgba(37, 99, 235, 0.15)' },
    transition: { duration: 0.15 },
};

// ---------------------------------------------------------------------------
// Stagger children animation
// ---------------------------------------------------------------------------

export const staggerContainer = {
    initial: {},
    animate: { transition: { staggerChildren: 0.06 } },
};

export const staggerItem = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export const sidebarVariants = {
    open: { width: 272, transition: { duration: 0.2, ease: 'easeOut' as const } },
    collapsed: { width: 72, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

// ---------------------------------------------------------------------------
// Generic
// ---------------------------------------------------------------------------

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
};

export const slideUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2 },
};

// ---------------------------------------------------------------------------
// Overlay (mobile sidebar backdrop)
// ---------------------------------------------------------------------------

export const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export const overlayTransition = { duration: 0.2 };

// ---------------------------------------------------------------------------
// Mobile sidebar slide
// ---------------------------------------------------------------------------

export const mobileSidebarVariants = {
    hidden: { x: -272 },
    visible: { x: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
    exit: { x: -272, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

// ---------------------------------------------------------------------------
// Bounce in — playful stat cards
// ---------------------------------------------------------------------------

export const bounceIn = {
    initial: { opacity: 0, scale: 0.8, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
};

// ---------------------------------------------------------------------------
// Slow stagger — dramatic reveal
// ---------------------------------------------------------------------------

export const staggerContainerSlow = {
    initial: {},
    animate: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

// ---------------------------------------------------------------------------
// Directional slides — chart sections
// ---------------------------------------------------------------------------

export const slideFromLeft = {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const slideFromRight = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

// ---------------------------------------------------------------------------
// Float — decorative elements
// ---------------------------------------------------------------------------

export const float = {
    animate: { y: [0, -6, 0] },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const },
};
