import type {
    PengajuanAnggaran,
    DetailPengajuan,
    User,
} from './models';

// =============================================================================
// Generic API response wrappers
// =============================================================================

export interface ApiResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

// =============================================================================
// Dashboard
// =============================================================================

export interface DashboardStats {
    total_users: number;
    total_pengajuan: number;
    total_lpj: number;
    total_anggaran: number;
    pending_approvals: number;
    recent_pengajuan: PengajuanAnggaran[];
    budget_vs_realization: Array<{
        unit: string;
        anggaran: number;
        realisasi: number;
    }>;
}

// =============================================================================
// DTOs – Data Transfer Objects for form submissions
// =============================================================================

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginDTO {
    email: string;
    password: string;
}

export interface LoginResponse {
    user: User;
    token?: string;
}

export interface ChangePasswordDTO {
    current_password: string;
    password: string;
    password_confirmation: string;
}

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

export interface CreateUserDTO {
    name: string;
    email: string;
    password: string;
    role: string;
    unit_id?: number;
}

export interface UpdateUserDTO {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    unit_id?: number | null;
}

// ---------------------------------------------------------------------------
// Pengajuan Anggaran
// ---------------------------------------------------------------------------

export interface CreatePengajuanDTO {
    no_surat: string;
    nama_pengajuan: string;
    tahun: string;
    tempat?: string;
    waktu_kegiatan?: string;
    details: CreateDetailPengajuanDTO[];
}

export interface UpdatePengajuanDTO {
    nama_pengajuan?: string;
    tempat?: string;
    waktu_kegiatan?: string;
    no_surat?: string;
    details?: CreateDetailPengajuanDTO[];
}

export interface CreateDetailPengajuanDTO {
    detail_mata_anggaran_id: number;
    mata_anggaran_id?: number | null;
    sub_mata_anggaran_id?: number | null;
    nama_item?: string;
    jumlah: number;
    keterangan?: string;
}

// ---------------------------------------------------------------------------
// LPJ
// ---------------------------------------------------------------------------

export interface CreateLpjDTO {
    pengajuan_anggaran_id: number;
    unit: string;
    perihal: string;
    tahun: string;
    no_surat?: string;
    mata_anggaran?: string;
    no_mata_anggaran?: string;
    jumlah_pengajuan_total?: number;
    tgl_kegiatan?: string;
    input_realisasi?: number;
    deskripsi_singkat?: string;
    ditujukan?: string;
}

export interface UpdateLpjDTO {
    perihal?: string;
    tanggal?: string;
    total_realisasi?: number;
    sisa_anggaran?: number;
    catatan?: string;
}

// ---------------------------------------------------------------------------
// LPJ Approval workflow
// ---------------------------------------------------------------------------

export interface ValidateLpjDTO {
    has_activity_identity: boolean;
    has_cover_letter: boolean;
    has_narrative_report: boolean;
    has_financial_report: boolean;
    has_receipts: boolean;
    reference_type: string;
    notes?: string;
}

export interface ApproveLpjDTO {
    notes?: string;
}

export interface ReviseLpjDTO {
    notes: string;
}

export interface RejectLpjDTO {
    notes: string;
}

// ---------------------------------------------------------------------------
// Approval workflow
// ---------------------------------------------------------------------------

export interface ApproveDTO {
    notes?: string;
}

export interface ReviseDTO {
    notes: string;
}

export interface RejectDTO {
    notes: string;
}

export interface FinanceValidateDTO {
    valid_document: boolean;
    valid_calculation: boolean;
    valid_budget_code: boolean;
    reasonable_cost: boolean;
    reasonable_volume: boolean;
    reasonable_executor: boolean;
    reference_type: string;
    need_lpj: boolean;
    notes?: string;
}

export interface EditAmountDTO {
    new_amount: number;
    reason?: string;
}

export interface DiscussionMessageDTO {
    message: string;
}

// ---------------------------------------------------------------------------
// Budget (Jenis Mata Anggaran)
// ---------------------------------------------------------------------------

export interface CreateJenisMataAnggaranDTO {
    kode: string;
    nama: string;
    keterangan?: string | null;
}

