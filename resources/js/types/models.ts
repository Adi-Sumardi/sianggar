import type {
    UserRole,
    ApprovalStage,
    ApprovalStatus,
    ProposalStatus,
    AmountCategory,
    ReferenceType,
    LpjStatus,
    LpjApprovalStage,
    EmailStatus,
    PerubahanAnggaranStatus,
    RapbsStatus,
    RapbsApprovalStage,
} from './enums';

// =============================================================================
// Core models – fields match the database migrations & Eloquent models
// =============================================================================

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    unit_id: number | null;
    email_verified_at: string | null;
    unit?: Unit;
    permissions: string[];
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// Unit
// ---------------------------------------------------------------------------

export interface Unit {
    id: number;
    kode: string;
    nama: string;
    created_at: string;
    updated_at: string;

    // Counts (from withCount)
    users_count?: number;
    mata_anggarans_count?: number;

    // Relations
    users?: User[];
    mata_anggarans?: MataAnggaran[];
    sub_mata_anggarans?: SubMataAnggaran[];
    apbs?: Apbs[];
    penerimaans?: Penerimaan[];
    realisasi_anggarans?: RealisasiAnggaran[];
    detail_mata_anggarans?: DetailMataAnggaran[];
}

// ---------------------------------------------------------------------------
// FiscalYear
// ---------------------------------------------------------------------------

export interface FiscalYear {
    id: number;
    tahun: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

export interface Strategy {
    id: number;
    kode: string;
    nama: string;
    created_at: string;
    updated_at: string;

    // Relations
    indikators?: Indikator[];
    prokers?: Proker[];
    kegiatans?: Kegiatan[];
    pkts?: Pkt[];
}

// ---------------------------------------------------------------------------
// Indikator (Indicator)
// ---------------------------------------------------------------------------

export interface Indikator {
    id: number;
    strategy_id: number;
    kode: string;
    nama: string;
    created_at: string;
    updated_at: string;

    // Relations
    strategy?: Strategy;
    prokers?: Proker[];
    kegiatans?: Kegiatan[];
}

// ---------------------------------------------------------------------------
// Proker (Program Kerja)
// ---------------------------------------------------------------------------

export interface Proker {
    id: number;
    strategy_id: number;
    indikator_id: number;
    unit_id: number | null;
    kode: string;
    nama: string;
    created_at: string;
    updated_at: string;

    // Relations
    unit?: Unit;
    strategy?: Strategy;
    indikator?: Indikator;
    kegiatans?: Kegiatan[];
    pkts?: Pkt[];
}

// ---------------------------------------------------------------------------
// Kegiatan (Activity)
// ---------------------------------------------------------------------------

export interface Kegiatan {
    id: number;
    strategy_id: number;
    indikator_id: number;
    proker_id: number;
    unit_id: number | null;
    kode: string | null;
    nama: string | null;
    jenis_kegiatan: 'unggulan' | 'non-unggulan';
    created_at: string;
    updated_at: string;

    // Relations
    unit?: Unit;
    strategy?: Strategy;
    indikator?: Indikator;
    proker?: Proker;
    pkts?: Pkt[];
}

// ---------------------------------------------------------------------------
// NoMataAnggaran (Chart of Account number)
// ---------------------------------------------------------------------------

export interface NoMataAnggaran {
    id: number;
    no_mata_anggaran: string;
    mata_anggaran: string;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// JenisMataAnggaran (Budget Account Type)
// ---------------------------------------------------------------------------

export interface JenisMataAnggaran {
    id: number;
    kode: string;
    nama: string;
    keterangan: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// MataAnggaran (Budget Account)
// ---------------------------------------------------------------------------

export interface MataAnggaran {
    id: number;
    unit_id: number;
    no_mata_anggaran_id: number | null;
    kode: string;
    nama: string;
    tahun: string;
    jenis: string | null;
    keterangan: string | null;
    apbs_tahun_lalu: number;
    asumsi_realisasi: number;
    plafon_apbs: number;
    created_at: string;
    updated_at: string;

