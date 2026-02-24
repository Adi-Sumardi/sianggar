import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// Sidebar store – manages sidebar collapse and mobile open state
// =============================================================================

interface SidebarState {
    /** Whether the desktop sidebar is collapsed to icon-only mode. */
    isCollapsed: boolean;

    /** Whether the mobile sidebar overlay is open. */
    isMobileOpen: boolean;

    toggleCollapse: () => void;
    setCollapsed: (isCollapsed: boolean) => void;
    toggleMobileOpen: () => void;
    setMobileOpen: (isMobileOpen: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            isMobileOpen: false,

            toggleCollapse: () =>
                set((state) => ({ isCollapsed: !state.isCollapsed })),

            setCollapsed: (isCollapsed: boolean) => set({ isCollapsed }),

            toggleMobileOpen: () =>
                set((state) => ({ isMobileOpen: !state.isMobileOpen })),

            setMobileOpen: (isMobileOpen: boolean) => set({ isMobileOpen }),
        }),
        {
            name: 'sianggar-sidebar',
            partialize: (state) => ({
                isCollapsed: state.isCollapsed,
            }),
        },
    ),
);