export interface UpdateJenisMataAnggaranDTO {
    kode?: string;
    nama?: string;
    keterangan?: string | null;
    is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Budget (Mata Anggaran hierarchy)
// ---------------------------------------------------------------------------

export interface CreateMataAnggaranDTO {
    unit_id: number;
    no_mata_anggaran_id?: number | null;
    kode: string;
    nama: string;
    tahun: string;
    jenis?: string | null;
    keterangan?: string | null;
}

export interface UpdateMataAnggaranDTO {
    no_mata_anggaran_id?: number | null;
    kode?: string;
    nama?: string;
    jenis?: string | null;
    keterangan?: string | null;
}

export interface CreateSubMataAnggaranDTO {
    mata_anggaran_id: number;
    unit_id: number;
    kode: string;
    nama: string;
}

export interface UpdateSubMataAnggaranDTO {
    kode?: string;
    nama?: string;
}

export interface CreateDetailMataAnggaranDTO {
    mata_anggaran_id: number;
    sub_mata_anggaran_id?: number | null;
    unit_id: number;
    pkt_id?: number | null;
    kode: string;
    nama: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    jumlah: number;
    keterangan?: string;
}

export interface UpdateDetailMataAnggaranDTO {
    kode?: string;
    nama?: string;
    volume?: number;
    satuan?: string;
    harga_satuan?: number;
    jumlah?: number;
    keterangan?: string;
}

// ---------------------------------------------------------------------------
// Planning (Strategy, Indicator, Proker, Kegiatan, PKT)
// ---------------------------------------------------------------------------

export interface CreateStrategyDTO {
    kode: string;
    nama: string;
}

export interface UpdateStrategyDTO {
    kode?: string;
    nama?: string;
}

export interface CreateIndikatorDTO {
    strategy_id: number;
    kode: string;
    nama: string;
}

export interface UpdateIndikatorDTO {
    kode?: string;
    nama?: string;
}

export interface CreateProkerDTO {
    strategy_id: number;
    indikator_id: number;
    kode: string;
    nama: string;
}

export interface UpdateProkerDTO {
    kode?: string;
    nama?: string;
}

export interface CreateKegiatanDTO {
    strategy_id: number;
    indikator_id: number;
    proker_id: number;
    kode?: string;
    nama?: string;
    jenis_kegiatan?: 'unggulan' | 'non-unggulan';
}

export interface UpdateKegiatanDTO {
    kode?: string;
    nama?: string;
    jenis_kegiatan?: 'unggulan' | 'non-unggulan';
}

export interface CreatePktDTO {
    strategy_id: number;
    indikator_id: number;
    proker_id: number;
    kegiatan_id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id?: number | null;
    detail_mata_anggaran_id?: number | null;
    tahun: string;
    unit: string;
    deskripsi_kegiatan?: string;
    tujuan_kegiatan?: string;
    saldo_anggaran: number;
    volume?: number;
    satuan?: string;
}

export interface UpdatePktDTO {
    deskripsi_kegiatan?: string;
    tujuan_kegiatan?: string;
    saldo_anggaran?: number;
    volume?: number;
    satuan?: string;
}

// ---------------------------------------------------------------------------
// Email / Surat
// ---------------------------------------------------------------------------

export interface EmailRecipientDTO {
    user_id?: number | null;
    role?: string | null;
}

export interface CreateEmailDTO {
    name_surat: string;
    no_surat?: string;
    isi_surat: string;
    tgl_surat: string;
    ditujukan?: string; // Legacy field for single recipient
    recipients?: EmailRecipientDTO[]; // New field for multiple recipients
    status?: string;
}

export interface UpdateEmailDTO {
    name_surat?: string;
    no_surat?: string;
    isi_surat?: string;
    tgl_surat?: string;
    ditujukan?: string;
    recipients?: EmailRecipientDTO[];
    status?: string;
}

export interface CreateEmailReplyDTO {
    email_id: number;
    isi: string;
    files?: File[];
}

// ---------------------------------------------------------------------------
// APBS
// ---------------------------------------------------------------------------

export interface CreateApbsDTO {
    unit_id: number;
    tahun: string;
    total_anggaran: number;
    keterangan?: string;
}

export interface UpdateApbsDTO {
    total_anggaran?: number;
    total_realisasi?: number;
    sisa_anggaran?: number;
    keterangan?: string;
}

// ---------------------------------------------------------------------------
// NoMataAnggaran (COA)
// ---------------------------------------------------------------------------

export interface CreateNoMataAnggaranDTO {
    no_mata_anggaran: string;
    mata_anggaran: string;
}

export interface UpdateNoMataAnggaranDTO {
    no_mata_anggaran?: string;
    mata_anggaran?: string;
}

// ---------------------------------------------------------------------------
// FiscalYear
// ---------------------------------------------------------------------------

export interface CreateFiscalYearDTO {
    tahun: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
}

export interface UpdateFiscalYearDTO {
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
}

// ---------------------------------------------------------------------------
// Unit
// ---------------------------------------------------------------------------

export interface CreateUnitDTO {
    kode: string;
    nama: string;
}

export interface UpdateUnitDTO {
    kode?: string;
    nama?: string;
}

// ---------------------------------------------------------------------------
// Query / filter parameters
// ---------------------------------------------------------------------------

export interface PaginationParams {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
}

export interface PengajuanFilterParams extends PaginationParams {
    status?: string;
    unit_id?: number;
    tahun?: string;
}

export interface LpjFilterParams extends PaginationParams {
    status?: string;
    unit_id?: number;
}

export interface EmailFilterParams extends PaginationParams {
    filter?: 'inbox' | 'sent' | 'archive';
    status?: string;
}

export interface ApprovalFilterParams extends PaginationParams {
    stage?: string;
    status?: string;
}

export interface BudgetFilterParams extends PaginationParams {
    unit_id?: number;
    tahun?: string;
}

// ---------------------------------------------------------------------------
// Budget Check (Sufficiency)
// ---------------------------------------------------------------------------

export interface BudgetCheckItemDTO {
    detail_mata_anggaran_id: number;
    jumlah: number;
}

export interface BudgetCheckDTO {
    items: BudgetCheckItemDTO[];
}

export interface BudgetCheckResultItem {
    detail_mata_anggaran_id: number;
    kode: string;
    nama: string;
    anggaran_awal: number;
    saldo_dipakai: number;
    saldo_tersedia: number;
    jumlah_diminta: number;
    is_sufficient: boolean;
    kekurangan: number;
}

export interface BudgetCheckResult {
    all_sufficient: boolean;
    items: BudgetCheckResultItem[];
}

// ---------------------------------------------------------------------------
// Perubahan Anggaran (Budget Transfer)
// ---------------------------------------------------------------------------

export interface PerubahanAnggaranItemDTO {
    id?: number;
    type?: 'geser' | 'tambah'; // 'geser' = budget transfer, 'tambah' = add new budget
    source_detail_mata_anggaran_id: number | null; // null for 'tambah anggaran' type
    target_detail_mata_anggaran_id: number;
    amount: number;
    keterangan?: string;
}

export interface CreatePerubahanAnggaranDTO {
    perihal: string;
    alasan: string;
    tahun: string;
    items: PerubahanAnggaranItemDTO[];
}

export interface UpdatePerubahanAnggaranDTO {
    perihal?: string;
    alasan?: string;
    items?: PerubahanAnggaranItemDTO[];
}

export interface PerubahanAnggaranFilterParams extends PaginationParams {
    status?: string;
    unit_id?: number;
    tahun?: string;
}

// ---------------------------------------------------------------------------
// RAPBS (Rencana Anggaran Pendapatan dan Belanja Sekolah)
// ---------------------------------------------------------------------------

export interface CreateRapbsItemDTO {
    pkt_id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id?: number | null;
    detail_mata_anggaran_id?: number | null;
    kode_coa?: string;
    nama: string;
    uraian?: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
}

export interface UpdateRapbsItemDTO {
    nama?: string;
    uraian?: string;
    volume?: number;
    satuan?: string;
    harga_satuan?: number;
}

export interface CreateRapbsDTO {
    unit_id: number;
    tahun: string;
    items: CreateRapbsItemDTO[];
}

export interface UpdateRapbsDTO {
    keterangan?: string;
    items?: CreateRapbsItemDTO[];
}

export interface RapbsApproveDTO {
    notes?: string;
}

export interface RapbsReviseDTO {
    notes: string;
}

export interface RapbsRejectDTO {
    notes: string;
}

export interface RapbsFilterParams extends PaginationParams {
    unit_id?: number;
    tahun?: string;
    status?: string;
}

export interface RapbsApprovalFilterParams extends PaginationParams {
    stage?: string;
    status?: string;
}
