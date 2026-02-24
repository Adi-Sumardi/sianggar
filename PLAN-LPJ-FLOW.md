# Implementasi Flow LPJ (Laporan Pertanggungjawaban)

## Ringkasan Flow

```
Unit/Substansi → Staf Keuangan (checklist + rujukan) → Middle Approver → Keuangan → Selesai
```

**Perbedaan dengan Pengajuan:**
- Tidak ada routing berdasarkan nilai (LOW/HIGH)
- Tidak ada tahap Ketum/Wakil Ketua/Sekretaris
- Tidak ada tahap Bendahara/Kasir/Payment
- Ada checklist validasi di Staf Keuangan

---

## PHASE 1: Database Migrations

### 1.1 Migration: Update `lpjs` table
File: `database/migrations/2026_02_06_000001_update_lpjs_add_routing_fields.php`

Tambah kolom:
```php
$table->string('reference_type')->nullable(); // education, hr_general, secretariat
$table->string('current_approval_stage')->nullable()->change(); // ensure exists
$table->timestamp('validated_at')->nullable();
$table->foreignId('validated_by')->nullable()->constrained('users');
$table->text('validation_notes')->nullable();
```

### 1.2 Migration: Create `lpj_validations` table
File: `database/migrations/2026_02_06_000002_create_lpj_validations_table.php`

```php
Schema::create('lpj_validations', function (Blueprint $table) {
    $table->id();
    $table->foreignId('lpj_id')->constrained('lpjs')->onDelete('cascade');
    $table->foreignId('validated_by')->constrained('users');

    // Checklist items (5 required items)
    $table->boolean('has_activity_identity')->default(false);      // Identitas kegiatan
    $table->boolean('has_cover_letter')->default(false);           // Surat pengantar LPJ
    $table->boolean('has_narrative_report')->default(false);       // Laporan naratif capaian
    $table->boolean('has_financial_report')->default(false);       // Laporan keuangan
    $table->boolean('has_receipts')->default(false);               // Kuitansi/bukti pengeluaran

    // Routing
    $table->string('reference_type'); // education, hr_general, secretariat

    $table->text('notes')->nullable();
    $table->timestamps();
});
```

---

## PHASE 2: Backend Enums

### 2.1 New `LpjApprovalStage` enum
File: `app/Enums/LpjApprovalStage.php`

```php
enum LpjApprovalStage: string
{
    case StaffKeuangan = 'staff-keuangan';
    case Direktur = 'direktur';
    case KabagSdmUmum = 'kabag-sdm-umum';
    case KabagSekretariat = 'kabag-sekretariat';
    case Keuangan = 'keuangan';

    public function requiredRole(): UserRole
    {
        return match($this) {
            self::StaffKeuangan => UserRole::StaffKeuangan,
            self::Direktur => UserRole::Direktur,
            self::KabagSdmUmum => UserRole::KabagSdmUmum,
            self::KabagSekretariat => UserRole::Sekretariat,
            self::Keuangan => UserRole::Keuangan,
        };
    }

    public function label(): string
    {
        return match($this) {
            self::StaffKeuangan => 'Staf Keuangan',
            self::Direktur => 'Direktur Pendidikan',
            self::KabagSdmUmum => 'Kabag SDM & Umum',
            self::KabagSekretariat => 'Kabag Sekretariat',
            self::Keuangan => 'Keuangan',
        };
    }
}
```

### 2.2 Update `LpjStatus` enum
File: `app/Enums/LpjStatus.php`

```php
enum LpjStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';           // Submitted to Staf Keuangan
    case Validated = 'validated';           // Staf Keuangan approved, waiting middle
    case ApprovedByMiddle = 'approved-middle'; // Middle approver approved
    case Approved = 'approved';             // Keuangan approved - FINAL
    case Revised = 'revised';               // Revision requested
    case Rejected = 'rejected';             // Rejected - stopped
}
```

---

## PHASE 3: Backend Models

### 3.1 New `LpjValidation` model
File: `app/Models/LpjValidation.php`