    // Relations
    unit?: Unit;
    no_mata_anggaran?: NoMataAnggaran;
    sub_mata_anggarans?: SubMataAnggaran[];
    detail_mata_anggarans?: DetailMataAnggaran[];
    detail_pengajuans?: DetailPengajuan[];
    lampiran_mata_anggarans?: LampiranMataAnggaran[];
}

// ---------------------------------------------------------------------------
// SubMataAnggaran (Sub Budget Account)
// ---------------------------------------------------------------------------

export interface SubMataAnggaran {
    id: number;
    mata_anggaran_id: number;
    unit_id: number;
    kode: string;
    nama: string;
    created_at: string;
    updated_at: string;

    // Relations
    mata_anggaran?: MataAnggaran;
    unit?: Unit;
    detail_mata_anggarans?: DetailMataAnggaran[];
    lampiran_mata_anggarans?: LampiranMataAnggaran[];
}

// ---------------------------------------------------------------------------
// DetailMataAnggaran (Budget Account Detail / Line Item)
// ---------------------------------------------------------------------------

export interface DetailMataAnggaran {
    id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id: number | null;
    unit_id: number;
    pkt_id: number | null;
    tahun: string;
    kode: string;
    nama: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    jumlah: number;
    keterangan: string | null;
    // Budget fields
    anggaran_awal: number;
    saldo_dipakai: number;
    saldo_tersedia: number;
    realisasi: number;
    created_at: string;
    updated_at: string;

    // Relations
    mata_anggaran?: MataAnggaran;
    sub_mata_anggaran?: SubMataAnggaran;
    unit?: Unit;
    pkt?: Pkt;
    detail_pengajuans?: DetailPengajuan[];
    lampiran_mata_anggarans?: LampiranMataAnggaran[];
}

// ---------------------------------------------------------------------------
// Pkt (Program Kerja Tahunan)
// ---------------------------------------------------------------------------

export interface Pkt {
    id: number;
    strategy_id: number;
    indikator_id: number;
    proker_id: number;
    kegiatan_id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id: number | null;
    detail_mata_anggaran_id: number | null;
    unit_id: number | null;
    tahun: string;
    unit: string; // Legacy string field
    deskripsi_kegiatan: string | null;
    tujuan_kegiatan: string | null;
    saldo_anggaran: number;
    volume: number;
    satuan: string;
    status: string;
    catatan: string | null;
    created_by: number | null;
    kode_coa: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    strategy?: Strategy;
    indikator?: Indikator;
    proker?: Proker;
    kegiatan?: Kegiatan;
    mata_anggaran?: MataAnggaran;
    sub_mata_anggaran?: SubMataAnggaran;
    detail_mata_anggaran?: DetailMataAnggaran;
    unit_relation?: Unit;
    creator?: User;
    rapbs_items?: RapbsItem[];
}

// ---------------------------------------------------------------------------
// PengajuanAnggaran (Budget Proposal)
// ---------------------------------------------------------------------------

export interface PengajuanAnggaran {
    id: number;
    user_id: number;
    tahun_anggaran: string;
    nomor_pengajuan: string;
    perihal: string;
    nama_pengajuan: string;
    no_surat: string | null;
    tempat: string | null;
    waktu_kegiatan: string | null;
    unit_id: number | null;
    jumlah_pengajuan_total: number;
    status_proses: ProposalStatus | string;
    current_approval_stage: ApprovalStage | string | null;
    revision_requested_stage: ApprovalStage | string | null;
    status_revisi: string | null;
    date_revisi: string | null;
    time_revisi: string | null;
    status_payment: string;
    no_voucher: string | null;
    voucher_number?: string | null;
    print_status: string;
    payment_recipient: string | null;
    payment_method: string | null;
    payment_notes: string | null;
    paid_at: string | null;
    paid_by?: User | null;
    amount_category: AmountCategory | null;
    reference_type: ReferenceType | null;
    need_lpj: boolean;
    approved_amount: number | null;
    submitter_type: 'unit' | 'substansi' | null;
    created_at: string;
    updated_at: string;

