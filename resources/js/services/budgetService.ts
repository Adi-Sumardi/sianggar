import api from '@/lib/api';
import type {
    JenisMataAnggaran,
    MataAnggaran,
    SubMataAnggaran,
    DetailMataAnggaran,
    Apbs,
    NoMataAnggaran,
    LampiranMataAnggaran,
} from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
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
    BudgetCheckResult,
} from '@/types/api';

// =============================================================================
// Jenis Mata Anggaran
// =============================================================================

export async function getJenisMataAnggarans(
    params?: { search?: string; include_inactive?: boolean },
): Promise<{ data: JenisMataAnggaran[] }> {
    const { data } = await api.get<{ data: JenisMataAnggaran[] }>('/jenis-mata-anggarans', { params });
    return data;
}

export async function getJenisMataAnggaran(id: number): Promise<JenisMataAnggaran> {
    const { data } = await api.get<ApiResponse<JenisMataAnggaran>>(`/jenis-mata-anggarans/${id}`);
    return data.data;
}

export async function createJenisMataAnggaran(dto: CreateJenisMataAnggaranDTO): Promise<JenisMataAnggaran> {
    const { data } = await api.post<ApiResponse<JenisMataAnggaran>>('/jenis-mata-anggarans', dto);
    return data.data;
}

export async function updateJenisMataAnggaran(
    id: number,
    dto: UpdateJenisMataAnggaranDTO,
): Promise<JenisMataAnggaran> {
    const { data } = await api.put<ApiResponse<JenisMataAnggaran>>(`/jenis-mata-anggarans/${id}`, dto);
    return data.data;
}

export async function deleteJenisMataAnggaran(id: number): Promise<void> {
    await api.delete(`/jenis-mata-anggarans/${id}`);
}

// =============================================================================
// Mata Anggaran
// =============================================================================

export async function getMataAnggarans(
    params?: BudgetFilterParams,
): Promise<PaginatedResponse<MataAnggaran>> {
    const { data } = await api.get<PaginatedResponse<MataAnggaran>>('/mata-anggarans', { params });
    return data;
}

export async function getMataAnggaran(id: number): Promise<MataAnggaran> {
    const { data } = await api.get<ApiResponse<MataAnggaran>>(`/mata-anggarans/${id}`);
    return data.data;
}

export async function createMataAnggaran(dto: CreateMataAnggaranDTO): Promise<MataAnggaran> {
    const { data } = await api.post<ApiResponse<MataAnggaran>>('/mata-anggarans', dto);
    return data.data;
}

export async function updateMataAnggaran(
    id: number,
    dto: UpdateMataAnggaranDTO,
): Promise<MataAnggaran> {
    const { data } = await api.put<ApiResponse<MataAnggaran>>(`/mata-anggarans/${id}`, dto);
    return data.data;
}

export async function deleteMataAnggaran(id: number): Promise<void> {
    await api.delete(`/mata-anggarans/${id}`);
}

// =============================================================================
// Sub Mata Anggaran
// =============================================================================

export async function getSubMataAnggarans(
    mataAnggaranId: number,
    params?: PaginationParams,
): Promise<PaginatedResponse<SubMataAnggaran>> {
    const { data } = await api.get<PaginatedResponse<SubMataAnggaran>>(
        `/mata-anggarans/${mataAnggaranId}/sub-mata-anggarans`,
        { params },
    );
    return data;
}

export async function getSubMataAnggaran(id: number): Promise<SubMataAnggaran> {
    const { data } = await api.get<ApiResponse<SubMataAnggaran>>(`/sub-mata-anggarans/${id}`);
    return data.data;
}

export async function createSubMataAnggaran(dto: CreateSubMataAnggaranDTO): Promise<SubMataAnggaran> {
    const { data } = await api.post<ApiResponse<SubMataAnggaran>>('/sub-mata-anggarans', dto);
    return data.data;
}

export async function updateSubMataAnggaran(
    id: number,
    dto: UpdateSubMataAnggaranDTO,
): Promise<SubMataAnggaran> {
    const { data } = await api.put<ApiResponse<SubMataAnggaran>>(`/sub-mata-anggarans/${id}`, dto);
    return data.data;
}

export async function deleteSubMataAnggaran(id: number): Promise<void> {
    await api.delete(`/sub-mata-anggarans/${id}`);
}

// =============================================================================
// Detail Mata Anggaran
// =============================================================================

export async function getDetailMataAnggarans(
    params?: BudgetFilterParams & { mata_anggaran_id?: number; sub_mata_anggaran_id?: number },
): Promise<PaginatedResponse<DetailMataAnggaran>> {
    const { data } = await api.get<PaginatedResponse<DetailMataAnggaran>>(
        '/detail-mata-anggarans',
        { params },
    );
    return data;
}

export async function getDetailMataAnggaran(id: number): Promise<DetailMataAnggaran> {
    const { data } = await api.get<ApiResponse<DetailMataAnggaran>>(`/detail-mata-anggarans/${id}`);
    return data.data;
}

