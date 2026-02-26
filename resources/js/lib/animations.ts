// ---------------------------------------------------------------------------
// Easing curves — macOS-inspired smooth feel
// ---------------------------------------------------------------------------

const smoothEase = [0.25, 0.1, 0.25, 1.0] as const; // CSS ease equivalent
const decelerate = [0.0, 0.0, 0.2, 1.0] as const; // material decelerate
const standard = [0.4, 0.0, 0.2, 1.0] as const; // material standard

// ---------------------------------------------------------------------------
// Page transitions
// ---------------------------------------------------------------------------

export const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
};

export const pageTransition = {
    duration: 0.2,
    ease: smoothEase,
};

// ---------------------------------------------------------------------------
// Card hover effect (blue shadow)
// ---------------------------------------------------------------------------

export const cardHover = {
    whileHover: { y: -3, boxShadow: '0 12px 28px -6px rgba(37, 99, 235, 0.15)' },
    transition: { duration: 0.25, ease: smoothEase },
};

// ---------------------------------------------------------------------------
// Stagger children animation
// ---------------------------------------------------------------------------

export const staggerContainer = {
    initial: {},
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const staggerItem = {
    initial: { opacity: 0, y: 16 },
    animate: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: decelerate },
    },
};

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export const sidebarVariants = {
    open: { width: 272, transition: { duration: 0.3, ease: standard } },
    collapsed: { width: 72, transition: { duration: 0.3, ease: standard } },
};

// ---------------------------------------------------------------------------
// Generic
// ---------------------------------------------------------------------------

export const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.35, ease: smoothEase },
};

export const slideUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: decelerate },
};

export const scaleIn = {
    initial: { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.35, ease: decelerate },
};

// ---------------------------------------------------------------------------
// Overlay (mobile sidebar backdrop)
// ---------------------------------------------------------------------------

export const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

export const overlayTransition = { duration: 0.3, ease: smoothEase };

// ---------------------------------------------------------------------------
// Mobile sidebar slide
// ---------------------------------------------------------------------------

export const mobileSidebarVariants = {
    hidden: { x: -272 },
    visible: { x: 0, transition: { duration: 0.35, ease: decelerate } },
    exit: { x: -272, transition: { duration: 0.25, ease: standard } },
};

// ---------------------------------------------------------------------------
// Bounce in — playful stat cards
// ---------------------------------------------------------------------------

export const bounceIn = {
    initial: { opacity: 0, scale: 0.85, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
};

// ---------------------------------------------------------------------------
// Slow stagger — dramatic reveal
// ---------------------------------------------------------------------------

export const staggerContainerSlow = {
    initial: {},
    animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

// ---------------------------------------------------------------------------
// Directional slides — chart sections
// ---------------------------------------------------------------------------

export const slideFromLeft = {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: decelerate },
};

export const slideFromRight = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5, ease: decelerate },
};

// ---------------------------------------------------------------------------
// Float — decorative elements
// ---------------------------------------------------------------------------

export const float = {
    animate: { y: [0, -8, 0] },
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
};
