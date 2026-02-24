import api from '@/lib/api';
import type { PengajuanAnggaran, DetailPengajuan } from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
    PengajuanFilterParams,
    CreatePengajuanDTO,
    UpdatePengajuanDTO,
} from '@/types/api';

// =============================================================================
// Pengajuan Anggaran (Budget Proposals)
// =============================================================================

export async function getPengajuans(
    params?: PengajuanFilterParams,
): Promise<PaginatedResponse<PengajuanAnggaran>> {
    const { data } = await api.get<PaginatedResponse<PengajuanAnggaran>>('/pengajuan', { params });
    return data;
}

export async function getPengajuan(id: number): Promise<PengajuanAnggaran> {
    const { data } = await api.get<ApiResponse<PengajuanAnggaran>>(`/pengajuan/${id}`);
    return data.data;
}

export async function createPengajuan(dto: CreatePengajuanDTO): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>('/pengajuan', dto);
    return data.data;
}

export async function updatePengajuan(
    id: number,
    dto: UpdatePengajuanDTO,
): Promise<PengajuanAnggaran> {
    const { data } = await api.put<ApiResponse<PengajuanAnggaran>>(`/pengajuan/${id}`, dto);
    return data.data;
}

export async function deletePengajuan(id: number): Promise<void> {
    await api.delete(`/pengajuan/${id}`);
}

/**
 * Submit a draft proposal for approval.
 */
export async function submitPengajuan(id: number): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(`/pengajuan/${id}/submit`);
    return data.data;
}

/**
 * Resubmit a revised proposal for approval.
 * After user revises their proposal, this sends it back to the approver who requested revision.
 */
export async function resubmitPengajuan(id: number): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(`/pengajuan/${id}/resubmit`);
    return data.data;
}

/**
 * Get pengajuan available for LPJ creation.
 * Returns pengajuan that are paid with need_lpj=true and don't have an active LPJ.
 */
export async function getAvailableForLpj(params?: {
    tahun?: string;
}): Promise<PengajuanAnggaran[]> {
    const { data } = await api.get<{ data: PengajuanAnggaran[] }>('/pengajuan/available-for-lpj', { params });
    return data.data;
}

// =============================================================================
// Detail Pengajuan (Proposal Line Items)
// =============================================================================

export async function getDetailPengajuans(
    pengajuanId: number,
): Promise<DetailPengajuan[]> {
    const { data } = await api.get<ApiResponse<DetailPengajuan[]>>(
        `/pengajuan/${pengajuanId}/details`,
    );
    return data.data;
}

export async function getDetailPengajuan(id: number): Promise<DetailPengajuan> {
    const { data } = await api.get<ApiResponse<DetailPengajuan>>(`/detail-pengajuans/${id}`);
    return data.data;
}

// =============================================================================
// Pengajuan Perubahan (Amendment Proposals)
// =============================================================================

export async function createPerubahan(
    pengajuanId: number,
    dto: UpdatePengajuanDTO,
): Promise<PengajuanAnggaran> {
    const { data } = await api.post<ApiResponse<PengajuanAnggaran>>(
        `/pengajuan/${pengajuanId}/perubahan`,
        dto,
    );
    return data.data;
}

// =============================================================================
// Attachments
// =============================================================================

export async function uploadPengajuanAttachment(
    pengajuanId: number,
    file: File,
): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await api.post(`/pengajuan/${pengajuanId}/attachments`, formData);
}

export async function deletePengajuanAttachment(
    pengajuanId: number,
    attachmentId: number,
): Promise<void> {
    await api.delete(`/pengajuan/${pengajuanId}/attachments/${attachmentId}`);
}

// =============================================================================
// Export
// =============================================================================

export async function exportPengajuan(id: number): Promise<Blob> {
    const response = await api.get(`/pengajuan/${id}/export`, {
        responseType: 'blob',
    });
    return response.data;
}

export async function printPengajuan(id: number): Promise<Blob> {
    const response = await api.get(`/pengajuan/${id}/print`, {
        responseType: 'blob',
    });
    return response.data;
}
