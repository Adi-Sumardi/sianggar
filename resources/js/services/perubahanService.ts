import api from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Perubahan {
    id: number;
    user_id: number;
    nama_pengajuan: string;
    unit: string;
    tahun: string;
    jumlah_pengajuan_total: number;
    status_revisi: string;
    date_revisi: string;
    time_revisi: string;
    keterangan?: string;
    user?: {
        id: number;
        name: string;
        unit?: {
            id: number;
            nama: string;
        };
    };
}

export interface PerubahanListParams {
    page?: number;
    per_page?: number;
    tahun?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface CreatePerubahanDto {
    pengajuan_anggaran_id: number;
    keterangan: string;
}

// ---------------------------------------------------------------------------
// API Calls
// ---------------------------------------------------------------------------

export async function getPerubahanList(params: PerubahanListParams = {}): Promise<PaginatedResponse<Perubahan>> {
    const { data } = await api.get('/perubahan', { params });
    return data;
}

export async function getPerubahan(id: number): Promise<Perubahan> {
    const { data } = await api.get(`/perubahan/${id}`);
    return data.data;
}

export async function createPerubahan(dto: CreatePerubahanDto): Promise<Perubahan> {
    const { data } = await api.post('/perubahan', dto);
    return data.data;
}

export async function deletePerubahan(id: number): Promise<void> {
    await api.delete(`/perubahan/${id}`);
}
