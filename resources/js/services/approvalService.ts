import api from '@/lib/api';
import type { Approval, PengajuanAnggaran, Lpj, Discussion, DiscussionMessage } from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
    ApprovalFilterParams,
    ApproveDTO,
    ReviseDTO,
    RejectDTO,
    FinanceValidateDTO,
    EditAmountDTO,
    DiscussionMessageDTO,
} from '@/types/api';

// =============================================================================
// Approval Queue
// =============================================================================

export async function getApprovalQueue(
    params?: ApprovalFilterParams,
): Promise<PaginatedResponse<PengajuanAnggaran>> {
    const { data } = await api.get<PaginatedResponse<PengajuanAnggaran>>(
        '/approval-queue',
        { params },
    );
    return data;
}

export async function getLpjApprovalQueue(
    params?: ApprovalFilterParams,
): Promise<PaginatedResponse<Lpj>> {
    const { data } = await api.get<PaginatedResponse<Lpj>>(
        '/lpj',
        { params: { ...params, status: 'pending_approval' } },
    );
    return data;
}

// =============================================================================
// Approval History
// =============================================================================

export async function getPengajuanApprovals(pengajuanId: number): Promise<Approval[]> {
    const { data } = await api.get<ApiResponse<Approval[]>>(
        `/pengajuan/${pengajuanId}/approvals`,
    );
    return data.data;
}

export async function getLpjApprovals(lpjId: number): Promise<Approval[]> {
    const { data } = await api.get<ApiResponse<Approval[]>>(
        `/lpj/${lpjId}/approvals`,
    );
    return data.data;
}

// =============================================================================
// Pengajuan Workflow Actions
// =============================================================================

export async function submitPengajuan(pengajuanId: number): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/submit`,
    );
    return data.data;
}

export async function resubmitPengajuan(pengajuanId: number): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/resubmit`,
    );
    return data.data;
}

export async function approvePengajuan(
    pengajuanId: number,
    dto?: ApproveDTO,
): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/approve`,
        dto ?? {},
    );
    return data.data;
}

export async function revisePengajuan(
    pengajuanId: number,
    dto: ReviseDTO,
): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/revise`,
        dto,
    );
    return data.data;
}

export async function rejectPengajuan(
    pengajuanId: number,
    dto: RejectDTO,
): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/reject`,
        dto,
    );
    return data.data;
}

export async function validateFinance(
    pengajuanId: number,
    dto: FinanceValidateDTO,
): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/validate`,
        dto,
    );
    return data.data;
}

export async function editAmount(
    pengajuanId: number,
    dto: EditAmountDTO,
): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/edit-amount`,
        dto,
    );
    return data.data;
}

export async function printVoucher(pengajuanId: number): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/print-voucher`,
    );
    return data.data;
}

export interface MarkAsPaidDTO {
    recipient_name: string;
    payment_method?: string;
    notes?: string;
}

export async function markAsPaid(pengajuanId: number, dto: MarkAsPaidDTO): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/mark-paid`,
        dto,
    );
    return data.data;
}

export async function getVoucherHistory(): Promise<PengajuanAnggaran[]> {
    const { data } = await api.get<ApiResponse<PengajuanAnggaran[]>>(
        '/voucher-history',
    );
    return data.data;
}

export async function getPaymentHistory(): Promise<PengajuanAnggaran[]> {
    const { data } = await api.get<ApiResponse<PengajuanAnggaran[]>>(
        '/payment-history',
    );
    return data.data;
}

// =============================================================================
// Discussion
// =============================================================================

export interface ActiveDiscussion extends Discussion {
    pengajuan_anggaran: {
        id: number;
        nomor_pengajuan: string;
        perihal: string;
        nama_pengajuan: string;
        jumlah_pengajuan_total: number;
        unit_relation?: { id: number; nama: string };
        user?: { id: number; name: string };
    };
}

export async function getActiveDiscussions(): Promise<ActiveDiscussion[]> {
    const { data } = await api.get<ApiResponse<ActiveDiscussion[]>>(
        '/discussions/active',
    );
    return data.data;
}

export async function getDiscussion(pengajuanId: number): Promise<Discussion[]> {
    const { data } = await api.get<ApiResponse<Discussion[]>>(
        `/pengajuan/${pengajuanId}/discussion`,
    );
    return data.data;
}

export async function openDiscussion(pengajuanId: number): Promise<Discussion> {
    const { data } = await api.post<ApiResponse<Discussion>>(
        `/pengajuan/${pengajuanId}/discussion/open`,
    );
    return data.data;
}

export async function closeDiscussion(pengajuanId: number): Promise<Discussion> {
    const { data } = await api.post<ApiResponse<Discussion>>(
        `/pengajuan/${pengajuanId}/discussion/close`,
    );
    return data.data;
}

export async function addDiscussionMessage(
    pengajuanId: number,
    dto: DiscussionMessageDTO,
): Promise<DiscussionMessage> {
    const { data } = await api.post<ApiResponse<DiscussionMessage>>(
        `/pengajuan/${pengajuanId}/discussion/message`,
        dto,
    );
    return data.data;
}

// =============================================================================
// Approval Actions – LPJ
// =============================================================================

export async function approveLpj(
    lpjId: number,
    dto?: ApproveDTO,
): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(
        `/lpj/${lpjId}/approve`,
        dto ?? {},
    );
    return data.data;
}

export async function reviseLpj(
    lpjId: number,
    dto: ReviseDTO,
): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(
        `/lpj/${lpjId}/revise`,
        dto,
    );
    return data.data;
}

export async function rejectLpj(
    lpjId: number,
    dto: RejectDTO,
): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(
        `/lpj/${lpjId}/reject`,
        dto,
    );
    return data.data;
}