export async function createDetailMataAnggaran(
    dto: CreateDetailMataAnggaranDTO,
): Promise<DetailMataAnggaran> {
    const { data } = await api.post<ApiResponse<DetailMataAnggaran>>('/detail-mata-anggarans', dto);
    return data.data;
}

export async function updateDetailMataAnggaran(
    id: number,
    dto: UpdateDetailMataAnggaranDTO,
): Promise<DetailMataAnggaran> {
    const { data } = await api.put<ApiResponse<DetailMataAnggaran>>(
        `/detail-mata-anggarans/${id}`,
        dto,
    );
    return data.data;
}

export async function deleteDetailMataAnggaran(id: number): Promise<void> {
    await api.delete(`/detail-mata-anggarans/${id}`);
}

// =============================================================================
// APBS
// =============================================================================

export async function getApbsList(
    params?: BudgetFilterParams,
): Promise<PaginatedResponse<Apbs>> {
    const { data } = await api.get<PaginatedResponse<Apbs>>('/apbs', { params });
    return data;
}

export async function getApbs(id: number): Promise<Apbs> {
    const { data } = await api.get<ApiResponse<Apbs>>(`/apbs/${id}`);
    return data.data;
}

export async function createApbs(dto: CreateApbsDTO): Promise<Apbs> {
    const { data } = await api.post<ApiResponse<Apbs>>('/apbs', dto);
    return data.data;
}

export async function updateApbs(id: number, dto: UpdateApbsDTO): Promise<Apbs> {
    const { data } = await api.put<ApiResponse<Apbs>>(`/apbs/${id}`, dto);
    return data.data;
}

export async function deleteApbs(id: number): Promise<void> {
    await api.delete(`/apbs/${id}`);
}

// =============================================================================
// No Mata Anggaran (COA)
// =============================================================================

export async function getNoMataAnggarans(
    params?: PaginationParams,
): Promise<PaginatedResponse<NoMataAnggaran>> {
    const { data } = await api.get<PaginatedResponse<NoMataAnggaran>>('/no-mata-anggarans', {
        params,
    });
    return data;
}

export async function getNoMataAnggaran(id: number): Promise<NoMataAnggaran> {
    const { data } = await api.get<ApiResponse<NoMataAnggaran>>(`/no-mata-anggarans/${id}`);
    return data.data;
}

export async function createNoMataAnggaran(dto: CreateNoMataAnggaranDTO): Promise<NoMataAnggaran> {
    const { data } = await api.post<ApiResponse<NoMataAnggaran>>('/no-mata-anggarans', dto);
    return data.data;
}

export async function updateNoMataAnggaran(
    id: number,
    dto: UpdateNoMataAnggaranDTO,
): Promise<NoMataAnggaran> {
    const { data } = await api.put<ApiResponse<NoMataAnggaran>>(`/no-mata-anggarans/${id}`, dto);
    return data.data;
}

export async function deleteNoMataAnggaran(id: number): Promise<void> {
    await api.delete(`/no-mata-anggarans/${id}`);
}

// =============================================================================
// Lampiran Mata Anggaran
// =============================================================================

export async function getLampiranMataAnggarans(
    mataAnggaranId: number,
): Promise<LampiranMataAnggaran[]> {
    const { data } = await api.get<ApiResponse<LampiranMataAnggaran[]>>(
        `/mata-anggarans/${mataAnggaranId}/lampiran`,
    );
    return data.data;
}

export async function uploadLampiranMataAnggaran(
    mataAnggaranId: number,
    file: File,
): Promise<LampiranMataAnggaran> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<ApiResponse<LampiranMataAnggaran>>(
        `/mata-anggarans/${mataAnggaranId}/lampiran`,
        formData,
    );
    return data.data;
}

export async function deleteLampiranMataAnggaran(id: number): Promise<void> {
    await api.delete(`/lampiran-mata-anggarans/${id}`);
}

// =============================================================================
// COA by Unit
// =============================================================================

export interface CoaUnitData {
    unit_id: number;
    unit_kode: string | null;
    unit_nama: string | null;
    mata_anggarans: Array<{
        id: number;
        kode: string;
        nama: string;
        jenis: string | null;
        sub_count: number;
        total: number;
    }>;
}

export async function getCoaByUnit(params?: {
    unit_id?: number;
    tahun?: string;
}): Promise<CoaUnitData[]> {
    const { data } = await api.get<{ data: CoaUnitData[] }>('/coa/unit', { params });
    return data.data;
}

export async function exportCoaExcel(params?: { unit_id?: number; tahun?: string }): Promise<Blob> {
    const response = await api.get('/coa/export/excel', {
        params,
        responseType: 'blob',
    });
    return response.data;
}

export async function exportCoaPdf(params?: { unit_id?: number; tahun?: string }): Promise<Blob> {
    const response = await api.get('/coa/export/pdf', {
        params,
        responseType: 'blob',
    });
    return response.data;
}

// =============================================================================
// COA - Penerimaan
// =============================================================================

