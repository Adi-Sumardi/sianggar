import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as proposalService from '@/services/proposalService';
import type {
    PengajuanFilterParams,
    CreatePengajuanDTO,
    UpdatePengajuanDTO,
} from '@/types/api';

// =============================================================================
// Pengajuan Anggaran hooks
// =============================================================================

export function usePengajuanList(params?: PengajuanFilterParams) {
    return useQuery({
        queryKey: ['pengajuans', params],
        queryFn: () => proposalService.getPengajuans(params),
    });
}

export function usePengajuan(id: number | null) {
    return useQuery({
        queryKey: ['pengajuans', id],
        queryFn: () => proposalService.getPengajuan(id!),
        enabled: id !== null,
    });
}

export function useCreatePengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreatePengajuanDTO) => proposalService.createPengajuan(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pengajuans'] });
        },
    });
}

export function useUpdatePengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdatePengajuanDTO }) =>
            proposalService.updatePengajuan(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pengajuans'] });
            queryClient.invalidateQueries({ queryKey: ['pengajuans', variables.id] });
        },
    });
}

export function useDeletePengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => proposalService.deletePengajuan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pengajuans'] });
        },
    });
}

export function useSubmitPengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => proposalService.submitPengajuan(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['pengajuans'] });
            queryClient.invalidateQueries({ queryKey: ['pengajuans', id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans'] });
        },
    });
}

export function useResubmitPengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => proposalService.resubmitPengajuan(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['pengajuans'] });
            queryClient.invalidateQueries({ queryKey: ['pengajuans', id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['lpj-stats'] });
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans'] });
        },
    });
}

/**
 * Get pengajuan available for LPJ creation.
 * Returns pengajuan that are paid with need_lpj=true and don't have an active LPJ.
 */
export function useAvailableForLpj(params?: { tahun?: string }) {
    return useQuery({
        queryKey: ['pengajuans', 'available-for-lpj', params],
        queryFn: () => proposalService.getAvailableForLpj(params),
    });
}

// =============================================================================
// Detail Pengajuan hooks
// =============================================================================

export function useDetailPengajuans(pengajuanId: number | null) {
    return useQuery({
        queryKey: ['pengajuans', pengajuanId, 'details'],
        queryFn: () => proposalService.getDetailPengajuans(pengajuanId!),
        enabled: pengajuanId !== null,
    });
}

export function useDetailPengajuan(id: number | null) {
    return useQuery({
        queryKey: ['detail-pengajuans', id],
        queryFn: () => proposalService.getDetailPengajuan(id!),
        enabled: id !== null,
    });
}

// =============================================================================
// Perubahan (Amendment) hook
// =============================================================================

export function useCreatePerubahan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto: UpdatePengajuanDTO;
        }) => proposalService.createPerubahan(pengajuanId, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pengajuans'] });
            queryClient.invalidateQueries({
                queryKey: ['pengajuans', variables.pengajuanId],
            });
        },
    });
}

// =============================================================================
// Attachment hooks
// =============================================================================

export function useUploadPengajuanAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ pengajuanId, file }: { pengajuanId: number; file: File }) =>
            proposalService.uploadPengajuanAttachment(pengajuanId, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['pengajuans', variables.pengajuanId],
            });
        },
    });
}

export function useDeletePengajuanAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            attachmentId,
        }: {
            pengajuanId: number;
            attachmentId: number;
        }) => proposalService.deletePengajuanAttachment(pengajuanId, attachmentId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['pengajuans', variables.pengajuanId],
            });
        },
    });
}

// =============================================================================
// Export hooks
// =============================================================================

export function useExportPengajuan() {
    return useMutation({
        mutationFn: (id: number) => proposalService.exportPengajuan(id),
    });
}

export function usePrintPengajuan() {
    return useMutation({
        mutationFn: (id: number) => proposalService.printPengajuan(id),
    });
}
