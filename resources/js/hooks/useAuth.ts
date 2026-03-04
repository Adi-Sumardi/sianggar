import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import * as authService from '@/services/authService';
import type { User } from '@/types/models';
import type { LoginDTO, ChangePasswordDTO } from '@/types/api';

// =============================================================================
// useAuth – TanStack Query hook wrapping authService
// =============================================================================

/**
 * Hook that manages authentication state.
 *
 * On mount it fetches the authenticated user from the API and syncs the
 * result into the Zustand auth store. Provides login / logout mutations.
 */
export function useAuth() {
    const queryClient = useQueryClient();
    const { user, isAuthenticated, isLoading, setUser, setLoading, logout: clearStore } =
        useAuthStore();

    // -------------------------------------------------------------------------
    // Fetch current user
    // -------------------------------------------------------------------------

    const { data, isLoading: queryLoading, isError } = useQuery<User>({
        queryKey: ['auth', 'user'],
        queryFn: authService.getUser,
        retry: false,
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (!queryLoading) {
            if (data) {
                setUser(data);
            } else {
                setUser(null);
            }
        }
    }, [data, queryLoading, isError, setUser]);

    // -------------------------------------------------------------------------
    // Login mutation
    // -------------------------------------------------------------------------

    const loginMutation = useMutation({
        mutationFn: (dto: LoginDTO) => authService.login(dto),
        onSuccess: (response) => {
            setUser(response.user);
            queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
        },
    });

    // -------------------------------------------------------------------------
    // Logout mutation
    // -------------------------------------------------------------------------

    const logoutMutation = useMutation({
        mutationFn: authService.logout,
        onSuccess: () => {
            clearStore();
            // Use removeQueries instead of clear() to avoid interrupting any pending requests
            // This safely removes cached data without causing race conditions
            queryClient.removeQueries();
        },
        onError: () => {
            // Even if logout API fails, clear local state
            clearStore();
            queryClient.removeQueries();
        },
    });

    // -------------------------------------------------------------------------
    // Change password mutation
    // -------------------------------------------------------------------------

    const changePasswordMutation = useMutation({
        mutationFn: (dto: ChangePasswordDTO) => authService.changePassword(dto),
    });

    // -------------------------------------------------------------------------
    // Update profile mutation
    // -------------------------------------------------------------------------

    const updateProfileMutation = useMutation({
        mutationFn: (dto: { name?: string; email?: string }) =>
            authService.updateProfile(dto),
        onSuccess: (updatedUser) => {
            setUser(updatedUser);
            queryClient.setQueryData(['auth', 'user'], updatedUser);
        },
    });

    return {
        user,
        isAuthenticated,
        isLoading: isLoading || queryLoading,

        // Mutations
        login: loginMutation.mutateAsync,
        loginStatus: loginMutation,
        logout: logoutMutation.mutateAsync,
        logoutStatus: logoutMutation,
        changePassword: changePasswordMutation.mutateAsync,
        changePasswordStatus: changePasswordMutation,
        updateProfile: updateProfileMutation.mutateAsync,
        updateProfileStatus: updateProfileMutation,
    };
}
