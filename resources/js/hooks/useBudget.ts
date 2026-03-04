import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as budgetService from '@/services/budgetService';
import type {
    JenisMataAnggaran,
    MataAnggaran,
    SubMataAnggaran,
    DetailMataAnggaran,
    Apbs,
    NoMataAnggaran,
} from '@/types/models';
import type {
    BudgetFilterParams,
    PaginationParams,
    CreateJenisMataAnggaranDTO,
    UpdateJenisMataAnggaranDTO,
    CreateMataAnggaranDTO,
    UpdateMataAnggaranDTO,
    CreateSubMataAnggaranDTO,
    UpdateSubMataAnggaranDTO,
    CreateDetailMataAnggaranDTO,
    UpdateDetailMataAnggaranDTO,
    CreateApbsDTO,
    UpdateApbsDTO,
    CreateNoMataAnggaranDTO,
    UpdateNoMataAnggaranDTO,
    BudgetCheckDTO,
} from '@/types/api';

// =============================================================================
// Jenis Mata Anggaran hooks
// =============================================================================

export function useJenisMataAnggarans(params?: { search?: string; include_inactive?: boolean }) {
    return useQuery({
        queryKey: ['jenis-mata-anggarans', params],
        queryFn: () => budgetService.getJenisMataAnggarans(params),
    });
}

export function useJenisMataAnggaran(id: number | null) {
    return useQuery({
        queryKey: ['jenis-mata-anggarans', id],
        queryFn: () => budgetService.getJenisMataAnggaran(id!),
        enabled: id !== null,
    });
}

export function useCreateJenisMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateJenisMataAnggaranDTO) => budgetService.createJenisMataAnggaran(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jenis-mata-anggarans'] });
        },
    });
}

export function useUpdateJenisMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateJenisMataAnggaranDTO }) =>
            budgetService.updateJenisMataAnggaran(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['jenis-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['jenis-mata-anggarans', variables.id] });
        },
    });
}

export function useDeleteJenisMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deleteJenisMataAnggaran(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jenis-mata-anggarans'] });
        },
    });
}

// =============================================================================
// Mata Anggaran hooks
// =============================================================================

export function useMataAnggarans(params?: BudgetFilterParams) {
    return useQuery({
        queryKey: ['mata-anggarans', params],
        queryFn: () => budgetService.getMataAnggarans(params),
    });
}

export function useMataAnggaran(id: number | null) {
    return useQuery({
        queryKey: ['mata-anggarans', id],
        queryFn: () => budgetService.getMataAnggaran(id!),
        enabled: id !== null,
    });
}

export function useCreateMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateMataAnggaranDTO) => budgetService.createMataAnggaran(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

export function useUpdateMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateMataAnggaranDTO }) =>
            budgetService.updateMataAnggaran(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['coa-by-unit'] });
        },
    });
}

export function useDeleteMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deleteMataAnggaran(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['coa-by-unit'] });
        },
    });
}

// =============================================================================
// Sub Mata Anggaran hooks
// =============================================================================

export function useSubMataAnggarans(mataAnggaranId: number | null, params?: PaginationParams) {
    return useQuery({
        queryKey: ['sub-mata-anggarans', mataAnggaranId, params],
        queryFn: () => budgetService.getSubMataAnggarans(mataAnggaranId!, params),
        enabled: mataAnggaranId !== null,
    });
}

export function useSubMataAnggaran(id: number | null) {
    return useQuery({
        queryKey: ['sub-mata-anggarans', id],
        queryFn: () => budgetService.getSubMataAnggaran(id!),
        enabled: id !== null,
    });
}

export function useCreateSubMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateSubMataAnggaranDTO) => budgetService.createSubMataAnggaran(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

export function useUpdateSubMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateSubMataAnggaranDTO }) =>
            budgetService.updateSubMataAnggaran(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

export function useDeleteSubMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deleteSubMataAnggaran(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

// =============================================================================
// Detail Mata Anggaran hooks
// =============================================================================

export function useDetailMataAnggarans(
    params?: BudgetFilterParams & { mata_anggaran_id?: number; sub_mata_anggaran_id?: number } | null,
) {
    return useQuery({
        queryKey: ['detail-mata-anggarans', params],
        queryFn: () => budgetService.getDetailMataAnggarans(params ?? undefined),
        enabled: params !== null && params !== undefined,
    });
}

export function useDetailMataAnggaran(id: number | null) {
    return useQuery({
        queryKey: ['detail-mata-anggarans', id],
        queryFn: () => budgetService.getDetailMataAnggaran(id!),
        enabled: id !== null,
    });
}

export function useCreateDetailMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateDetailMataAnggaranDTO) =>
            budgetService.createDetailMataAnggaran(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

export function useUpdateDetailMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateDetailMataAnggaranDTO }) =>
            budgetService.updateDetailMataAnggaran(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

export function useDeleteDetailMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deleteDetailMataAnggaran(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['detail-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['sub-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

// =============================================================================
// APBS hooks
// =============================================================================

export function useApbsList(params?: BudgetFilterParams) {
    return useQuery({
        queryKey: ['apbs', params],
        queryFn: () => budgetService.getApbsList(params),
    });
}

export function useApbs(id: number | null) {
    return useQuery({
        queryKey: ['apbs', id],
        queryFn: () => budgetService.getApbs(id!),
        enabled: id !== null,
    });
}

// Alias for ApbsDetail page
export function useApbsDetail(id: number | null) {
    return useApbs(id);
}

export function useCreateApbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateApbsDTO) => budgetService.createApbs(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apbs'] });
        },
    });
}

