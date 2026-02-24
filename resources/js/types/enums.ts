// =============================================================================
// Enums – mirrors PHP backend enums in App\Enums
// =============================================================================

// ---------------------------------------------------------------------------
// UserRole
// ---------------------------------------------------------------------------

export enum UserRole {
    Admin = 'admin',
    Direktur = 'direktur',
    Ketua = 'ketua',
    Ketua1 = 'ketua-1',
    Ketum = 'ketum',
    Sekretariat = 'sekretariat',
    Sekretaris = 'sekretaris',
    Bendahara = 'bendahara',
    Keuangan = 'keuangan',
    Akuntansi = 'akuntansi',
    Kasir = 'kasir',
    Payment = 'payment',
    SDM = 'sdm',
    Umum = 'umum',
    KabagSdmUmum = 'kabag-sdm-umum',
    StaffDirektur = 'staff-direktur',
    StaffSekretariat = 'staff-sekretariat',
    StaffKeuangan = 'staff-keuangan',
    PG = 'pg',
    RA = 'ra',
    TK = 'tk',
    SD = 'sd',
    SMP12 = 'smp12',
    SMP55 = 'smp55',
    SMA33 = 'sma33',
    Stebank = 'stebank',
    Unit = 'unit',
    Asrama = 'asrama',
    Litbang = 'litbang',
    Laz = 'laz',
    Pembangunan = 'pembangunan',
}

// ---------------------------------------------------------------------------
// ApprovalStage
// ---------------------------------------------------------------------------

export enum ApprovalStage {
    StaffDirektur = 'staff-direktur',
    StaffKeuangan = 'staff-keuangan',
    Direktur = 'direktur',
    KabagSdmUmum = 'kabag-sdm-umum',
    KabagSekretariat = 'kabag-sekretariat',
    WakilKetua = 'wakil-ketua',
    Sekretaris = 'sekretaris',
    Ketum = 'ketum',
    Keuangan = 'keuangan',
    Bendahara = 'bendahara',
    Kasir = 'kasir',
    Payment = 'payment',
}

// ---------------------------------------------------------------------------
// ApprovalStatus
// ---------------------------------------------------------------------------

export enum ApprovalStatus {
    Pending = 'pending',
    Approved = 'approved',
    Revised = 'revised',
    Rejected = 'rejected',
}

// ---------------------------------------------------------------------------
// ProposalStatus
// ---------------------------------------------------------------------------

export enum ProposalStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    RevisionRequired = 'revision-required',
    Revised = 'revised',
    Rejected = 'rejected',
    ApprovedLevel1 = 'approved-level-1',
    ApprovedLevel2 = 'approved-level-2',
    ApprovedLevel3 = 'approved-level-3',
    FinalApproved = 'final-approved',
    Done = 'done',
    Paid = 'paid',
}

// ---------------------------------------------------------------------------
// AmountCategory
// ---------------------------------------------------------------------------

export enum AmountCategory {
    Low = 'low',
    High = 'high',
}

// ---------------------------------------------------------------------------
// ReferenceType
// ---------------------------------------------------------------------------

export enum ReferenceType {
    Education = 'education',
    HrGeneral = 'hr_general',
    Secretariat = 'secretariat',
}

// ---------------------------------------------------------------------------
// LpjApprovalStage
// ---------------------------------------------------------------------------

export enum LpjApprovalStage {
    StaffKeuangan = 'staff-keuangan',
    Direktur = 'direktur',
    KabagSdmUmum = 'kabag-sdm-umum',
    KabagSekretariat = 'kabag-sekretariat',
    Keuangan = 'keuangan',
}

// ---------------------------------------------------------------------------
// LpjStatus
// ---------------------------------------------------------------------------

export enum LpjStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    Validated = 'validated',
    ApprovedByMiddle = 'approved-middle',
    Approved = 'approved',
    Revised = 'revised',
    Rejected = 'rejected',
}

// ---------------------------------------------------------------------------
// EmailStatus
// ---------------------------------------------------------------------------

export enum EmailStatus {
    Draft = 'draft',
    Sent = 'sent',
    InProcess = 'in-process',
    Approved = 'approved',
    Archived = 'archived',
}

// ---------------------------------------------------------------------------
// PerubahanAnggaranStatus
// ---------------------------------------------------------------------------

