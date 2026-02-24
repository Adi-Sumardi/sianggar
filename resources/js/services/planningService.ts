import api from '@/lib/api';
import type {
    Strategy,
    Indikator,
    Proker,
    Kegiatan,
    Pkt,
} from '@/types/models';
import type {
    ApiResponse,
    PaginatedResponse,
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
// Strategy
// =============================================================================

export async function getStrategies(
    params?: PaginationParams,
): Promise<PaginatedResponse<Strategy>> {
    const { data } = await api.get<PaginatedResponse<Strategy>>('/strategies', { params });
    return data;
}

export async function getStrategy(id: number): Promise<Strategy> {
    const { data } = await api.get<ApiResponse<Strategy>>(`/strategies/${id}`);
    return data.data;
}

export async function createStrategy(dto: CreateStrategyDTO): Promise<Strategy> {
    const { data } = await api.post<ApiResponse<Strategy>>('/strategies', dto);
    return data.data;
}

export async function updateStrategy(id: number, dto: UpdateStrategyDTO): Promise<Strategy> {
    const { data } = await api.put<ApiResponse<Strategy>>(`/strategies/${id}`, dto);
    return data.data;
}

export async function deleteStrategy(id: number): Promise<void> {
    await api.delete(`/strategies/${id}`);
}

// =============================================================================
// Indikator (Indicator)
// =============================================================================

export async function getIndikators(
    params?: PaginationParams & { strategy_id?: number },
): Promise<PaginatedResponse<Indikator>> {
    const { data } = await api.get<PaginatedResponse<Indikator>>('/indicators', { params });
    return data;
}

export async function getIndikator(id: number): Promise<Indikator> {
    const { data } = await api.get<ApiResponse<Indikator>>(`/indicators/${id}`);
    return data.data;
}

export async function createIndikator(dto: CreateIndikatorDTO): Promise<Indikator> {
    const { data } = await api.post<ApiResponse<Indikator>>('/indicators', dto);
    return data.data;
}

export async function updateIndikator(id: number, dto: UpdateIndikatorDTO): Promise<Indikator> {
    const { data } = await api.put<ApiResponse<Indikator>>(`/indicators/${id}`, dto);
    return data.data;
}

export async function deleteIndikator(id: number): Promise<void> {
    await api.delete(`/indicators/${id}`);
}

// =============================================================================
// Proker (Program Kerja)
// =============================================================================

export async function getProkers(
    params?: PaginationParams & { strategy_id?: number; indikator_id?: number; unit_id?: number },
): Promise<PaginatedResponse<Proker>> {
    const { data } = await api.get<PaginatedResponse<Proker>>('/prokers', { params });
    return data;
}

export async function getProker(id: number): Promise<Proker> {
    const { data } = await api.get<ApiResponse<Proker>>(`/prokers/${id}`);
    return data.data;
}

export async function createProker(dto: CreateProkerDTO): Promise<Proker> {
    const { data } = await api.post<ApiResponse<Proker>>('/prokers', dto);
    return data.data;
}

export async function updateProker(id: number, dto: UpdateProkerDTO): Promise<Proker> {
    const { data } = await api.put<ApiResponse<Proker>>(`/prokers/${id}`, dto);
    return data.data;
}

export async function deleteProker(id: number): Promise<void> {
    await api.delete(`/prokers/${id}`);
}

// =============================================================================
// Kegiatan (Activity)
// =============================================================================

export async function getKegiatans(
    params?: PaginationParams & {
        strategy_id?: number;
        indikator_id?: number;
        proker_id?: number;
        unit_id?: number;
        jenis_kegiatan?: string;
    },
): Promise<PaginatedResponse<Kegiatan>> {
    const { data } = await api.get<PaginatedResponse<Kegiatan>>('/activities', { params });
    return data;
}

export async function getKegiatan(id: number): Promise<Kegiatan> {
    const { data } = await api.get<ApiResponse<Kegiatan>>(`/activities/${id}`);
    return data.data;
}

export async function createKegiatan(dto: CreateKegiatanDTO): Promise<Kegiatan> {
    const { data } = await api.post<ApiResponse<Kegiatan>>('/activities', dto);
    return data.data;
}

export async function updateKegiatan(id: number, dto: UpdateKegiatanDTO): Promise<Kegiatan> {
    const { data } = await api.put<ApiResponse<Kegiatan>>(`/activities/${id}`, dto);
    return data.data;
}

export async function deleteKegiatan(id: number): Promise<void> {
    await api.delete(`/activities/${id}`);
}

// =============================================================================
// PKT (Program Kerja Tahunan)
// =============================================================================

export async function getPkts(
    params?: PaginationParams & {
        strategy_id?: number;
        indikator_id?: number;
        proker_id?: number;
        kegiatan_id?: number;
        tahun?: string;
        unit?: string;
    },
): Promise<PaginatedResponse<Pkt>> {
    const { data } = await api.get<PaginatedResponse<Pkt>>('/pkt', { params });
    return data;
}

export async function getPkt(id: number): Promise<Pkt> {
    const { data } = await api.get<ApiResponse<Pkt>>(`/pkt/${id}`);
    return data.data;
}

export async function createPkt(dto: CreatePktDTO): Promise<Pkt> {
    const { data } = await api.post<ApiResponse<Pkt>>('/pkt', dto);
    return data.data;
}

export async function updatePkt(id: number, dto: UpdatePktDTO): Promise<Pkt> {
    const { data } = await api.put<ApiResponse<Pkt>>(`/pkt/${id}`, dto);
    return data.data;
}

export async function deletePkt(id: number): Promise<void> {
    await api.delete(`/pkt/${id}`);
}

export async function submitPkt(id: number): Promise<Pkt> {
    const { data } = await api.post<ApiResponse<Pkt>>(`/pkt/${id}/submit`);
    return data.data;
}