    // Relations
    user?: User;
    unit?: Unit;
    detail_pengajuans?: DetailPengajuan[];
    approvals?: Approval[];
    lpjs?: Lpj[];
    attachments?: Attachment[];
    finance_validation?: FinanceValidation | null;
    discussions?: Discussion[];
    amount_edit_logs?: AmountEditLog[];
}

// ---------------------------------------------------------------------------
// DetailPengajuan (Proposal Line Item)
// ---------------------------------------------------------------------------

export interface DetailPengajuan {
    id: number;
    pengajuan_anggaran_id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id: number | null;
    detail_mata_anggaran_id: number | null;
    uraian: string;
    volume: number;
    satuan: string;
    harga_satuan: number;
    jumlah: number;
    keterangan: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    pengajuan_anggaran?: PengajuanAnggaran;
    mata_anggaran?: MataAnggaran;
    sub_mata_anggaran?: SubMataAnggaran;
    detail_mata_anggaran?: DetailMataAnggaran;
}

// ---------------------------------------------------------------------------
// Lpj (Laporan Pertanggungjawaban)
// ---------------------------------------------------------------------------

export interface Lpj {
    id: number;
    pengajuan_anggaran_id: number;
    unit: string;
    no_surat: string | null;
    mata_anggaran: string | null;
    perihal: string;
    no_mata_anggaran: string | null;
    jumlah_pengajuan_total: number;
    tgl_kegiatan: string | null;
    input_realisasi: number;
    deskripsi_singkat: string | null;

    // Status
    proses: LpjStatus | string;
    proses_label: string;
    proses_color: string;
    is_editable: boolean;
    is_final: boolean;

    // Approval stage
    current_approval_stage: LpjApprovalStage | string | null;
    current_approval_stage_label: string | null;
    status_revisi: string | null;

    // Routing
    reference_type: ReferenceType | null;
    reference_type_label: string | null;

    // Validation info
    validated_at: string | null;
    validated_by: number | null;
    validation_notes: string | null;

    tahun: string;
    ditujukan: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    pengajuan_anggaran?: PengajuanAnggaran;
    validated_by_user?: User;
    attachments?: Attachment[];
    approvals?: Approval[];
    validation?: LpjValidation;

    // Expected approval stages (only when in workflow)
    expected_stages?: LpjExpectedStage[];
}

// ---------------------------------------------------------------------------
// LpjValidation
// ---------------------------------------------------------------------------

export interface LpjValidation {
    id: number;
    lpj_id: number;
    validated_by: number;

    // Checklist items
    has_activity_identity: boolean;
    has_cover_letter: boolean;
    has_narrative_report: boolean;
    has_financial_report: boolean;
    has_receipts: boolean;

    // Derived values
    is_complete: boolean;
    checked_count: number;
    total_items: number;

    // Routing
    reference_type: ReferenceType;
    reference_type_label: string;

    notes: string | null;
    validator?: User;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// LpjExpectedStage (from LPJ routing engine API)
// ---------------------------------------------------------------------------

export interface LpjExpectedStage {
    stage: LpjApprovalStage | string;
    label: string;
    status: 'approved' | 'pending' | 'revised' | 'rejected' | 'current' | 'future';
    approval: Approval | null;
    order: number;
}

// ---------------------------------------------------------------------------
// Approval
// ---------------------------------------------------------------------------

export interface Approval {
    id: number;
    approvable_type: string;
    approvable_id: number;
    stage: ApprovalStage;
    stage_order: number;
    status: ApprovalStatus;
    approved_by: number | null;
    notes: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    approvable?: PengajuanAnggaran | Lpj;
    approver?: User;
}

// ---------------------------------------------------------------------------
// FinanceValidation
// ---------------------------------------------------------------------------

export interface FinanceValidation {
    id: number;
    pengajuan_anggaran_id: number;
    validated_by: number | null;
    valid_document: boolean;
    valid_calculation: boolean;
    valid_budget_code: boolean;
    reasonable_cost: boolean;
    reasonable_volume: boolean;
    reasonable_executor: boolean;
    reference_type: ReferenceType | null;
    amount_category: AmountCategory | null;
    need_lpj: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    validator?: User;
}

// ---------------------------------------------------------------------------
// Discussion
// ---------------------------------------------------------------------------

export interface Discussion {
    id: number;
    pengajuan_anggaran_id: number;
    status: 'open' | 'closed';
    opened_by: number;
    closed_by: number | null;
    opened_at: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    opener?: User;
    closer?: User;
    messages?: DiscussionMessage[];
}

// ---------------------------------------------------------------------------
// DiscussionMessage
// ---------------------------------------------------------------------------

export interface DiscussionMessage {
    id: number;
    discussion_id: number;
    user_id: number;
    message: string;
    created_at: string;
    updated_at: string;

