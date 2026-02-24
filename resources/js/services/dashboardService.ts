import api from '@/lib/api';

// =============================================================================
// Types
// =============================================================================

export interface DashboardStats {
    type: 'admin' | 'unit' | 'finance' | 'leadership' | 'approver' | 'kasir' | 'payment';
    stats: {
        // Admin stats
        total_users?: number;
        total_pengajuan?: number;
        total_lpj?: number;
        total_anggaran?: number;
        total_units?: number;
        saldo_anggaran?: number;
        total_realisasi?: number;
        unit_nama?: string;
        // Unit stats
        pending_pengajuan?: number;
        // Finance stats
        total_penerimaan?: number;
        total_pengeluaran?: number;
        pending_payment?: number;
        // Approver stats
        pending_approval?: number;
        total_approved?: number;
        // Kasir stats
        menunggu_cetak?: number;
        dicetak_hari_ini?: number;
        total_cetak_bulan_ini?: number;
        // Payment stats
        menunggu_proses?: number;
        diproses_hari_ini?: number;
        total_proses_bulan_ini?: number;
    };
}

export interface ChartDataItem {
    unit: string;
    anggaran: number;
    realisasi: number;
    sisa: number;
}

export interface MonthlyChartDataItem {
    bulan: string;
    pengajuan: number;
    realisasi: number;
}

export interface RecentPengajuanItem {
    id: number;
    nomor: string;
    perihal: string;
    unit: string;
    total: number;
    status: string;
    tanggal: string;
    no_voucher?: string;
}

export interface StatusDistributionItem {
    name: string;
    value: number;
    color: string;
}

export interface UnitListItem {
    id: number;
    kode: string;
    nama: string;
}

export interface DashboardParams {
    unit_id?: number;
    tahun?: string;
}

export interface ReminderStats {
    // Approver: pending items needing approval
    pending_pengajuan_approval?: number;
    pending_lpj_approval?: number;
    pending_rapbs_approval?: number;
    // Unit/Substansi: items needing revision
    revised_pengajuan_count?: number;
    revised_lpj_count?: number;
    revised_rapbs_count?: number;
    // Unit/Substansi: rejected items
    rejected_pengajuan_count?: number;
    rejected_lpj_count?: number;
    rejected_rapbs_count?: number;
}

// =============================================================================
// API Calls
// =============================================================================

/**
 * Fetch aggregated dashboard statistics for the authenticated user.
 */
export async function getDashboardStats(params?: DashboardParams): Promise<DashboardStats> {
    const { data } = await api.get<{ data: DashboardStats }>('/dashboard/stats', { params });
    return data.data;
}

/**
 * Fetch budget vs realization chart data per unit.
 */
export async function getDashboardCharts(params?: DashboardParams): Promise<ChartDataItem[]> {
    const { data } = await api.get<{ data: ChartDataItem[] }>('/dashboard/charts', { params });
    return data.data;
}

/**
 * Fetch monthly pengajuan vs realization chart data for a specific unit.
 */
export async function getMonthlyCharts(params?: DashboardParams): Promise<MonthlyChartDataItem[]> {
    const { data } = await api.get<{ data: MonthlyChartDataItem[] }>('/dashboard/monthly-charts', { params });
    return data.data;
}

/**
 * Fetch recent pengajuan list.
 */
export async function getRecentPengajuan(params?: DashboardParams & { limit?: number }): Promise<RecentPengajuanItem[]> {
    const { data } = await api.get<{ data: RecentPengajuanItem[] }>('/dashboard/recent-pengajuan', { params });
    return data.data;
}

/**
 * Fetch status distribution for pie chart.
 */
export async function getStatusDistribution(params?: DashboardParams): Promise<StatusDistributionItem[]> {
    const { data } = await api.get<{ data: StatusDistributionItem[] }>('/dashboard/status-distribution', { params });
    return data.data;
}

/**
 * Fetch list of all units (for filters/dropdowns).
 */
export async function getUnitsList(): Promise<UnitListItem[]> {
    const { data } = await api.get<{ data: UnitListItem[] }>('/units/list');
    return data.data;
}

/**
 * Fetch reminder stats for login notification modal.
 */
export async function getReminderStats(): Promise<ReminderStats> {
    const { data } = await api.get<{ data: ReminderStats }>('/dashboard/reminder-stats');
    return data.data;
}