export interface PenerimaanListParams {
    unit_id?: number;
    tahun?: string;
    per_page?: number;
    page?: number;
}

export interface PenerimaanData {
    id: number;
    unit_id: number;
    tahun: string;
    bulan: string;
    sumber: string;
    jumlah: string;
    keterangan: string | null;
    unit?: { id: number; kode: string; nama: string };
    created_at: string;
    updated_at: string;
}

export async function getPenerimaanList(params?: PenerimaanListParams): Promise<PaginatedResponse<PenerimaanData>> {
    const { data } = await api.get<PaginatedResponse<PenerimaanData>>('/coa/penerimaan', { params });
    return data;
}

export interface CreatePenerimaanDTO {
    unit_id: number;
    tahun: string;
    bulan: string;
    sumber: string;
    jumlah: number;
    keterangan?: string | null;
}

export type UpdatePenerimaanDTO = Partial<CreatePenerimaanDTO>;

export async function createPenerimaan(dto: CreatePenerimaanDTO): Promise<PenerimaanData> {
    const { data } = await api.post<ApiResponse<PenerimaanData>>('/coa/penerimaan', dto);
    return data.data;
}

export async function updatePenerimaan(id: number, dto: UpdatePenerimaanDTO): Promise<PenerimaanData> {
    const { data } = await api.put<ApiResponse<PenerimaanData>>(`/coa/penerimaan/${id}`, dto);
    return data.data;
}

export async function deletePenerimaan(id: number): Promise<void> {
    await api.delete(`/coa/penerimaan/${id}`);
}

// =============================================================================
// COA - Realisasi
// =============================================================================

export interface RealisasiListParams {
    unit_id?: number;
    tahun?: string;
    per_page?: number;
    page?: number;
}

export interface RealisasiData {
    id: number;
    unit_id: number;
    tahun: string;
    bulan: string;
    jumlah_anggaran: string;
    jumlah_realisasi: string;
    sisa: string | null;
    persentase: string | null;
    keterangan: string | null;
    unit?: { id: number; kode: string; nama: string };
    created_at: string;
    updated_at: string;
}

export async function getRealisasiList(params?: RealisasiListParams): Promise<PaginatedResponse<RealisasiData>> {
    const { data } = await api.get<PaginatedResponse<RealisasiData>>('/coa/realisasi', { params });
    return data;
}

export interface CreateRealisasiDTO {
    unit_id: number;
    tahun: string;
    bulan: string;
    jumlah_anggaran: number;
    jumlah_realisasi: number;
    sisa?: number | null;
    persentase?: number | null;
    keterangan?: string | null;
}

export type UpdateRealisasiDTO = Partial<CreateRealisasiDTO>;

export async function createRealisasi(dto: CreateRealisasiDTO): Promise<RealisasiData> {
    const { data } = await api.post<ApiResponse<RealisasiData>>('/coa/realisasi', dto);
    return data.data;
}

export async function updateRealisasi(id: number, dto: UpdateRealisasiDTO): Promise<RealisasiData> {
    const { data } = await api.put<ApiResponse<RealisasiData>>(`/coa/realisasi/${id}`, dto);
    return data.data;
}

export async function deleteRealisasi(id: number): Promise<void> {
    await api.delete(`/coa/realisasi/${id}`);
}

// =============================================================================
// RAPBS
// =============================================================================

export interface RapbsUnitData {
    unit_id: number;
    unit_kode: string;
    unit_nama: string;
    total_anggaran: number;
    total_realisasi: number;
    sisa_anggaran: number;
    mata_anggarans: Array<{
        id: number;
        kode: string;
        nama: string;
        total: number;
        apbs_tahun_lalu: number;
        asumsi_realisasi: number;
        plafon_apbs: number;
    }>;
}

export interface UpdateBudgetComparisonDTO {
    apbs_tahun_lalu?: number;
    asumsi_realisasi?: number;
}

export interface BudgetComparisonResult {
    id: number;
    apbs_tahun_lalu: number;
    asumsi_realisasi: number;
    plafon_apbs: number;
}

export async function getRapbsList(params?: {
    unit_id?: number;
    tahun?: string;
}): Promise<RapbsUnitData[]> {
    const { data } = await api.get<{ data: RapbsUnitData[] }>('/rapbs', { params });
    return data.data;
}

export async function updateBudgetComparison(
    mataAnggaranId: number,
    dto: UpdateBudgetComparisonDTO,
): Promise<BudgetComparisonResult> {
    const { data } = await api.patch<ApiResponse<BudgetComparisonResult>>(
        `/mata-anggarans/${mataAnggaranId}/budget-comparison`,
        dto,
    );
    return data.data;
}

// =============================================================================
// Budget Sufficiency Check
// =============================================================================

export async function checkBudgetSufficiency(dto: BudgetCheckDTO): Promise<BudgetCheckResult> {
    const { data } = await api.post<BudgetCheckResult>('/budget/check-sufficiency', dto);
    return data;
}