```php
class LpjValidation extends Model
{
    protected $fillable = [
        'lpj_id',
        'validated_by',
        'has_activity_identity',
        'has_cover_letter',
        'has_narrative_report',
        'has_financial_report',
        'has_receipts',
        'reference_type',
        'notes',
    ];

    protected $casts = [
        'has_activity_identity' => 'boolean',
        'has_cover_letter' => 'boolean',
        'has_narrative_report' => 'boolean',
        'has_financial_report' => 'boolean',
        'has_receipts' => 'boolean',
        'reference_type' => ReferenceType::class,
    ];

    public function lpj(): BelongsTo
    {
        return $this->belongsTo(Lpj::class);
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function isComplete(): bool
    {
        return $this->has_activity_identity
            && $this->has_cover_letter
            && $this->has_narrative_report
            && $this->has_financial_report
            && $this->has_receipts;
    }
}
```

### 3.2 Update `Lpj` model
File: `app/Models/Lpj.php`

Tambah:
```php
protected $fillable = [
    // existing fields...
    'reference_type',
    'current_approval_stage',
    'validated_at',
    'validated_by',
    'validation_notes',
];

protected $casts = [
    // existing casts...
    'reference_type' => ReferenceType::class,
    'current_approval_stage' => LpjApprovalStage::class,
    'validated_at' => 'datetime',
];

public function validation(): HasOne
{
    return $this->hasOne(LpjValidation::class);
}

public function validatedByUser(): BelongsTo
{
    return $this->belongsTo(User::class, 'validated_by');
}
```

---

## PHASE 4: LPJ Approval Service

### 4.1 New `LpjApprovalService`
File: `app/Services/LpjApprovalService.php`

**Key Methods:**

#### `submit(Lpj $lpj): void`
- Set status = Submitted
- Set current_approval_stage = StaffKeuangan
- Create first Approval record (stage=StaffKeuangan, status=pending)

#### `validate(Lpj $lpj, User $validator, array $checklistData): LpjValidation`
- Validate that user is StaffKeuangan
- Validate that current stage is StaffKeuangan
- Validate all checklist items are checked
- Create LpjValidation record
- Set lpj.reference_type from checklistData
- Determine next stage based on reference_type:
  - Education → Direktur
  - HrGeneral → KabagSdmUmum
  - Secretariat → KabagSekretariat
- Mark current approval as Approved
- Create next Approval record
- Update status = Validated

#### `approve(Lpj $lpj, User $approver, ?string $notes): Approval`
- Validate approver role matches current stage
- Mark current approval as Approved
- Determine next stage:
  - Direktur/KabagSdmUmum/KabagSekretariat → Keuangan
  - Keuangan → null (done)
- If next stage exists: create new Approval, update current_approval_stage
- If no next stage: set status = Approved (final)
- Update status based on stage

#### `revise(Lpj $lpj, User $approver, string $notes): Approval`
- Mark current approval as Revised
- Set status = Revised
- Clear current_approval_stage
- Send notification to creator

#### `reject(Lpj $lpj, User $approver, string $notes): Approval`
- Mark current approval as Rejected
- Set status = Rejected
- Clear current_approval_stage
- Send notification to creator

#### `resubmit(Lpj $lpj): void`
- Reset to Submitted
- Set current_approval_stage = StaffKeuangan
- Create new Approval record

#### `getNextStage(Lpj $lpj, LpjApprovalStage $currentStage): ?LpjApprovalStage`
```
StaffKeuangan → {
  reference_type == EDUCATION → Direktur
  reference_type == HR_GENERAL → KabagSdmUmum
  reference_type == SECRETARIAT → KabagSekretariat
}

Direktur → Keuangan
KabagSdmUmum → Keuangan
KabagSekretariat → Keuangan
Keuangan → null (end)
```

#### `getExpectedStages(Lpj $lpj): array`
Returns: [StaffKeuangan, MiddleApprover (based on rujukan), Keuangan]

---

## PHASE 5: Controllers & Requests

### 5.1 Update `LpjController`
File: `app/Http/Controllers/Api/V1/Report/LpjController.php`

Tambah methods:
```php
public function submit(Lpj $lpj): JsonResponse
public function validate(ValidateLpjRequest $request, Lpj $lpj): JsonResponse
public function approve(ApproveLpjRequest $request, Lpj $lpj): JsonResponse
public function revise(ReviseLpjRequest $request, Lpj $lpj): JsonResponse
public function reject(RejectLpjRequest $request, Lpj $lpj): JsonResponse
```

### 5.2 New Request Classes