    // Relations
    user?: User;
}

// ---------------------------------------------------------------------------
// AmountEditLog
// ---------------------------------------------------------------------------

export interface AmountEditLog {
    id: number;
    pengajuan_anggaran_id: number;
    edited_by: number;
    original_amount: number;
    new_amount: number;
    reason: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    editor?: User;
}

// ---------------------------------------------------------------------------
// ExpectedStage (from routing engine API)
// ---------------------------------------------------------------------------

export interface ExpectedStage {
    stage: string;
    label: string;
    status: 'approved' | 'pending' | 'revised' | 'rejected' | 'current' | 'future';
    approval: Approval | null;
    order: number;
}

// ---------------------------------------------------------------------------
// Email (Surat Internal)
// ---------------------------------------------------------------------------

export interface EmailRecipient {
    id: number;
    email_id: number;
    user_id: number | null;
    role: string | null;
    is_read: boolean;
    read_at: string | null;
    display_name: string;
    created_at: string;
    updated_at: string;

    // Relations
    user?: User;
}

export interface Email {
    id: number;
    user_id: number;
    name_surat: string;
    no_surat: string | null;
    isi_surat: string;
    tgl_surat: string;
    status: EmailStatus;
    ditujukan: string | null;
    status_arsip: string | null;
    status_revisi: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    user?: User;
    recipients?: EmailRecipient[];
    replies?: EmailReply[];
    attachments?: Attachment[];
}

// ---------------------------------------------------------------------------
// EmailReply
// ---------------------------------------------------------------------------

export interface EmailReply {
    id: number;
    email_id: number;
    user_id: number;
    isi: string;
    created_at: string;
    updated_at: string;

    // Relations
    email?: Email;
    user?: User;
    attachments?: Attachment[];
}

// ---------------------------------------------------------------------------
// Attachment
// ---------------------------------------------------------------------------

export interface Attachment {
    id: number;
    attachable_type: string;
    attachable_id: number;
    nama: string;
    path: string;
    mime_type: string;
    size: number;
    uploaded_by?: number;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// Apbs (Anggaran Pendapatan & Belanja Sekolah)
// ---------------------------------------------------------------------------

export interface Apbs {
    id: number;
    unit_id: number;
    rapbs_id: number | null;
    tahun: string;
    total_anggaran: number;
    total_realisasi: number;
    sisa_anggaran: number;
    nomor_dokumen: string | null;
    tanggal_pengesahan: string | null;
    status: 'active' | 'closed';
    keterangan: string | null;
    ttd_kepala_sekolah: string | null;
    ttd_bendahara: string | null;
    ttd_ketua_umum: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    unit?: Unit;
    rapbs?: Rapbs;
    items?: ApbsItem[];
}

// ---------------------------------------------------------------------------
// ApbsItem
// ---------------------------------------------------------------------------

export interface ApbsItem {
    id: number;
    apbs_id: number;
    rapbs_item_id: number | null;
    mata_anggaran_id: number;
    detail_mata_anggaran_id: number | null;
    kode_coa: string;
    nama: string;
    anggaran: number;
    realisasi: number;
    sisa: number;
    created_at: string;
    updated_at: string;