export function useUpdateApbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateApbsDTO }) =>
            budgetService.updateApbs(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['apbs'] });
            queryClient.invalidateQueries({ queryKey: ['apbs', variables.id] });
        },
    });
}

export function useDeleteApbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deleteApbs(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apbs'] });
        },
    });
}

// =============================================================================
// No Mata Anggaran (COA) hooks
// =============================================================================

export function useNoMataAnggarans(params?: PaginationParams) {
    return useQuery({
        queryKey: ['no-mata-anggarans', params],
        queryFn: () => budgetService.getNoMataAnggarans(params),
    });
}

export function useNoMataAnggaran(id: number | null) {
    return useQuery({
        queryKey: ['no-mata-anggarans', id],
        queryFn: () => budgetService.getNoMataAnggaran(id!),
        enabled: id !== null,
    });
}

export function useCreateNoMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateNoMataAnggaranDTO) =>
            budgetService.createNoMataAnggaran(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['no-mata-anggarans'] });
        },
    });
}

export function useUpdateNoMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateNoMataAnggaranDTO }) =>
            budgetService.updateNoMataAnggaran(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['no-mata-anggarans'] });
            queryClient.invalidateQueries({ queryKey: ['no-mata-anggarans', variables.id] });
        },
    });
}

export function useDeleteNoMataAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deleteNoMataAnggaran(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['no-mata-anggarans'] });
        },
    });
}

// =============================================================================
// COA by Unit hook
// =============================================================================

export function useCoaByUnit(params?: { unit_id?: number; tahun?: string }) {
    return useQuery({
        queryKey: ['coa-by-unit', params],
        queryFn: () => budgetService.getCoaByUnit(params),
    });
}

// =============================================================================
// COA - Penerimaan hook
// =============================================================================

export function usePenerimaanList(params?: budgetService.PenerimaanListParams) {
    return useQuery({
        queryKey: ['coa-penerimaan', params],
        queryFn: () => budgetService.getPenerimaanList(params),
    });
}

export function useCreatePenerimaan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: budgetService.CreatePenerimaanDTO) => budgetService.createPenerimaan(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coa-penerimaan'] });
        },
    });
}

export function useUpdatePenerimaan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: budgetService.UpdatePenerimaanDTO }) =>
            budgetService.updatePenerimaan(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coa-penerimaan'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useDeletePenerimaan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deletePenerimaan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coa-penerimaan'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

// =============================================================================
// COA - Realisasi hook
// =============================================================================

export function useRealisasiList(params?: budgetService.RealisasiListParams) {
    return useQuery({
        queryKey: ['coa-realisasi', params],
        queryFn: () => budgetService.getRealisasiList(params),
    });
}

export function useCreateRealisasi() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: budgetService.CreateRealisasiDTO) => budgetService.createRealisasi(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coa-realisasi'] });
        },
    });
}

export function useUpdateRealisasi() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: budgetService.UpdateRealisasiDTO }) =>
            budgetService.updateRealisasi(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coa-realisasi'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

export function useDeleteRealisasi() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => budgetService.deleteRealisasi(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coa-realisasi'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });
}

// =============================================================================
// RAPBS hooks
// =============================================================================

export function useRapbsList(params?: { unit_id?: number; tahun?: string } | null) {
    return useQuery({
        queryKey: ['rapbs', params],
        queryFn: () => budgetService.getRapbsList(params ?? undefined),
        enabled: params !== null,
    });
}

export function useUpdateBudgetComparison() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            mataAnggaranId,
            dto,
        }: {
            mataAnggaranId: number;
            dto: budgetService.UpdateBudgetComparisonDTO;
        }) => budgetService.updateBudgetComparison(mataAnggaranId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['mata-anggarans'] });
        },
    });
}

// =============================================================================
// Budget Sufficiency Check hook
// =============================================================================

export function useCheckBudgetSufficiency() {
    return useMutation({
        mutationFn: (dto: BudgetCheckDTO) => budgetService.checkBudgetSufficiency(dto),
    });
}