#### `ValidateLpjRequest.php`
```php
public function rules(): array
{
    return [
        'has_activity_identity' => ['required', 'boolean', 'accepted'],
        'has_cover_letter' => ['required', 'boolean', 'accepted'],
        'has_narrative_report' => ['required', 'boolean', 'accepted'],
        'has_financial_report' => ['required', 'boolean', 'accepted'],
        'has_receipts' => ['required', 'boolean', 'accepted'],
        'reference_type' => ['required', Rule::enum(ReferenceType::class)],
        'notes' => ['nullable', 'string'],
    ];
}
```

#### `ApproveLpjRequest.php`
```php
public function rules(): array
{
    return [
        'notes' => ['nullable', 'string'],
    ];
}
```

#### `ReviseLpjRequest.php` & `RejectLpjRequest.php`
```php
public function rules(): array
{
    return [
        'notes' => ['required', 'string', 'max:1000'],
    ];
}
```

### 5.3 Update `routes/api.php`

```php
// LPJ Approval routes
Route::post('lpj/{lpj}/submit', [LpjController::class, 'submit']);
Route::post('lpj/{lpj}/validate', [LpjController::class, 'validateLpj']);
Route::post('lpj/{lpj}/approve', [LpjController::class, 'approve']);
Route::post('lpj/{lpj}/revise', [LpjController::class, 'revise']);
Route::post('lpj/{lpj}/reject', [LpjController::class, 'reject']);
```

### 5.4 Update `LpjResource`

Tambah fields:
```php
'reference_type' => $this->reference_type,
'current_approval_stage' => $this->current_approval_stage,
'validated_at' => $this->validated_at,
'validation' => $this->whenLoaded('validation', fn() => new LpjValidationResource($this->validation)),
'expected_stages' => $this->when($this->proses !== 'draft', fn() => $this->getExpectedStages()),
```

---

## PHASE 6: Frontend Types & Enums

### 6.1 Update `enums.ts`

```typescript
export enum LpjApprovalStage {
    StaffKeuangan = 'staff-keuangan',
    Direktur = 'direktur',
    KabagSdmUmum = 'kabag-sdm-umum',
    KabagSekretariat = 'kabag-sekretariat',
    Keuangan = 'keuangan',
}

export enum LpjStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    Validated = 'validated',
    ApprovedByMiddle = 'approved-middle',
    Approved = 'approved',
    Revised = 'revised',
    Rejected = 'rejected',
}

export function getLpjStageLabel(stage: LpjApprovalStage): string { ... }
export function getLpjStatusLabel(status: LpjStatus): string { ... }
```

### 6.2 Update `models.ts`

```typescript
export interface LpjValidation {
    id: number;
    lpj_id: number;
    validated_by: number;
    has_activity_identity: boolean;
    has_cover_letter: boolean;
    has_narrative_report: boolean;
    has_financial_report: boolean;
    has_receipts: boolean;
    reference_type: ReferenceType;
    notes: string | null;
    validator?: User;
    created_at: string;
}

// Update Lpj interface
export interface Lpj {
    // existing fields...
    reference_type: ReferenceType | null;
    current_approval_stage: LpjApprovalStage | null;
    validated_at: string | null;
    validation?: LpjValidation;
    expected_stages?: LpjApprovalStage[];
}
```

### 6.3 Update `api.ts`

```typescript
export interface ValidateLpjDTO {
    has_activity_identity: boolean;
    has_cover_letter: boolean;
    has_narrative_report: boolean;
    has_financial_report: boolean;
    has_receipts: boolean;
    reference_type: ReferenceType;
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
```

---

## PHASE 7: Frontend Services & Hooks

### 7.1 Update `reportService.ts`

```typescript
export async function submitLpj(id: number): Promise<Lpj> { ... }
export async function validateLpj(id: number, dto: ValidateLpjDTO): Promise<Lpj> { ... }
export async function approveLpj(id: number, dto: ApproveLpjDTO): Promise<Lpj> { ... }
export async function reviseLpj(id: number, dto: ReviseLpjDTO): Promise<Lpj> { ... }
export async function rejectLpj(id: number, dto: RejectLpjDTO): Promise<Lpj> { ... }
```

### 7.2 Update `useLpj.ts`

```typescript
export function useSubmitLpj() { ... }
export function useValidateLpj() { ... }
export function useApproveLpj() { ... }
export function useReviseLpj() { ... }
export function useRejectLpj() { ... }
```