    // Relations
    apbs?: Apbs;
    rapbs_item?: RapbsItem;
    mata_anggaran?: MataAnggaran;
    detail_mata_anggaran?: DetailMataAnggaran;
}

// ---------------------------------------------------------------------------
// Rapbs (Rencana Anggaran Pendapatan & Belanja Sekolah)
// ---------------------------------------------------------------------------

export interface Rapbs {
    id: number;
    unit_id: number;
    tahun: string;
    total_anggaran: number;
    status: RapbsStatus | string;
    status_label: string | null;
    status_color: string | null;
    current_approval_stage: RapbsApprovalStage | string | null;
    current_approval_stage_label: string | null;
    submitted_by: number | null;
    submitted_at: string | null;
    approved_by: number | null;
    approved_at: string | null;
    keterangan: string | null;
    created_at: string;
    updated_at: string;

    // Computed
    items_count?: number;
    can_edit?: boolean;
    can_submit?: boolean;
    can_approve_action?: boolean;
    total_plafon?: number;
    is_over_budget?: boolean;
    expected_flow?: RapbsExpectedStage[];

    // Relations
    unit?: Unit;
    items?: RapbsItem[];
    approvals?: RapbsApproval[];
    current_approval?: RapbsApproval;
    submitter?: User;
    approver?: User;
    apbs?: Apbs;
}

// ---------------------------------------------------------------------------
// RapbsItem
// ---------------------------------------------------------------------------

export interface RapbsItem {
    id: number;
    rapbs_id: number;
    pkt_id: number | null;
    mata_anggaran_id: number;
    sub_mata_anggaran_id: number | null;
    detail_mata_anggaran_id: number | null;
    kode_coa: string;
    nama: string;
    uraian: string | null;
    volume: number;
    satuan: string | null;
    harga_satuan: number;
    jumlah: number;
    created_at: string;
    updated_at: string;

    // Relations
    rapbs?: Rapbs;
    pkt?: Pkt;
    mata_anggaran?: MataAnggaran;
    sub_mata_anggaran?: SubMataAnggaran;
    detail_mata_anggaran?: DetailMataAnggaran;
}

// ---------------------------------------------------------------------------
// RapbsApproval
// ---------------------------------------------------------------------------

export interface RapbsApproval {
    id: number;
    rapbs_id: number;
    user_id: number;
    stage: RapbsApprovalStage | string;
    stage_label: string | null;
    stage_order: number;
    status: 'pending' | 'approved' | 'revised' | 'rejected';
    notes: string | null;
    acted_at: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    rapbs?: Rapbs;
    user?: User;
}

// ---------------------------------------------------------------------------
// RapbsExpectedStage
// ---------------------------------------------------------------------------

export interface RapbsExpectedStage {
    value: string;
    label: string;
}

// ---------------------------------------------------------------------------
// Penerimaan (Revenue / Income)
// ---------------------------------------------------------------------------

export interface Penerimaan {
    id: number;
    unit_id: number;
    mata_anggaran_id: number | null;
    tahun: string;
    bulan: number;
    jumlah: number;
    keterangan: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    unit?: Unit;
    mata_anggaran?: MataAnggaran;
}

// ---------------------------------------------------------------------------
// RealisasiAnggaran (Budget Realization)
// ---------------------------------------------------------------------------

export interface RealisasiAnggaran {
    id: number;
    unit_id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id: number | null;
    detail_mata_anggaran_id: number | null;
    pengajuan_anggaran_id: number | null;
    tahun: string;
    bulan: number;
    jumlah: number;
    keterangan: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    unit?: Unit;
    mata_anggaran?: MataAnggaran;
    sub_mata_anggaran?: SubMataAnggaran;
    detail_mata_anggaran?: DetailMataAnggaran;
    pengajuan_anggaran?: PengajuanAnggaran;
}

// ---------------------------------------------------------------------------
// LampiranMataAnggaran (Budget Account Attachment / Supporting Document)
// ---------------------------------------------------------------------------

export interface LampiranMataAnggaran {
    id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id: number | null;
    detail_mata_anggaran_id: number | null;
    nama: string;
    path: string;
    mime_type: string;
    size: number;
    created_at: string;
    updated_at: string;

