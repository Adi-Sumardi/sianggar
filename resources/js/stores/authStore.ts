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
    const year = new Date().getFullYear();
    return `${year}/${year + 1}`;
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
        (set, get) => ({
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

            hasPermission: (permission: string): boolean => {
                return get().user?.permissions?.includes(permission) ?? false;
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
    const year = new Date().getFullYear();
    return [
        `${year}/${year + 1}`,
        `${year + 1}/${year + 2}`,
    ];
}