export enum PerubahanAnggaranStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    RevisionRequired = 'revision-required',
    Rejected = 'rejected',
    ApprovedLevel1 = 'approved-level-1',
    ApprovedLevel2 = 'approved-level-2',
    ApprovedLevel3 = 'approved-level-3',
    ApprovedLevel4 = 'approved-level-4',
    Processed = 'processed',
}

// ---------------------------------------------------------------------------
// RapbsStatus
// ---------------------------------------------------------------------------

export enum RapbsStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    Verified = 'verified',
    InReview = 'in_review',
    Approved = 'approved',
    ApbsGenerated = 'apbs_generated',
    Active = 'active',
    Rejected = 'rejected',
}

// ---------------------------------------------------------------------------
// RapbsApprovalStage
// ---------------------------------------------------------------------------

export enum RapbsApprovalStage {
    Direktur = 'direktur',
    Sekretariat = 'sekretariat',
    Keuangan = 'keuangan',
    Sekretaris = 'sekretaris',
    WakilKetua = 'wakil_ketua',
    Ketum = 'ketum',
    Bendahara = 'bendahara',
}

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Return an Indonesian display label for a given UserRole.
 */
export function getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
        [UserRole.Admin]: 'Administrator',
        [UserRole.Direktur]: 'Direktur',
        [UserRole.Ketua]: 'Ketua',
        [UserRole.Ketua1]: 'Wakil Ketua',
        [UserRole.Ketum]: 'Ketua Umum',
        [UserRole.Sekretariat]: 'Sekretariat',
        [UserRole.Sekretaris]: 'Sekretaris',
        [UserRole.Bendahara]: 'Bendahara',
        [UserRole.Keuangan]: 'Keuangan',
        [UserRole.Akuntansi]: 'Akuntansi',
        [UserRole.Kasir]: 'Kasir',
        [UserRole.Payment]: 'Payment',
        [UserRole.SDM]: 'SDM',
        [UserRole.Umum]: 'Umum',
        [UserRole.KabagSdmUmum]: 'Kabag SDM & Umum',
        [UserRole.StaffDirektur]: 'Staff Direktur',
        [UserRole.StaffSekretariat]: 'Staff Sekretariat',
        [UserRole.StaffKeuangan]: 'Staff Keuangan',
        [UserRole.PG]: 'PG',
        [UserRole.RA]: 'RA',
        [UserRole.TK]: 'TK',
        [UserRole.SD]: 'SD',
        [UserRole.SMP12]: 'SMP 12',
        [UserRole.SMP55]: 'SMP 55',
        [UserRole.SMA33]: 'SMA 33',
        [UserRole.Stebank]: 'STEBANK',
        [UserRole.Unit]: 'Unit',
        [UserRole.Asrama]: 'Asrama',
        [UserRole.Litbang]: 'Litbang',
        [UserRole.Laz]: 'LAZ',
        [UserRole.Pembangunan]: 'Pembangunan',
    };

    return labels[role] ?? role;
}

/**
 * Return an Indonesian display label for a given ApprovalStage.
 */
export function getStageLabel(stage: ApprovalStage | string): string {
    const labels: Record<string, string> = {
        [ApprovalStage.StaffDirektur]: 'Staf Direktur',
        [ApprovalStage.StaffKeuangan]: 'Staf Keuangan',
        [ApprovalStage.Direktur]: 'Direktur Pendidikan',
        [ApprovalStage.KabagSdmUmum]: 'Kabag SDM & Umum',
        [ApprovalStage.KabagSekretariat]: 'Kabag Sekretariat',
        [ApprovalStage.WakilKetua]: 'Wakil Ketua',
        [ApprovalStage.Sekretaris]: 'Sekretaris',
        [ApprovalStage.Ketum]: 'Ketua Umum',
        [ApprovalStage.Keuangan]: 'Keuangan',
        [ApprovalStage.Bendahara]: 'Bendahara',
        [ApprovalStage.Kasir]: 'Kasir',
        [ApprovalStage.Payment]: 'Pembayaran',
    };

    return labels[stage] ?? stage;
}

/**
 * Return Tailwind CSS colour classes for a given proposal or approval status.
 */
