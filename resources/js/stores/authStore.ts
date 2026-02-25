import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/models';

// =============================================================================
// Auth store – manages client-side authentication state
// =============================================================================

/**
 * Get the current academic year (TA).
 * Academic year starts from July. e.g., July 2025 -> TA 2025/2026
 */
export function getCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    // If month >= July (7), we're in the new academic year
    if (month >= 7) {
        return `${year}/${year + 1}`;
    }
    // Otherwise we're still in the previous academic year
    return `${year - 1}/${year}`;
}

interface AuthState {
    /** The currently authenticated user, or `null` when not logged in. */
    user: User | null;

    /** Convenience derived flag. */
    isAuthenticated: boolean;

    /** `true` while the initial user check is in progress. */
    isLoading: boolean;

    /** Persisted academic year selection (e.g., "2025/2026"). */
    fiscalYear: string;

    /** Set the authenticated user (after login or on initial page load). */
    setUser: (user: User | null) => void;

    /** Mark the loading state explicitly (e.g. while fetching /auth/user). */
    setLoading: (isLoading: boolean) => void;

    /** Update the selected fiscal year. */
    setFiscalYear: (fiscalYear: string) => void;

    /** Check if the user has a specific permission. */
    hasPermission: (permission: string) => boolean;

    /** Clear auth state (on logout). */
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            isLoading: true,
            fiscalYear: getCurrentAcademicYear(),

            setUser: (user: User | null) =>
                set({
                    user,
                    isAuthenticated: user !== null,
                    isLoading: false,
                }),

            setLoading: (isLoading: boolean) => set({ isLoading }),

            setFiscalYear: (fiscalYear: string) => set({ fiscalYear }),

            hasPermission: (permission: string) => {
                const state = useAuthStore.getState();
                return state.user?.permissions?.includes(permission) ?? false;
            },

            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                }),
        }),
        {
            name: 'sianggar-auth',
            partialize: (state) => ({
                fiscalYear: state.fiscalYear,
            }),
        },
    ),
);

/**
 * Get available academic year options for the selector.
 */
export function getAcademicYearOptions(): string[] {
    const now = new Date();
    const currentYear = now.getFullYear();
    const month = now.getMonth() + 1;

    // Academic year starts in July.
    // Before July → current AY is (year-1)/year
    // From July  → current AY is year/(year+1)
    if (month >= 7) {
        return [
            `${currentYear}/${currentYear + 1}`,
            `${currentYear + 1}/${currentYear + 2}`,
        ];
    }
    return [
        `${currentYear - 1}/${currentYear}`,
        `${currentYear}/${currentYear + 1}`,
    ];
}
