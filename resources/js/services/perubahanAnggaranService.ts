import api from '@/lib/api';
import type { PerubahanAnggaran, ExpectedStage } from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
    CreatePerubahanAnggaranDTO,
    UpdatePerubahanAnggaranDTO,
    PerubahanAnggaranFilterParams,
} from '@/types/api';

/** Identifier perubahan anggaran untuk API: ULID (baru) atau id numerik (legacy). */
export type PerubahanAnggaranId = number | string;

// =============================================================================
// Perubahan Anggaran CRUD
// =============================================================================

export async function getPerubahanAnggarans(
    params?: PerubahanAnggaranFilterParams,
): Promise<PaginatedResponse<PerubahanAnggaran>> {
    const { data } = await api.get<PaginatedResponse<PerubahanAnggaran>>(
        '/perubahan-anggaran',
        { params },
    );
    return data;
}

export async function getPerubahanAnggaran(id: PerubahanAnggaranId): Promise<PerubahanAnggaran> {
    const { data } = await api.get<{ data: PerubahanAnggaran }>(`/perubahan-anggaran/${id}`);
    return data.data;
}

export async function createPerubahanAnggaran(
    dto: CreatePerubahanAnggaranDTO,
): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>('/perubahan-anggaran', dto);
    return data.data;
}

export async function updatePerubahanAnggaran(
    id: PerubahanAnggaranId,
    dto: UpdatePerubahanAnggaranDTO,
): Promise<PerubahanAnggaran> {
    const { data } = await api.put<ApiResponse<PerubahanAnggaran>>(
        `/perubahan-anggaran/${id}`,
        dto,
    );
    return data.data;
}

export async function deletePerubahanAnggaran(id: PerubahanAnggaranId): Promise<void> {
    await api.delete(`/perubahan-anggaran/${id}`);
}

// =============================================================================
// Submission & Approval Actions
// =============================================================================

export async function submitPerubahanAnggaran(id: PerubahanAnggaranId): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>(
        `/perubahan-anggaran/${id}/submit`,
    );
    return data.data;
}

export async function resubmitPerubahanAnggaran(id: PerubahanAnggaranId): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>(
        `/perubahan-anggaran/${id}/resubmit`,
    );
    return data.data;
}

export async function approvePerubahanAnggaran(
    id: PerubahanAnggaranId,
    notes?: string,
): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>(
        `/perubahan-anggaran/${id}/approve`,
        { notes },
    );
    return data.data;
}

export async function revisePerubahanAnggaran(
    id: PerubahanAnggaranId,
    notes: string,
): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>(
        `/perubahan-anggaran/${id}/revise`,
        { notes },
    );
    return data.data;
}

export async function rejectPerubahanAnggaran(
    id: PerubahanAnggaranId,
    notes: string,
): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>(
        `/perubahan-anggaran/${id}/reject`,
        { notes },
    );
    return data.data;
}

// =============================================================================
// Approval Queue & Stages
// =============================================================================

export async function getPerubahanAnggaranApprovalQueue(): Promise<PerubahanAnggaran[]> {
    const { data } = await api.get<PerubahanAnggaran[]>(
        '/perubahan-anggaran-queue',
    );
    return data;
}

export async function getExpectedStages(id: PerubahanAnggaranId): Promise<ExpectedStage[]> {
    const { data } = await api.get<{ data: ExpectedStage[] }>(
        `/perubahan-anggaran/${id}/expected-stages`,
    );
    return data.data;
}

// =============================================================================
// Attachments
// =============================================================================

export async function uploadPerubahanAnggaranAttachment(
    perubahanAnggaranId: PerubahanAnggaranId,
    file: File,
): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);

    await api.post(`/perubahan-anggaran/${perubahanAnggaranId}/attachments`, formData);
}

export async function deletePerubahanAnggaranAttachment(
    perubahanAnggaranId: PerubahanAnggaranId,
    attachmentId: number,
): Promise<void> {
    await api.delete(`/perubahan-anggaran/${perubahanAnggaranId}/attachments/${attachmentId}`);
}
