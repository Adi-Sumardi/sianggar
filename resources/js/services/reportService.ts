import api from '@/lib/api';
import type { Lpj, LpjExpectedStage } from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
    LpjFilterParams,
    CreateLpjDTO,
    UpdateLpjDTO,
    ValidateLpjDTO,
    ApproveLpjDTO,
    ReviseLpjDTO,
    RejectLpjDTO,
} from '@/types/api';

// =============================================================================
// LPJ (Laporan Pertanggungjawaban)
// =============================================================================

export async function getLpjs(
    params?: LpjFilterParams,
): Promise<PaginatedResponse<Lpj>> {
    const { data } = await api.get<PaginatedResponse<Lpj>>('/lpj', { params });
    return data;
}

export interface LpjStats {
    pending_lpj_count: number;
    revised_lpj_count: number;
    revised_pengajuan_count: number;
    can_create_pengajuan: boolean;
    max_pending_lpj: number;
}

export async function getLpjStats(): Promise<LpjStats> {
    const { data } = await api.get<{ data: LpjStats }>('/lpj/stats');
    return data.data;
}

export async function getLpj(id: number): Promise<Lpj> {
    const { data } = await api.get<ApiResponse<Lpj>>(`/lpj/${id}`);
    return data.data;
}

export async function createLpj(dto: CreateLpjDTO): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>('/lpj', dto);
    return data.data;
}

export async function updateLpj(id: number, dto: UpdateLpjDTO): Promise<Lpj> {
    const { data } = await api.put<ApiResponse<Lpj>>(`/lpj/${id}`, dto);
    return data.data;
}

export async function deleteLpj(id: number): Promise<void> {
    await api.delete(`/lpj/${id}`);
}

/**
 * Submit a draft LPJ for review.
 */
export async function submitLpj(id: number): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(`/lpj/${id}/submit`);
    return data.data;
}

/**
 * Resubmit a revised LPJ.
 */
export async function resubmitLpj(id: number): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(`/lpj/${id}/resubmit`);
    return data.data;
}

// =============================================================================
// LPJ Approval Actions
// =============================================================================

/**
 * Validate LPJ with checklist (Staf Keuangan stage only).
 */
export async function validateLpj(id: number, dto: ValidateLpjDTO): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(`/lpj/${id}/validate`, dto);
    return data.data;
}

/**
 * Approve LPJ (middle approver and Keuangan stages).
 */
export async function approveLpj(id: number, dto?: ApproveLpjDTO): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(`/lpj/${id}/approve`, dto ?? {});
    return data.data;
}

/**
 * Request revision on LPJ.
 */
export async function reviseLpj(id: number, dto: ReviseLpjDTO): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(`/lpj/${id}/revise`, dto);
    return data.data;
}

/**
 * Reject LPJ.
 */
export async function rejectLpj(id: number, dto: RejectLpjDTO): Promise<Lpj> {
    const { data } = await api.post<ApiResponse<Lpj>>(`/lpj/${id}/reject`, dto);
    return data.data;
}

/**
 * Get approval timeline for LPJ.
 */
export async function getLpjTimeline(id: number): Promise<LpjExpectedStage[]> {
    const { data } = await api.get<{ data: LpjExpectedStage[] }>(`/lpj/${id}/timeline`);
    return data.data;
}

// =============================================================================
// LPJ Attachments
// =============================================================================

export async function uploadLpjAttachment(lpjId: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await api.post(`/lpj/${lpjId}/attachments`, formData);
}

export async function deleteLpjAttachment(
    lpjId: number,
    attachmentId: number,
): Promise<void> {
    await api.delete(`/lpj/${lpjId}/attachments/${attachmentId}`);
}

// =============================================================================
// Laporan / Reports export
// =============================================================================

export async function exportLpj(id: number): Promise<Blob> {
    const response = await api.get(`/lpj/${id}/export`, {
        responseType: 'blob',
    });
    return response.data;
}

export async function printLpj(id: number): Promise<Blob> {
    const response = await api.get(`/lpj/${id}/print`, {
        responseType: 'blob',
    });
    return response.data;
}

/**
 * Export a consolidated budget report for a unit and fiscal year.
 */
export async function exportLaporan(params: {
    unit_id?: number;
    tahun?: string;
    format?: 'xlsx' | 'pdf';
}): Promise<Blob> {
    const response = await api.get('/laporan/export', {
        params,
        responseType: 'blob',
    });
    return response.data;
}

/**
 * Export realisasi (budget realization) report.
 */
export async function exportRealisasi(params: {
    unit_id?: number;
    tahun?: string;
    bulan?: number;
    format?: 'xlsx' | 'pdf';
}): Promise<Blob> {
    const response = await api.get('/laporan/realisasi/export', {
        params,
        responseType: 'blob',
    });
    return response.data;
}