    // Relations
    mata_anggaran?: MataAnggaran;
    sub_mata_anggaran?: SubMataAnggaran;
    detail_mata_anggaran?: DetailMataAnggaran;
}

// ---------------------------------------------------------------------------
// PerubahanAnggaran (Budget Transfer / Amendment)
// ---------------------------------------------------------------------------

export interface PerubahanAnggaran {
    id: number;
    nomor_perubahan: string;
    user_id: number;
    unit_id: number | null;
    tahun: string;
    perihal: string;
    alasan: string;
    submitter_type: 'unit' | 'substansi' | null;
    status: PerubahanAnggaranStatus | string;
    status_label: string | null;
    status_color: string | null;
    current_approval_stage: ApprovalStage | string | null;
    current_approval_stage_label: string | null;
    total_amount: number;
    processed_at: string | null;
    processed_by: number | null;
    created_at: string;
    updated_at: string;

    // Relations
    user?: User;
    creator?: User;
    unit?: Unit;
    processor?: User;
    items?: PerubahanAnggaranItem[];
    logs?: PerubahanAnggaranLog[];
    approvals?: Approval[];
    attachments?: Attachment[];
    expected_stages?: ExpectedStage[];
}

// ---------------------------------------------------------------------------
// PerubahanAnggaranItem (Budget Transfer Item)
// ---------------------------------------------------------------------------

export interface PerubahanAnggaranItem {
    id: number;
    perubahan_anggaran_id: number;
    source_detail_mata_anggaran_id: number;
    target_detail_mata_anggaran_id: number;
    amount: number;
    keterangan: string | null;
    transfer_summary: string | null;
    has_enough_balance: boolean | null;
    created_at: string;
    updated_at: string;

    // Relations
    perubahan_anggaran?: PerubahanAnggaran;
    source_detail_mata_anggaran?: DetailMataAnggaran;
    target_detail_mata_anggaran?: DetailMataAnggaran;
}

// ---------------------------------------------------------------------------
// PerubahanAnggaranLog (Budget Transfer Execution Log)
// ---------------------------------------------------------------------------

export interface PerubahanAnggaranLog {
    id: number;
    perubahan_anggaran_id: number;
    perubahan_anggaran_item_id: number | null;
    source_detail_mata_anggaran_id: number | null;
    target_detail_mata_anggaran_id: number | null;
    source_saldo_before: number | null;
    source_saldo_after: number | null;
    target_saldo_before: number | null;
    target_saldo_after: number | null;
    amount: number;
    executed_by: number | null;
    executed_at: string | null;
    log_entry: string | null;
    source_balance_change: string;
    target_balance_change: string;
    created_at: string;
    updated_at: string;

    // Relations
    perubahan_anggaran?: PerubahanAnggaran;
    perubahan_anggaran_item?: PerubahanAnggaranItem;
    source_detail_mata_anggaran?: DetailMataAnggaran;
    target_detail_mata_anggaran?: DetailMataAnggaran;
    executor?: User;
}

// ---------------------------------------------------------------------------
// RevisionComment (Diskusi Revisi)
// ---------------------------------------------------------------------------

export interface RevisionComment {
    id: number;
    commentable_type: string;
    commentable_id: number;
    user_id: number;
    message: string;
    revision_round: number;
    is_initial_note: boolean;
    created_at: string;
    updated_at: string;

    // Relations
    user?: User;
}

export interface RevisionThreadData {
    comments: RevisionComment[];
    current_round: number;
    is_read_only: boolean;
    is_in_revision: boolean;
    can_comment: boolean;
}

export interface RevisionThreadAllRoundsData {
    rounds: Record<number, RevisionComment[]>;
    current_round: number;
    is_read_only: boolean;
    is_in_revision: boolean;
    can_comment: boolean;
}
