import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as rapbsApprovalService from '@/services/rapbsApprovalService';
import type {
    RapbsFilterParams,
    RapbsApprovalFilterParams,
    CreateRapbsDTO,
    UpdateRapbsDTO,
    RapbsApproveDTO,
    RapbsReviseDTO,
    RapbsRejectDTO,
} from '@/types/api';

// =============================================================================
// RAPBS Query hooks
// =============================================================================

export function useRapbsList(params?: RapbsFilterParams) {
    return useQuery({
        queryKey: ['rapbs', 'list', params],
        queryFn: () => rapbsApprovalService.getRapbsList(params),
    });
}

export function useRapbs(id: number | null) {
    return useQuery({
        queryKey: ['rapbs', id],
        queryFn: () => (id !== null ? rapbsApprovalService.getRapbs(id) : Promise.reject(new Error('No ID'))),
        enabled: id !== null,
    });
}

export function useRapbsPendingApprovals(params?: RapbsApprovalFilterParams, options?: { enabled?: boolean }) {
    return useQuery({
        queryKey: ['rapbs', 'pending-approvals', params],
        queryFn: () => rapbsApprovalService.getPendingApprovals(params),
        enabled: options?.enabled,
    });
}

export function useRapbsApprovals(rapbsId: number | null) {
    return useQuery({
        queryKey: ['rapbs', rapbsId, 'approvals'],
        queryFn: () => rapbsApprovalService.getRapbsApprovals(rapbsId!),
        enabled: rapbsId !== null,
    });
}

// =============================================================================
// RAPBS Mutation hooks
// =============================================================================

export function useCreateRapbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateRapbsDTO) => rapbsApprovalService.createRapbs(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
        },
    });
}

export function useUpdateRapbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateRapbsDTO }) =>
            rapbsApprovalService.updateRapbs(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', variables.id] });
        },
    });
}

export function useDeleteRapbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => rapbsApprovalService.deleteRapbs(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
        },
    });
}

// =============================================================================
// RAPBS Approval Workflow hooks
// =============================================================================

export function useSubmitRapbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => rapbsApprovalService.submitRapbs(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', id] });
        },
    });
}

export function useApproveRapbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto?: RapbsApproveDTO }) =>
            rapbsApprovalService.approveRapbs(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', 'pending-approvals'] });
            // Also invalidate APBS cache in case APBS was generated
            queryClient.invalidateQueries({ queryKey: ['apbs'] });
        },
    });
}

export function useReviseRapbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: RapbsReviseDTO }) =>
            rapbsApprovalService.reviseRapbs(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', 'pending-approvals'] });
        },
    });
}

export function useRejectRapbs() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: RapbsRejectDTO }) =>
            rapbsApprovalService.rejectRapbs(id, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rapbs'] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', variables.id] });
            queryClient.invalidateQueries({ queryKey: ['rapbs', 'pending-approvals'] });
        },
    });
}

export function useUpdateRapbsKeterangan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, keterangan }: { id: number; keterangan: string | null }) =>
            rapbsApprovalService.updateRapbsKeterangan(id, keterangan),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['rapbs', variables.id] });
        },
    });
}
