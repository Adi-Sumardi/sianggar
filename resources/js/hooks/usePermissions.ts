import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getPermissions,
    getPermission,
    createPermission,
    updatePermission,
    deletePermission,
    type PermissionFilterParams,
    type CreatePermissionPayload,
    type UpdatePermissionPayload,
} from '@/services/permissionService';

/**
 * Fetch all permissions with optional grouping.
 */
export function usePermissions(params?: PermissionFilterParams) {
    return useQuery({
        queryKey: ['permissions', params],
        queryFn: () => getPermissions(params),
    });
}

/**
 * Fetch a single permission by ID.
 */
export function usePermission(id: number | null) {
    return useQuery({
        queryKey: ['permission', id],
        queryFn: () => getPermission(id!),
        enabled: !!id,
    });
}

/**
 * Create a new permission.
 */
export function useCreatePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreatePermissionPayload) => createPermission(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}

/**
 * Update an existing permission.
 */
export function useUpdatePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePermissionPayload }) =>
            updatePermission(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            queryClient.invalidateQueries({ queryKey: ['permission', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}

/**
 * Delete a permission.
 */
export function useDeletePermission() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deletePermission(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
    });
}
