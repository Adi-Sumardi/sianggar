import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as planningService from '@/services/planningService';
import type {
    PaginationParams,
    CreateStrategyDTO,
    UpdateStrategyDTO,
    CreateIndikatorDTO,
    UpdateIndikatorDTO,
    CreateProkerDTO,
    UpdateProkerDTO,
    CreateKegiatanDTO,
    UpdateKegiatanDTO,
    CreatePktDTO,
    UpdatePktDTO,
} from '@/types/api';

// =============================================================================
// Strategy hooks
// =============================================================================

export function useStrategies(params?: PaginationParams) {
    return useQuery({
        queryKey: ['strategies', params],
        queryFn: () => planningService.getStrategies(params),
    });
}

export function useStrategy(id: number | null) {
    return useQuery({
        queryKey: ['strategies', id],
        queryFn: () => planningService.getStrategy(id!),
        enabled: id !== null,
    });
}

export function useCreateStrategy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateStrategyDTO) => planningService.createStrategy(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
        },
    });
}

export function useUpdateStrategy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateStrategyDTO }) =>
            planningService.updateStrategy(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
            queryClient.invalidateQueries({ queryKey: ['strategies', variables.id] });
        },
    });
}

export function useDeleteStrategy() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => planningService.deleteStrategy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['strategies'] });
        },
    });
}

// =============================================================================
// Indikator hooks
// =============================================================================

export function useIndikators(params?: PaginationParams & { strategy_id?: number }) {
    return useQuery({
        queryKey: ['indikators', params],
        queryFn: () => planningService.getIndikators(params),
    });
}

export function useIndikator(id: number | null) {
    return useQuery({
        queryKey: ['indikators', id],
        queryFn: () => planningService.getIndikator(id!),
        enabled: id !== null,
    });
}

export function useCreateIndikator() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateIndikatorDTO) => planningService.createIndikator(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['indikators'] });
        },
    });
}

export function useUpdateIndikator() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateIndikatorDTO }) =>
            planningService.updateIndikator(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['indikators'] });
            queryClient.invalidateQueries({ queryKey: ['indikators', variables.id] });
        },
    });
}

export function useDeleteIndikator() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => planningService.deleteIndikator(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['indikators'] });
        },
    });
}

// =============================================================================
// Proker hooks
// =============================================================================

export function useProkers(
    params?: PaginationParams & { strategy_id?: number; indikator_id?: number; unit_id?: number },
) {
    return useQuery({
        queryKey: ['prokers', params],
        queryFn: () => planningService.getProkers(params),
    });
}

export function useProker(id: number | null) {
    return useQuery({
        queryKey: ['prokers', id],
        queryFn: () => planningService.getProker(id!),
        enabled: id !== null,
    });
}

export function useCreateProker() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateProkerDTO) => planningService.createProker(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prokers'] });
        },
    });
}

export function useUpdateProker() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateProkerDTO }) =>
            planningService.updateProker(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['prokers'] });
            queryClient.invalidateQueries({ queryKey: ['prokers', variables.id] });
        },
    });
}

export function useDeleteProker() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => planningService.deleteProker(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prokers'] });
        },
    });
}

// =============================================================================
// Kegiatan hooks
// =============================================================================

export function useKegiatans(
    params?: PaginationParams & {
        strategy_id?: number;
        indikator_id?: number;
        proker_id?: number;
        unit_id?: number;
        jenis_kegiatan?: string;
    },
) {
    return useQuery({
        queryKey: ['kegiatans', params],
        queryFn: () => planningService.getKegiatans(params),
    });
}

export function useKegiatan(id: number | null) {
    return useQuery({
        queryKey: ['kegiatans', id],
        queryFn: () => planningService.getKegiatan(id!),
        enabled: id !== null,
    });
}

export function useCreateKegiatan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateKegiatanDTO) => planningService.createKegiatan(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatans'] });
        },
    });
}

export function useUpdateKegiatan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateKegiatanDTO }) =>
            planningService.updateKegiatan(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['kegiatans'] });
            queryClient.invalidateQueries({ queryKey: ['kegiatans', variables.id] });
        },
    });
}

export function useDeleteKegiatan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => planningService.deleteKegiatan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatans'] });
        },
    });
}

// =============================================================================
// PKT hooks
// =============================================================================

export function usePkts(
    params?: PaginationParams & {
        strategy_id?: number;
        indikator_id?: number;
        proker_id?: number;
        kegiatan_id?: number;
        tahun?: string;
        unit?: string;
    },
) {
    return useQuery({
        queryKey: ['pkts', params],
        queryFn: () => planningService.getPkts(params),
    });
}

export function usePkt(id: number | null) {
    return useQuery({
        queryKey: ['pkts', id],
        queryFn: () => planningService.getPkt(id!),
        enabled: id !== null,
    });
}

export function useCreatePkt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreatePktDTO) => planningService.createPkt(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pkts'] });
        },
    });
}

export function useUpdatePkt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdatePktDTO }) =>
            planningService.updatePkt(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pkts'] });
            queryClient.invalidateQueries({ queryKey: ['pkts', variables.id] });
        },
    });
}

export function useDeletePkt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => planningService.deletePkt(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pkts'] });
        },
    });
}

export function useSubmitPkt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => planningService.submitPkt(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['pkts'] });
            queryClient.invalidateQueries({ queryKey: ['pkts', id] });
        },
    });
}

// =============================================================================
// Import hooks
// =============================================================================

export function useImportProkers() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => planningService.importProkers(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prokers'] });
        },
    });
}

export function useImportKegiatans() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => planningService.importKegiatans(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kegiatans'] });
        },
    });
}
