import api from '@/lib/api';

// =============================================================================
// Types
// =============================================================================

export interface LaporanPengajuanItem {
    id: number;
    no_surat: string;
    perihal: string;
    unit: { id: number; nama: string; kode: string } | null;
    jumlah_pengajuan_total: number;
    status_proses: string;
    current_approval_stage: string | null;
    created_at: string;
}

export interface LaporanPengajuanResponse {
    data: LaporanPengajuanItem[];
    summary: {
        total_count: number;
        total_amount: number;
        by_status: Record<string, number>;
    };
}

export interface LaporanPengajuanParams {
    unit_id?: number;
    tahun?: string;
    status?: string;
    from?: string;
    to?: string;
}

export interface CawuUnitData {
    unit_id: number;
    unit_kode: string;
    unit_nama: string;
    tahun: string;
    total_pengajuan: number;
    total_realisasi: number;
    total_penerimaan: number;
    pengajuans_count: number;
    monthly_realisasi: Record<
        string,
        {
            anggaran: number;
            realisasi: number;
            sisa: number;
        }
    >;
}

export interface CawuUnitResponse {
    data: CawuUnitData;
}

export interface CawuUnitParams {
    unit_id?: number;
    tahun: string;
}

export interface CawuGabunganUnit {
    unit_id: number;
    unit_kode: string;
    unit_nama: string;
    total_anggaran: number;
    total_pengajuan: number;
    total_realisasi: number;
    sisa_anggaran: number;
}

export interface CawuGabunganData {
    tahun: string;
    units: CawuGabunganUnit[];
    grand_total: {
        anggaran: number;
        pengajuan: number;
        realisasi: number;
        sisa: number;
    };
}

export interface CawuGabunganResponse {
    data: CawuGabunganData;
}

export interface CawuGabunganParams {
    unit_id?: number;
    tahun?: string;
}

export interface AccountingData {
    tahun: string;
    total_penerimaan: number;
    total_realisasi: number;
    penerimaan_by_unit: Array<{
        unit: string | null;
        total: number;
    }>;
    realisasi_by_unit: Array<{
        unit: string | null;
        total_anggaran: number;
        total_realisasi: number;
        total_sisa: number;
    }>;
}

export interface AccountingResponse {
    data: AccountingData;
}

export interface AccountingParams {
    unit_id?: number;
    tahun?: string;
}

// =============================================================================
// API Functions
// =============================================================================

export async function getLaporanPengajuan(
    params?: LaporanPengajuanParams,
): Promise<LaporanPengajuanResponse> {
    const { data } = await api.get<LaporanPengajuanResponse>('/laporan/pengajuan', { params });
    return data;
}

export async function getCawuUnit(params: CawuUnitParams): Promise<CawuUnitData> {
    const { data } = await api.get<CawuUnitResponse>('/laporan/cawu-unit', { params });
    return data.data;
}

export async function getCawuGabungan(params?: CawuGabunganParams): Promise<CawuGabunganData> {
    const { data } = await api.get<CawuGabunganResponse>('/laporan/cawu-gabungan', { params });
    return data.data;
}

export async function getAccounting(params?: AccountingParams): Promise<AccountingData> {
    const { data } = await api.get<AccountingResponse>('/laporan/accounting', { params });
    return data.data;
}

export async function exportLaporanExcel(params: {
    type: 'pengajuan' | 'realisasi' | 'penerimaan';
    tahun?: string;
    unit_id?: number;
}): Promise<Blob> {
    const response = await api.get('/laporan/export/excel', {
        params,
        responseType: 'blob',
    });
    return response.data;
}

export async function exportLaporanPdf(params: {
    type: 'pengajuan' | 'realisasi' | 'penerimaan';
    tahun?: string;
    unit_id?: number;
}): Promise<Blob> {
    const response = await api.get('/laporan/export/pdf', {
        params,
        responseType: 'blob',
    });
    return response.data;
}
