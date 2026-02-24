import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as perubahanService from '@/services/perubahanService';
import type { PerubahanListParams, CreatePerubahanDto } from '@/services/perubahanService';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const perubahanKeys = {
    all: ['perubahan'] as const,
    lists: () => [...perubahanKeys.all, 'list'] as const,
    list: (params: PerubahanListParams) => [...perubahanKeys.lists(), params] as const,
    details: () => [...perubahanKeys.all, 'detail'] as const,
    detail: (id: number) => [...perubahanKeys.details(), id] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function usePerubahanList(params: PerubahanListParams = {}) {
    return useQuery({
        queryKey: perubahanKeys.list(params),
        queryFn: () => perubahanService.getPerubahanList(params),
    });
}

export function usePerubahan(id: number) {
    return useQuery({
        queryKey: perubahanKeys.detail(id),
        queryFn: () => perubahanService.getPerubahan(id),
        enabled: !!id,
    });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreatePerubahan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreatePerubahanDto) => perubahanService.createPerubahan(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: perubahanKeys.lists() });
        },
    });
}

export function useDeletePerubahan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => perubahanService.deletePerubahan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: perubahanKeys.lists() });
        },
    });
}
