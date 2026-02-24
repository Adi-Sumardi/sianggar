import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as perubahanAnggaranService from '@/services/perubahanAnggaranService';
import type {
    CreatePerubahanAnggaranDTO,
    UpdatePerubahanAnggaranDTO,
    PerubahanAnggaranFilterParams,
} from '@/types/api';

// =============================================================================
// Query Keys
// =============================================================================

export const perubahanAnggaranKeys = {
    all: ['perubahan-anggaran'] as const,
    lists: () => [...perubahanAnggaranKeys.all, 'list'] as const,
    list: (params?: PerubahanAnggaranFilterParams) =>
        [...perubahanAnggaranKeys.lists(), params] as const,
    details: () => [...perubahanAnggaranKeys.all, 'detail'] as const,
    detail: (id: number) => [...perubahanAnggaranKeys.details(), id] as const,
    queue: () => [...perubahanAnggaranKeys.all, 'queue'] as const,
    stages: (id: number) => [...perubahanAnggaranKeys.all, 'stages', id] as const,
};

// =============================================================================
// Queries
// =============================================================================

export function usePerubahanAnggarans(params?: PerubahanAnggaranFilterParams) {
    return useQuery({
        queryKey: perubahanAnggaranKeys.list(params),
        queryFn: () => perubahanAnggaranService.getPerubahanAnggarans(params),
    });
}

export function usePerubahanAnggaran(id: number | null) {
    return useQuery({
        queryKey: perubahanAnggaranKeys.detail(id!),
        queryFn: () => perubahanAnggaranService.getPerubahanAnggaran(id!),
        enabled: id !== null,
    });
}

export function usePerubahanAnggaranApprovalQueue() {
    return useQuery({
        queryKey: perubahanAnggaranKeys.queue(),
        queryFn: () => perubahanAnggaranService.getPerubahanAnggaranApprovalQueue(),
    });
}

export function usePerubahanAnggaranExpectedStages(id: number | null) {
    return useQuery({
        queryKey: perubahanAnggaranKeys.stages(id!),
        queryFn: () => perubahanAnggaranService.getExpectedStages(id!),
        enabled: id !== null,
    });
}

// =============================================================================
// Mutations
// =============================================================================

export function useCreatePerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreatePerubahanAnggaranDTO) =>
            perubahanAnggaranService.createPerubahanAnggaran(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
        },
    });
}

export function useUpdatePerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdatePerubahanAnggaranDTO }) =>
            perubahanAnggaranService.updatePerubahanAnggaran(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: perubahanAnggaranKeys.detail(variables.id),
            });
        },
    });
}

export function useDeletePerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => perubahanAnggaranService.deletePerubahanAnggaran(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
        },
    });
}

export function useSubmitPerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => perubahanAnggaranService.submitPerubahanAnggaran(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.queue() });
        },
    });
}

export function useResubmitPerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => perubahanAnggaranService.resubmitPerubahanAnggaran(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.detail(id) });
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.queue() });
        },
    });
}

export function useApprovePerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
            perubahanAnggaranService.approvePerubahanAnggaran(id, notes),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: perubahanAnggaranKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.queue() });
            // Also invalidate budget queries since balances may have changed
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans'] });
        },
    });
}

export function useRevisePerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, notes }: { id: number; notes: string }) =>
            perubahanAnggaranService.revisePerubahanAnggaran(id, notes),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: perubahanAnggaranKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.queue() });
        },
    });
}

export function useRejectPerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, notes }: { id: number; notes: string }) =>
            perubahanAnggaranService.rejectPerubahanAnggaran(id, notes),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.lists() });
            queryClient.invalidateQueries({
                queryKey: perubahanAnggaranKeys.detail(variables.id),
            });
            queryClient.invalidateQueries({ queryKey: perubahanAnggaranKeys.queue() });
        },
    });
}

// =============================================================================
// Attachment Mutations
// =============================================================================

export function useUploadPerubahanAnggaranAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ perubahanAnggaranId, file }: { perubahanAnggaranId: number; file: File }) =>
            perubahanAnggaranService.uploadPerubahanAnggaranAttachment(perubahanAnggaranId, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: perubahanAnggaranKeys.detail(variables.perubahanAnggaranId),
            });
        },
    });
}

export function useDeletePerubahanAnggaranAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            perubahanAnggaranId,
            attachmentId,
        }: {
            perubahanAnggaranId: number;
            attachmentId: number;
        }) =>
            perubahanAnggaranService.deletePerubahanAnggaranAttachment(
                perubahanAnggaranId,
                attachmentId,
            ),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: perubahanAnggaranKeys.detail(variables.perubahanAnggaranId),
            });
        },
    });
}
