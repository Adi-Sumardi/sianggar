import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// UI store – persisted sidebar / global filter state
// =============================================================================

interface UiState {
    /** Whether the mobile sidebar overlay is open. */
    sidebarOpen: boolean;

    /** Whether the desktop sidebar is collapsed to icon-only mode. */
    sidebarCollapsed: boolean;

    /** Currently selected fiscal year id (global filter). */
    selectedFiscalYear: number | null;

    /** Currently selected unit id (global filter, admin only). */
    selectedUnit: number | null;

    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebarCollapsed: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setSelectedFiscalYear: (yearId: number | null) => void;
    setSelectedUnit: (unitId: number | null) => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            sidebarOpen: false,
            sidebarCollapsed: false,
            selectedFiscalYear: null,
            selectedUnit: null,

            toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            toggleSidebarCollapsed: () =>
                set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

            setSelectedFiscalYear: (yearId) => set({ selectedFiscalYear: yearId }),
            setSelectedUnit: (unitId) => set({ selectedUnit: unitId }),
        }),
        {
            name: 'sianggar-ui',
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                selectedFiscalYear: state.selectedFiscalYear,
                selectedUnit: state.selectedUnit,
            }),
        },
    ),
);
