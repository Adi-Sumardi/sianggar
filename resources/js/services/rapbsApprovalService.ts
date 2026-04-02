import api from '@/lib/api';
import type { Rapbs, RapbsApproval } from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
    RapbsFilterParams,
    RapbsApprovalFilterParams,
    CreateRapbsDTO,
    UpdateRapbsDTO,
    RapbsApproveDTO,
    RapbsReviseDTO,
    RapbsRejectDTO,
} from '@/types/api';

// =============================================================================
// RAPBS CRUD
// =============================================================================

export async function getRapbsList(
    params?: RapbsFilterParams,
): Promise<PaginatedResponse<Rapbs>> {
    const { data } = await api.get<PaginatedResponse<Rapbs>>('/rapbs-list', { params });
    return data;
}

export interface RapbsDetailResponse {
    data: Rapbs;
    can_approve: boolean;
}

export async function getRapbs(id: number): Promise<Rapbs & { can_approve_action: boolean }> {
    const { data } = await api.get<RapbsDetailResponse>(`/rapbs/${id}/detail`);
    return {
        ...data.data,
        can_approve_action: data.can_approve,
    };
}

export async function createRapbs(dto: CreateRapbsDTO): Promise<Rapbs> {
    const { data } = await api.post<ApiResponse<Rapbs>>('/rapbs', dto);
    return data.data;
}

export async function updateRapbs(id: number, dto: UpdateRapbsDTO): Promise<Rapbs> {
    const { data } = await api.put<ApiResponse<Rapbs>>(`/rapbs/${id}`, dto);
    return data.data;
}

export async function deleteRapbs(id: number): Promise<void> {
    await api.delete(`/rapbs/${id}`);
}

// =============================================================================
// RAPBS Approval Workflow
// =============================================================================

export async function getPendingApprovals(
    params?: RapbsApprovalFilterParams,
): Promise<PaginatedResponse<Rapbs>> {
    const { data } = await api.get<PaginatedResponse<Rapbs>>('/rapbs-approval/pending', { params });
    return data;
}

export async function submitRapbs(id: number): Promise<Rapbs> {
    const { data } = await api.post<ApiResponse<Rapbs>>(`/rapbs/${id}/submit`);
    return data.data;
}

export async function approveRapbs(id: number, dto?: RapbsApproveDTO): Promise<RapbsApproval> {
    const { data } = await api.post<ApiResponse<RapbsApproval>>(`/rapbs/${id}/approve`, dto);
    return data.data;
}

export async function reviseRapbs(id: number, dto: RapbsReviseDTO): Promise<RapbsApproval> {
    const { data } = await api.post<ApiResponse<RapbsApproval>>(`/rapbs/${id}/revise`, dto);
    return data.data;
}

export async function rejectRapbs(id: number, dto: RapbsRejectDTO): Promise<RapbsApproval> {
    const { data } = await api.post<ApiResponse<RapbsApproval>>(`/rapbs/${id}/reject`, dto);
    return data.data;
}

// =============================================================================
// RAPBS Approval History
// =============================================================================

export async function getRapbsApprovals(rapbsId: number): Promise<RapbsApproval[]> {
    const { data } = await api.get<ApiResponse<RapbsApproval[]>>(`/rapbs/${rapbsId}/approvals`);
    return data.data;
}


export async function updateRapbsKeterangan(id: number, keterangan: string | null): Promise<void> {
    await api.patch(`/rapbs/${id}/keterangan`, { keterangan });
}