export function getStatusColor(status: ProposalStatus | ApprovalStatus | LpjStatus | string): string {
    const colors: Record<string, string> = {
        // ProposalStatus
        [ProposalStatus.Draft]: 'bg-gray-100 text-gray-700',
        [ProposalStatus.Submitted]: 'bg-blue-100 text-blue-700',
        [ProposalStatus.RevisionRequired]: 'bg-amber-100 text-amber-700',
        [ProposalStatus.Revised]: 'bg-cyan-100 text-cyan-700',
        [ProposalStatus.Rejected]: 'bg-red-100 text-red-700',
        [ProposalStatus.ApprovedLevel1]: 'bg-sky-100 text-sky-700',
        [ProposalStatus.ApprovedLevel2]: 'bg-indigo-100 text-indigo-700',
        [ProposalStatus.ApprovedLevel3]: 'bg-violet-100 text-violet-700',
        [ProposalStatus.FinalApproved]: 'bg-green-100 text-green-700',
        [ProposalStatus.Done]: 'bg-emerald-100 text-emerald-700',
        [ProposalStatus.Paid]: 'bg-emerald-100 text-emerald-700',

        // ApprovalStatus
        [ApprovalStatus.Pending]: 'bg-yellow-100 text-yellow-700',
        [ApprovalStatus.Approved]: 'bg-green-100 text-green-700',
        [ApprovalStatus.Revised]: 'bg-cyan-100 text-cyan-700',
        [ApprovalStatus.Rejected]: 'bg-red-100 text-red-700',

        // LpjStatus
        [LpjStatus.Validated]: 'bg-sky-100 text-sky-700',
        [LpjStatus.ApprovedByMiddle]: 'bg-indigo-100 text-indigo-700',
    };

    return colors[status] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Return an Indonesian display label for a given status value.
 */
export function getStatusLabel(status: ProposalStatus | ApprovalStatus | LpjStatus | EmailStatus | string): string {
    const labels: Record<string, string> = {
        // ProposalStatus
        [ProposalStatus.Draft]: 'Draf',
        [ProposalStatus.Submitted]: 'Diajukan',
        [ProposalStatus.RevisionRequired]: 'Perlu Revisi',
        [ProposalStatus.Revised]: 'Sudah Direvisi',
        [ProposalStatus.Rejected]: 'Ditolak',
        [ProposalStatus.ApprovedLevel1]: 'Disetujui Level 1',
        [ProposalStatus.ApprovedLevel2]: 'Disetujui Level 2',
        [ProposalStatus.ApprovedLevel3]: 'Disetujui Level 3',
        [ProposalStatus.FinalApproved]: 'Disetujui Final',
        [ProposalStatus.Done]: 'Selesai',
        [ProposalStatus.Paid]: 'Dibayar',

        // ApprovalStatus
        [ApprovalStatus.Pending]: 'Menunggu',
        [ApprovalStatus.Approved]: 'Disetujui',
        [ApprovalStatus.Revised]: 'Direvisi',
        [ApprovalStatus.Rejected]: 'Ditolak',

        // LpjStatus
        [LpjStatus.Draft]: 'Draf',
        [LpjStatus.Submitted]: 'Diajukan',
        [LpjStatus.Validated]: 'Divalidasi',
        [LpjStatus.ApprovedByMiddle]: 'Disetujui Bidang',
        [LpjStatus.Approved]: 'Disetujui',
        [LpjStatus.Revised]: 'Perlu Revisi',
        [LpjStatus.Rejected]: 'Ditolak',

        // EmailStatus
        [EmailStatus.Sent]: 'Terkirim',
        [EmailStatus.InProcess]: 'Dalam Proses',
        [EmailStatus.Archived]: 'Diarsipkan',
    };

    return labels[status] ?? status;
}

/**
 * Return an Indonesian display label for a given LpjApprovalStage.
 */
export function getLpjStageLabel(stage: LpjApprovalStage | string): string {
    const labels: Record<string, string> = {
        [LpjApprovalStage.StaffKeuangan]: 'Staf Keuangan',
        [LpjApprovalStage.Direktur]: 'Direktur Pendidikan',
        [LpjApprovalStage.KabagSdmUmum]: 'Kabag SDM & Umum',
        [LpjApprovalStage.KabagSekretariat]: 'Kabag Sekretariat',
        [LpjApprovalStage.Keuangan]: 'Keuangan',
    };

    return labels[stage] ?? stage;
}

/**
 * Get the LPJ approval stage(s) that a user role can approve.
 */
export function getLpjApprovalStagesForRole(role: UserRole): LpjApprovalStage[] | null {
    const mapping: Partial<Record<UserRole, LpjApprovalStage[]>> = {
        [UserRole.StaffKeuangan]: [LpjApprovalStage.StaffKeuangan],
        [UserRole.Direktur]: [LpjApprovalStage.Direktur],
        [UserRole.KabagSdmUmum]: [LpjApprovalStage.KabagSdmUmum],
        [UserRole.Sekretariat]: [LpjApprovalStage.KabagSekretariat],
        [UserRole.Keuangan]: [LpjApprovalStage.Keuangan],
        // Admin can see all stages
        [UserRole.Admin]: Object.values(LpjApprovalStage),
    };

    return mapping[role] ?? null;
}

/**
 * Check whether a role belongs to a school / educational unit.
 */
export function isUnitRole(role: UserRole): boolean {
    return [
        UserRole.PG,
        UserRole.RA,
        UserRole.TK,
        UserRole.SD,
        UserRole.SMP12,
        UserRole.SMP55,
        UserRole.SMA33,
    ].includes(role);
}

/**
 * Check whether a role belongs to a substansi (non-unit submitter).
 */
export function isSubstansiRole(role: UserRole): boolean {
    return [
        UserRole.Asrama,
        UserRole.Laz,
        UserRole.Litbang,
        UserRole.Stebank,
        UserRole.StaffDirektur,
        UserRole.StaffSekretariat,
        UserRole.SDM,
        UserRole.Umum,
    ].includes(role);
}

/**
 * Check whether a role is an approver in the approval workflow.
 */
export function isApproverRole(role: UserRole): boolean {
    return [
        UserRole.Direktur,
        UserRole.Ketua,
        UserRole.Ketua1,
        UserRole.Ketum,
        UserRole.Sekretariat,
        UserRole.Sekretaris,
        UserRole.Bendahara,
        UserRole.Keuangan,
        UserRole.Kasir,
        UserRole.Payment,
        UserRole.StaffKeuangan,
        UserRole.KabagSdmUmum,
        UserRole.StaffDirektur,
    ].includes(role);
}

/**
 * Get the label for a ReferenceType.
 */
export function getReferenceTypeLabel(ref: ReferenceType | string): string {
    const labels: Record<string, string> = {
        [ReferenceType.Education]: 'Bidang Pendidikan',
        [ReferenceType.HrGeneral]: 'Bidang SDM & Umum',
        [ReferenceType.Secretariat]: 'Bidang Internal Sekretariat',
    };
    return labels[ref] ?? ref;
}

/**
 * Get the label for an AmountCategory.
 */
export function getAmountCategoryLabel(cat: AmountCategory | string): string {
    const labels: Record<string, string> = {
        [AmountCategory.Low]: 'Rendah (< 10 Juta)',
        [AmountCategory.High]: 'Tinggi (>= 10 Juta)',
    };
    return labels[cat] ?? cat;
}

/**
 * Determine the dashboard type for a given role.
 */
export function getDashboardType(role: UserRole): 'admin' | 'unit' | 'finance' | 'leadership' | 'approver' | 'kasir' | 'payment' {
    if (role === UserRole.Admin) return 'admin';
    if (isUnitRole(role)) return 'unit';

    // Kasir has its own dashboard
    if (role === UserRole.Kasir) return 'kasir';

    // Payment has its own dashboard
    if (role === UserRole.Payment) return 'payment';

    const financeRoles: UserRole[] = [
        UserRole.Keuangan,
        UserRole.StaffKeuangan,
        UserRole.Bendahara,
        UserRole.Akuntansi,
    ];
    if (financeRoles.includes(role)) return 'finance';

    const leadershipRoles: UserRole[] = [
        UserRole.Direktur,
        UserRole.Ketua,
        UserRole.Ketua1,
        UserRole.Ketum,
    ];
    if (leadershipRoles.includes(role)) return 'leadership';

    return 'approver';
}

/**
 * Get the approval stage(s) that a user role can approve.
 * Returns null if the role cannot approve any stage.
 */
export function getApprovalStagesForRole(role: UserRole): ApprovalStage[] | null {
    const mapping: Partial<Record<UserRole, ApprovalStage[]>> = {
        [UserRole.StaffDirektur]: [ApprovalStage.StaffDirektur],
        [UserRole.StaffKeuangan]: [ApprovalStage.StaffKeuangan],
        [UserRole.Direktur]: [ApprovalStage.Direktur],
        [UserRole.KabagSdmUmum]: [ApprovalStage.KabagSdmUmum],
        [UserRole.Sekretariat]: [ApprovalStage.KabagSekretariat],
        [UserRole.Ketua1]: [ApprovalStage.WakilKetua],
        [UserRole.Sekretaris]: [ApprovalStage.Sekretaris],
        [UserRole.Ketum]: [ApprovalStage.Ketum],
        [UserRole.Keuangan]: [ApprovalStage.Keuangan],
        [UserRole.Bendahara]: [ApprovalStage.Bendahara],
        [UserRole.Kasir]: [ApprovalStage.Kasir],
        [UserRole.Payment]: [ApprovalStage.Payment],
        // Admin can see all stages
        [UserRole.Admin]: Object.values(ApprovalStage),
    };

    return mapping[role] ?? null;
}

/**
 * Get the label for a PerubahanAnggaranStatus.
 */
export function getPerubahanAnggaranStatusLabel(status: PerubahanAnggaranStatus | string): string {
    const labels: Record<string, string> = {
        [PerubahanAnggaranStatus.Draft]: 'Draf',
        [PerubahanAnggaranStatus.Submitted]: 'Diajukan',
        [PerubahanAnggaranStatus.RevisionRequired]: 'Perlu Revisi',
        [PerubahanAnggaranStatus.Rejected]: 'Ditolak',
        [PerubahanAnggaranStatus.ApprovedLevel1]: 'Disetujui Direktur/Kabag',
        [PerubahanAnggaranStatus.ApprovedLevel2]: 'Disetujui Wakil Ketua/Sekretaris',
        [PerubahanAnggaranStatus.ApprovedLevel3]: 'Disetujui Ketua Umum',
        [PerubahanAnggaranStatus.ApprovedLevel4]: 'Disetujui Keuangan',
        [PerubahanAnggaranStatus.Processed]: 'Diproses',
    };
    return labels[status] ?? status;
}

/**
 * Get Tailwind CSS colour classes for a PerubahanAnggaranStatus.
 */
export function getPerubahanAnggaranStatusColor(status: PerubahanAnggaranStatus | string): string {
    const colors: Record<string, string> = {
        [PerubahanAnggaranStatus.Draft]: 'bg-gray-100 text-gray-700',
        [PerubahanAnggaranStatus.Submitted]: 'bg-blue-100 text-blue-700',
        [PerubahanAnggaranStatus.RevisionRequired]: 'bg-amber-100 text-amber-700',
        [PerubahanAnggaranStatus.Rejected]: 'bg-red-100 text-red-700',
        [PerubahanAnggaranStatus.ApprovedLevel1]: 'bg-sky-100 text-sky-700',
        [PerubahanAnggaranStatus.ApprovedLevel2]: 'bg-indigo-100 text-indigo-700',
        [PerubahanAnggaranStatus.ApprovedLevel3]: 'bg-violet-100 text-violet-700',
        [PerubahanAnggaranStatus.ApprovedLevel4]: 'bg-purple-100 text-purple-700',
        [PerubahanAnggaranStatus.Processed]: 'bg-green-100 text-green-700',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Get the expected approval stages for Perubahan Anggaran based on submitter type.
 */
export function getPerubahanAnggaranStages(submitterType: 'unit' | 'substansi'): ApprovalStage[] {
    if (submitterType === 'unit') {
        return [
            ApprovalStage.Direktur,
            ApprovalStage.WakilKetua,
            ApprovalStage.Ketum,
            ApprovalStage.Keuangan,
            ApprovalStage.Bendahara,
        ];
    }
    return [
        ApprovalStage.KabagSekretariat,
        ApprovalStage.Sekretaris,
        ApprovalStage.Ketum,
        ApprovalStage.Keuangan,
        ApprovalStage.Bendahara,
    ];
}

// ---------------------------------------------------------------------------
// RAPBS Helper Functions
// ---------------------------------------------------------------------------

/**
 * Get the label for a RapbsStatus.
 */
export function getRapbsStatusLabel(status: RapbsStatus | string): string {
    const labels: Record<string, string> = {
        [RapbsStatus.Draft]: 'Draf',
        [RapbsStatus.Submitted]: 'Diajukan',
        [RapbsStatus.Verified]: 'Terverifikasi',
        [RapbsStatus.InReview]: 'Dalam Review',
        [RapbsStatus.Approved]: 'Disetujui',
        [RapbsStatus.ApbsGenerated]: 'APBS Tergenerate',
        [RapbsStatus.Active]: 'Anggaran Aktif',
        [RapbsStatus.Rejected]: 'Ditolak',
    };
    return labels[status] ?? status;
}

/**
 * Get Tailwind CSS colour classes for a RapbsStatus.
 */
export function getRapbsStatusColor(status: RapbsStatus | string): string {
    const colors: Record<string, string> = {
        [RapbsStatus.Draft]: 'bg-gray-100 text-gray-700',
        [RapbsStatus.Submitted]: 'bg-blue-100 text-blue-700',
        [RapbsStatus.Verified]: 'bg-cyan-100 text-cyan-700',
        [RapbsStatus.InReview]: 'bg-yellow-100 text-yellow-700',
        [RapbsStatus.Approved]: 'bg-green-100 text-green-700',
        [RapbsStatus.ApbsGenerated]: 'bg-emerald-100 text-emerald-700',
        [RapbsStatus.Active]: 'bg-teal-100 text-teal-700',
        [RapbsStatus.Rejected]: 'bg-red-100 text-red-700',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-700';
}

/**
 * Get the label for a RapbsApprovalStage.
 */
export function getRapbsStageLabel(stage: RapbsApprovalStage | string): string {
    const labels: Record<string, string> = {
        [RapbsApprovalStage.Direktur]: 'Direktur Pendidikan',
        [RapbsApprovalStage.Sekretariat]: 'Sekretariat',
        [RapbsApprovalStage.Keuangan]: 'Keuangan',
        [RapbsApprovalStage.Sekretaris]: 'Sekretaris',
        [RapbsApprovalStage.WakilKetua]: 'Wakil Ketua',
        [RapbsApprovalStage.Ketum]: 'Ketua Umum',
        [RapbsApprovalStage.Bendahara]: 'Bendahara',
    };
    return labels[stage] ?? stage;
}

// Alias for backwards compatibility
export const getRapbsApprovalStageLabel = getRapbsStageLabel;

/**
 * Get the expected RAPBS approval stages based on submitter type.
 */
export function getRapbsApprovalStages(submitterType: 'unit' | 'substansi'): RapbsApprovalStage[] {
    if (submitterType === 'unit') {
        return [
            RapbsApprovalStage.Direktur,
            RapbsApprovalStage.Keuangan,
            RapbsApprovalStage.Sekretaris,
            RapbsApprovalStage.WakilKetua,
            RapbsApprovalStage.Ketum,
            RapbsApprovalStage.Bendahara,
        ];
    }
    return [
        RapbsApprovalStage.Sekretariat,
        RapbsApprovalStage.Keuangan,
        RapbsApprovalStage.Sekretaris,
        RapbsApprovalStage.WakilKetua,
        RapbsApprovalStage.Ketum,
        RapbsApprovalStage.Bendahara,
    ];
}

/**
 * Get the RAPBS approval stage(s) that a user role can approve.
 */
export function getRapbsApprovalStagesForRole(role: UserRole): RapbsApprovalStage[] | null {
    const mapping: Partial<Record<UserRole, RapbsApprovalStage[]>> = {
        [UserRole.Direktur]: [RapbsApprovalStage.Direktur],
        [UserRole.Sekretariat]: [RapbsApprovalStage.Sekretariat],
        [UserRole.Keuangan]: [RapbsApprovalStage.Keuangan],
        [UserRole.Sekretaris]: [RapbsApprovalStage.Sekretaris],
        [UserRole.Ketua1]: [RapbsApprovalStage.WakilKetua],
        [UserRole.Ketum]: [RapbsApprovalStage.Ketum],
        [UserRole.Bendahara]: [RapbsApprovalStage.Bendahara],
        // Admin can see all stages
        [UserRole.Admin]: Object.values(RapbsApprovalStage),
    };

    return mapping[role] ?? null;
}
