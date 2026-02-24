import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    updateUserPassword,
    type UserFilterParams,
    type CreateUserPayload,
    type UpdateUserPayload,
    type UpdatePasswordPayload,
} from '@/services/userService';

export function useUsers(params?: UserFilterParams) {
    return useQuery({
        queryKey: ['users', params],
        queryFn: () => getUsers(params),
    });
}

export function useUser(id: number | null) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => getUser(id!),
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserPayload) => createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdateUserPayload }) =>
            updateUser(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => deleteUser(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
}

export function useUpdateUserPassword() {
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: UpdatePasswordPayload }) =>
            updateUserPassword(id, data),
    });
}
