import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reportService from '@/services/reportService';
import type {
    LpjFilterParams,
    CreateLpjDTO,
    UpdateLpjDTO,
    ValidateLpjDTO,
    ApproveLpjDTO,
    ReviseLpjDTO,
    RejectLpjDTO,
} from '@/types/api';

// =============================================================================
// LPJ CRUD hooks
// =============================================================================

export function useLpjList(params?: LpjFilterParams) {
    return useQuery({
        queryKey: ['lpjs', params],
        queryFn: () => reportService.getLpjs(params),
    });
}

/**
 * Get LPJ statistics including pending LPJ count and revision count.
 * Also includes whether new pengajuan can be created (pending < 20).
 */
export function useLpjStats() {
    return useQuery({
        queryKey: ['lpjs', 'stats'],
        queryFn: () => reportService.getLpjStats(),
        staleTime: 30 * 1000, // 30 seconds
    });
}

export function useLpj(id: number | null) {
    return useQuery({
        queryKey: ['lpjs', id],
        queryFn: () => reportService.getLpj(id!),
        enabled: id !== null,
    });
}

export function useCreateLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateLpjDTO) => reportService.createLpj(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['pengajuans', 'available-for-lpj'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useUpdateLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateLpjDTO }) =>
            reportService.updateLpj(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['lpjs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useDeleteLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => reportService.deleteLpj(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useSubmitLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => reportService.submitLpj(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['lpjs', id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useResubmitLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => reportService.resubmitLpj(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['lpjs', id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

// =============================================================================
// LPJ Approval hooks
// =============================================================================

/**
 * Validate LPJ with checklist (Staf Keuangan stage only).
 */
export function useValidateLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: ValidateLpjDTO }) =>
            reportService.validateLpj(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['lpjs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}

/**
 * Approve LPJ (middle approver and Keuangan stages).
 */
export function useApproveLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto?: ApproveLpjDTO }) =>
            reportService.approveLpj(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['lpjs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}

/**
 * Request revision on LPJ.
 */
export function useReviseLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: ReviseLpjDTO }) =>
            reportService.reviseLpj(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['lpjs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}

/**
 * Reject LPJ.
 */
export function useRejectLpj() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: RejectLpjDTO }) =>
            reportService.rejectLpj(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs'] });
            queryClient.invalidateQueries({ queryKey: ['lpjs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });
}

/**
 * Get approval timeline for LPJ.
 */
export function useLpjTimeline(id: number | null) {
    return useQuery({
        queryKey: ['lpjs', id, 'timeline'],
        queryFn: () => reportService.getLpjTimeline(id!),
        enabled: id !== null,
    });
}

// =============================================================================
// LPJ Attachment hooks
// =============================================================================

export function useUploadLpjAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ lpjId, file }: { lpjId: number; file: File }) =>
            reportService.uploadLpjAttachment(lpjId, file),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs', variables.lpjId] });
        },
    });
}

export function useDeleteLpjAttachment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            lpjId,
            attachmentId,
        }: {
            lpjId: number;
            attachmentId: number;
        }) => reportService.deleteLpjAttachment(lpjId, attachmentId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lpjs', variables.lpjId] });
        },
    });
}

// =============================================================================
// LPJ Export hooks
// =============================================================================

export function useExportLpj() {
    return useMutation({
        mutationFn: (id: number) => reportService.exportLpj(id),
    });
}

export function usePrintLpj() {
    return useMutation({
        mutationFn: (id: number) => reportService.printLpj(id),
    });
}

export function useExportLaporan() {
    return useMutation({
        mutationFn: (params: {
            unit_id?: number;
            tahun?: string;
            format?: 'xlsx' | 'pdf';
        }) => reportService.exportLaporan(params),
    });
}

export function useExportRealisasi() {
    return useMutation({
        mutationFn: (params: {
            unit_id?: number;
            tahun?: string;
            bulan?: number;
            format?: 'xlsx' | 'pdf';
        }) => reportService.exportRealisasi(params),
    });
}