---

## PHASE 8: Frontend Pages

### 8.1 Update `LpjCreate.tsx`
- Connect to real API
- Tombol "Simpan Draft" dan "Submit"
- Submit calls: create → submit

### 8.2 Update `LpjDetail.tsx`

**Tab 1: Informasi** — LPJ details
**Tab 2: Approval** — Dynamic timeline from `expected_stages`
**Tab 3: Lampiran** — Attachments
**Tab 4: Validasi** (new) — Show validation checklist (for Staf Keuangan stage)

**Action buttons (contextual per stage):**
- Default: Approve / Revisi / Tolak
- StaffKeuangan stage: Opens **ValidationDialog** with checklist + rujukan
- Middle/Keuangan: Standard Approve / Revisi / Tolak

### 8.3 New `LpjValidationDialog.tsx`

Dialog for Staf Keuangan to validate LPJ:
```
┌─────────────────────────────────────────────┐
│ Validasi LPJ                                │
├─────────────────────────────────────────────┤
│ Checklist Kelengkapan:                      │
│ ☑ Identitas kegiatan                        │
│ ☑ Surat pengantar LPJ                       │
│ ☑ Laporan naratif capaian kegiatan          │
│ ☑ Laporan keuangan                          │
│ ☑ Kuitansi atau bukti pengeluaran           │
│                                             │
│ Rujukan LPJ:                                │
│ ○ Bidang Pendidikan                         │
│ ○ Bidang SDM dan Umum                       │
│ ○ Bidang Internal Sekretariat               │
│                                             │
│ Catatan: [________________]                 │
│                                             │
│        [Batal]  [Validasi & Approve]        │
└─────────────────────────────────────────────┘
```

### 8.4 Update `LpjApprovalTimeline.tsx`

- Show stages: StaffKeuangan → Middle → Keuangan
- Completed stages: green
- Current stage: blue pulse
- Future stages: gray
- Show validation checklist summary at StaffKeuangan stage

### 8.5 New `LpjApprovalQueue.tsx` (or integrate into existing)

List pending LPJ approvals for current user's role.

---

## PHASE 9: Files Summary

### Backend — NEW (7 files):
1. `database/migrations/2026_02_06_000001_update_lpjs_add_routing_fields.php`
2. `database/migrations/2026_02_06_000002_create_lpj_validations_table.php`
3. `app/Enums/LpjApprovalStage.php`
4. `app/Models/LpjValidation.php`
5. `app/Services/LpjApprovalService.php`
6. `app/Http/Requests/Report/ValidateLpjRequest.php`
7. `app/Http/Resources/LpjValidationResource.php`

### Backend — MODIFY (5 files):
1. `app/Enums/LpjStatus.php` — Update statuses
2. `app/Models/Lpj.php` — Add fields & relationships
3. `app/Http/Controllers/Api/V1/Report/LpjController.php` — Add approval methods
4. `app/Http/Resources/LpjResource.php` — Add new fields
5. `routes/api.php` — Add LPJ approval routes

### Frontend — NEW (2 files):
1. `resources/js/components/lpj/LpjValidationDialog.tsx`
2. `resources/js/components/lpj/LpjApprovalTimeline.tsx`

### Frontend — MODIFY (6 files):
1. `resources/js/types/enums.ts` — Add LPJ enums
2. `resources/js/types/models.ts` — Update Lpj interface
3. `resources/js/types/api.ts` — Add LPJ DTOs
4. `resources/js/services/reportService.ts` — Add LPJ approval APIs
5. `resources/js/hooks/useLpj.ts` — Add approval hooks
6. `resources/js/pages/report/LpjDetail.tsx` — Add approval UI

---

## Verification Steps

1. `php artisan migrate` → semua migration sukses
2. `npm run build` → no TypeScript errors
3. Login sebagai Unit → buat LPJ → submit → muncul di dashboard Staf Keuangan
4. Login sebagai Staf Keuangan → validasi LPJ (checklist + rujukan) → approve
5. LPJ muncul di dashboard middle approver sesuai rujukan
6. Middle approver approve → LPJ pindah ke Keuangan
7. Keuangan approve → status Approved (selesai)
8. Test revisi: approver revisi → LPJ kembali ke creator → edit & resubmit
9. Test reject: approver tolak → status Rejected, workflow berakhir
