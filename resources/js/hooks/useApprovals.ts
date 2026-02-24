import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as approvalService from '@/services/approvalService';
import type {
    ApprovalFilterParams,
    ApproveDTO,
    ReviseDTO,
    RejectDTO,
    FinanceValidateDTO,
    EditAmountDTO,
    DiscussionMessageDTO,
} from '@/types/api';

// =============================================================================
// Approval Queue hooks
// =============================================================================

export function useApprovalQueue(params?: ApprovalFilterParams) {
    return useQuery({
        queryKey: ['approvals', 'queue', params],
        queryFn: () => approvalService.getApprovalQueue(params),
    });
}

export function useLpjApprovalQueue(
    params?: ApprovalFilterParams,
    options?: { enabled?: boolean },
) {
    return useQuery({
        queryKey: ['approvals', 'lpj-queue', params],
        queryFn: () => approvalService.getLpjApprovalQueue(params),
        enabled: options?.enabled ?? true,
    });
}

// =============================================================================
// Approval History hooks
// =============================================================================

export function usePengajuanApprovals(pengajuanId: number | null) {
    return useQuery({
        queryKey: ['pengajuans', pengajuanId, 'approvals'],
        queryFn: () => approvalService.getPengajuanApprovals(pengajuanId!),
        enabled: pengajuanId !== null,
    });
}

export function useLpjApprovals(lpjId: number | null) {
    return useQuery({
        queryKey: ['lpjs', lpjId, 'approvals'],
        queryFn: () => approvalService.getLpjApprovals(lpjId!),
        enabled: lpjId !== null,
    });
}

// =============================================================================
// Pengajuan Workflow Action hooks
// =============================================================================

function invalidatePengajuan(queryClient: ReturnType<typeof useQueryClient>, pengajuanId?: number) {
    queryClient.invalidateQueries({ queryKey: ['pengajuans'] });
    if (pengajuanId) {
        queryClient.invalidateQueries({ queryKey: ['pengajuans', pengajuanId] });
    }
    queryClient.invalidateQueries({ queryKey: ['approvals'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}

export function useSubmitPengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (pengajuanId: number) => approvalService.submitPengajuan(pengajuanId),
        onSuccess: (_data, pengajuanId) => invalidatePengajuan(queryClient, pengajuanId),
    });
}

export function useResubmitPengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (pengajuanId: number) => approvalService.resubmitPengajuan(pengajuanId),
        onSuccess: (_data, pengajuanId) => invalidatePengajuan(queryClient, pengajuanId),
    });
}

export function useApprovePengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto?: ApproveDTO;
        }) => approvalService.approvePengajuan(pengajuanId, dto),
        onSuccess: (_data, variables) => invalidatePengajuan(queryClient, variables.pengajuanId),
    });
}

export function useRevisePengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto: ReviseDTO;
        }) => approvalService.revisePengajuan(pengajuanId, dto),
        onSuccess: (_data, variables) => invalidatePengajuan(queryClient, variables.pengajuanId),
    });
}

export function useRejectPengajuan() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto: RejectDTO;
        }) => approvalService.rejectPengajuan(pengajuanId, dto),
        onSuccess: (_data, variables) => invalidatePengajuan(queryClient, variables.pengajuanId),
    });
}

export function useValidateFinance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto: FinanceValidateDTO;
        }) => approvalService.validateFinance(pengajuanId, dto),
        onSuccess: (_data, variables) => invalidatePengajuan(queryClient, variables.pengajuanId),
    });
}

export function useEditAmount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto: EditAmountDTO;
        }) => approvalService.editAmount(pengajuanId, dto),
        onSuccess: (_data, variables) => invalidatePengajuan(queryClient, variables.pengajuanId),
    });
}

export function usePrintVoucher() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (pengajuanId: number) => approvalService.printVoucher(pengajuanId),
        onSuccess: (_data, pengajuanId) => invalidatePengajuan(queryClient, pengajuanId),
    });
}

export function useMarkAsPaid() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto: approvalService.MarkAsPaidDTO;
        }) => approvalService.markAsPaid(pengajuanId, dto),
        onSuccess: (_data, variables) => {
            invalidatePengajuan(queryClient, variables.pengajuanId);
            queryClient.invalidateQueries({ queryKey: ['payments'] });
        },
    });
}

export function useVoucherHistory() {
    return useQuery({
        queryKey: ['vouchers', 'history'],
        queryFn: () => approvalService.getVoucherHistory(),
    });
}

export function usePaymentHistory() {
    return useQuery({
        queryKey: ['payments', 'history'],
        queryFn: () => approvalService.getPaymentHistory(),
    });
}

// =============================================================================
// Discussion hooks
// =============================================================================

export function useActiveDiscussions(options?: { enabled?: boolean; refetchInterval?: number }) {
    return useQuery({
        queryKey: ['discussions', 'active'],
        queryFn: () => approvalService.getActiveDiscussions(),
        enabled: options?.enabled ?? true,
        refetchInterval: options?.refetchInterval,
    });
}

export function useDiscussion(pengajuanId: number | null, options?: { enabled?: boolean; refetchInterval?: number }) {
    return useQuery({
        queryKey: ['pengajuans', pengajuanId, 'discussion'],
        queryFn: () => approvalService.getDiscussion(pengajuanId!),
        enabled: (options?.enabled ?? true) && pengajuanId !== null,
        refetchInterval: options?.refetchInterval,
    });
}

export function useOpenDiscussion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (pengajuanId: number) => approvalService.openDiscussion(pengajuanId),
        onSuccess: (_data, pengajuanId) => {
            invalidatePengajuan(queryClient, pengajuanId);
            queryClient.invalidateQueries({ queryKey: ['pengajuans', pengajuanId, 'discussion'] });
        },
    });
}

export function useCloseDiscussion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (pengajuanId: number) => approvalService.closeDiscussion(pengajuanId),
        onSuccess: (_data, pengajuanId) => {
            invalidatePengajuan(queryClient, pengajuanId);
            queryClient.invalidateQueries({ queryKey: ['pengajuans', pengajuanId, 'discussion'] });
        },
    });
}

export function useAddDiscussionMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            pengajuanId,
            dto,
        }: {
            pengajuanId: number;
            dto: DiscussionMessageDTO;
        }) => approvalService.addDiscussionMessage(pengajuanId, dto),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pengajuans', variables.pengajuanId, 'discussion'] });
        },
    });
}

// LPJ Approval hooks are defined in useLpj.ts (using correct reportService endpoints)
