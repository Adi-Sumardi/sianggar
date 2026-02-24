import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getRoles,
    getRole,
    getRoleMatrix,
    createRole,
    updateRole,
    deleteRole,
    syncRolePermissions,
    type RoleFilterParams,
    type CreateRolePayload,
    type UpdateRolePayload,
    type SyncPermissionsPayload,
} from '@/services/roleService';

/**
 * Fetch paginated list of roles.
 */
export function useRoles(params?: RoleFilterParams) {
    return useQuery({
        queryKey: ['roles', params],
        queryFn: () => getRoles(params),
    });
}

/**
 * Fetch a single role by ID.
 */
export function useRole(id: number | null) {
    return useQuery({
        queryKey: ['role', id],
        queryFn: () => getRole(id!),
        enabled: !!id,
    });
}

/**
 * Fetch role-permission matrix for matrix view UI.
 */
export function useRoleMatrix() {
    return useQuery({
        queryKey: ['roles', 'matrix'],
        queryFn: () => getRoleMatrix(),
    });
}

/**
 * Create a new role.
 */
export function useCreateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateRolePayload) => createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}

/**
 * Update an existing role.
 */
export function useUpdateRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateRolePayload }) =>
            updateRole(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            queryClient.invalidateQueries({ queryKey: ['role', variables.id] });
        },
    });
}

/**
 * Delete a role.
 */
export function useDeleteRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}

/**
 * Sync permissions for a specific role (for matrix view).
 */
export function useSyncRolePermissions() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SyncPermissionsPayload }) =>
            syncRolePermissions(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}
