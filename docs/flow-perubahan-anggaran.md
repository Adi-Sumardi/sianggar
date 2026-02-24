# Desain Fitur Perubahan Anggaran

## Overview

Fitur untuk memindahkan/mengalihkan anggaran dari satu pos anggaran (sumber) ke pos anggaran lain (tujuan) dengan workflow approval bertingkat.

---

## 1. Flow Approval

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PERUBAHAN ANGGARAN WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │  Unit/       │
                              │  Substansi   │
                              │  (Creator)   │
                              └──────┬───────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │         STEP 1                 │
                    │  ┌─────────┐   ┌────────────┐  │
                    │  │ Unit    │   │ Substansi  │  │
                    │  │    ↓    │   │     ↓      │  │
                    │  │Direktur │   │ Sekretariat│  │
                    │  │Pendidikan│  │(Kabag Sekr)│  │
                    │  └────┬────┘   └─────┬──────┘  │
                    └───────┼──────────────┼─────────┘
                            │              │
                            ▼              ▼
                    ┌────────────────────────────────┐
                    │         STEP 2                 │
                    │  ┌─────────┐   ┌────────────┐  │
                    │  │ Wakil   │   │ Sekretaris │  │
                    │  │ Ketua   │   │            │  │
                    │  └────┬────┘   └─────┬──────┘  │
                    └───────┼──────────────┼─────────┘
                            │              │
                            └──────┬───────┘
                                   ▼
                    ┌────────────────────────────────┐
                    │         STEP 3                 │
                    │       ┌──────────┐             │
                    │       │  Ketua   │             │
                    │       │  Umum    │             │
                    │       └────┬─────┘             │
                    └────────────┼───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────────┐
                    │         STEP 4                 │
                    │       ┌──────────┐             │
                    │       │ Keuangan │             │
                    │       └────┬─────┘             │
                    └────────────┼───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────────┐
                    │         STEP 5                 │
                    │       ┌──────────┐             │
                    │       │Bendahara │             │
                    │       └────┬─────┘             │
                    └────────────┼───────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────────┐
                    │      PROSES OTOMATIS           │
                    │  ┌────────────────────────┐    │
                    │  │ 1. Update saldo sumber │    │
                    │  │ 2. Update saldo tujuan │    │
                    │  │ 3. Catat riwayat       │    │
                    │  │ 4. Kirim notifikasi    │    │
                    │  └────────────────────────┘    │
                    └────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Tabel: `perubahan_anggarans`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| nomor_perubahan | varchar(50) | Nomor unik (PA/2026/001) |
| user_id | bigint FK | Creator |
| unit_id | bigint FK | Unit pembuat |
| tahun | varchar(4) | Tahun anggaran |
| perihal | varchar(255) | Keterangan perubahan |
| alasan | text | Alasan perubahan |
| submitter_type | enum | 'unit' / 'substansi' |
| status | enum | draft/submitted/approved/rejected/revision-required/completed |
| current_approval_stage | varchar(50) | Stage approval saat ini |
| total_amount | decimal(15,2) | Total nominal yang dipindahkan |
| processed_at | timestamp | Waktu selesai diproses |
| processed_by | bigint FK | User yang memproses final |
| created_at | timestamp | |
| updated_at | timestamp | |

### 2.2 Tabel: `perubahan_anggaran_items`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| perubahan_anggaran_id | bigint FK | Parent |
| source_detail_mata_anggaran_id | bigint FK | Anggaran sumber |
| target_detail_mata_anggaran_id | bigint FK | Anggaran tujuan |
| amount | decimal(15,2) | Nominal yang dipindahkan |
| keterangan | text | Catatan item |
| created_at | timestamp | |
| updated_at | timestamp | |

### 2.3 Tabel: `perubahan_anggaran_logs`

Riwayat pemindahan anggaran yang sudah dieksekusi.

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| perubahan_anggaran_id | bigint FK | Parent |
| perubahan_anggaran_item_id | bigint FK | Item yang dieksekusi |
| source_detail_mata_anggaran_id | bigint FK | |
| target_detail_mata_anggaran_id | bigint FK | |
| source_saldo_before | decimal(15,2) | Saldo sumber sebelum |
| source_saldo_after | decimal(15,2) | Saldo sumber sesudah |
| target_saldo_before | decimal(15,2) | Saldo tujuan sebelum |
| target_saldo_after | decimal(15,2) | Saldo tujuan sesudah |
| amount | decimal(15,2) | Nominal yang dipindahkan |
| executed_by | bigint FK | Bendahara yang approve |
| executed_at | timestamp | Waktu eksekusi |
| created_at | timestamp | |

### 2.4 Reuse Tabel: `approvals`

Sama seperti pengajuan, menggunakan polymorphic `approvable_type` = `App\Models\PerubahanAnggaran`

---

## 3. Enums

### 3.1 PerubahanAnggaranStatus

```php
enum PerubahanAnggaranStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case InReview = 'in-review';
    case RevisionRequired = 'revision-required';
    case Rejected = 'rejected';
    case Completed = 'completed';
}
```

### 3.2 PerubahanApprovalStage

```php
enum PerubahanApprovalStage: string
{
    case Direktur = 'direktur';           // For unit submitter
    case Sekretariat = 'sekretariat';     // For substansi submitter
    case WakilKetua = 'wakil-ketua';      // After Direktur
    case Sekretaris = 'sekretaris';       // After Sekretariat
    case Ketum = 'ketum';
    case Keuangan = 'keuangan';
    case Bendahara = 'bendahara';
}
```

---

## 4. Approval Routing Rules

```php
// Submit routing (based on submitter_type)
if ($submitterType === 'unit') {
    $firstStage = PerubahanApprovalStage::Direktur;
} else {
    $firstStage = PerubahanApprovalStage::Sekretariat;
}

// Next stage routing
Direktur → WakilKetua → Ketum → Keuangan → Bendahara
Sekretariat → Sekretaris → Ketum → Keuangan → Bendahara
```

| Current Stage | Next Stage |
|---------------|------------|
| Direktur | WakilKetua |
| Sekretariat | Sekretaris |
| WakilKetua | Ketum |
| Sekretaris | Ketum |
| Ketum | Keuangan |
| Keuangan | Bendahara |
| Bendahara | null (end, execute transfer) |

---

## 5. Backend Implementation

### 5.1 Models

**PerubahanAnggaran.php**
```php
class PerubahanAnggaran extends Model
{
    protected $fillable = [
        'nomor_perubahan', 'user_id', 'unit_id', 'tahun', 'perihal',
        'alasan', 'submitter_type', 'status', 'current_approval_stage',
        'total_amount', 'processed_at', 'processed_by'
    ];

    protected $casts = [
        'status' => PerubahanAnggaranStatus::class,
        'current_approval_stage' => PerubahanApprovalStage::class,
        'total_amount' => 'decimal:2',
        'processed_at' => 'datetime',
    ];

    // Relations
    public function user(): BelongsTo;
    public function unitRelation(): BelongsTo;
    public function items(): HasMany;
    public function logs(): HasMany;
    public function approvals(): MorphMany;
    public function attachments(): MorphMany;
}
```

**PerubahanAnggaranItem.php**
```php
class PerubahanAnggaranItem extends Model
{
    protected $fillable = [
        'perubahan_anggaran_id',
        'source_detail_mata_anggaran_id',
        'target_detail_mata_anggaran_id',
        'amount',
        'keterangan'
    ];

    // Relations
    public function perubahanAnggaran(): BelongsTo;
    public function sourceDetail(): BelongsTo;  // DetailMataAnggaran
    public function targetDetail(): BelongsTo;  // DetailMataAnggaran
}
```

**PerubahanAnggaranLog.php**
```php
class PerubahanAnggaranLog extends Model
{
    protected $fillable = [
        'perubahan_anggaran_id', 'perubahan_anggaran_item_id',
        'source_detail_mata_anggaran_id', 'target_detail_mata_anggaran_id',
        'source_saldo_before', 'source_saldo_after',
        'target_saldo_before', 'target_saldo_after',
        'amount', 'executed_by', 'executed_at'
    ];
}
```

### 5.2 Service: PerubahanAnggaranService

```php
class PerubahanAnggaranService
{
    /**
     * Submit perubahan anggaran for approval.
     */
    public function submit(PerubahanAnggaran $perubahan, User $user): void
    {
        $submitterType = $user->role->isUnit() ? 'unit' : 'substansi';
        $firstStage = $submitterType === 'unit'
            ? PerubahanApprovalStage::Direktur
            : PerubahanApprovalStage::Sekretariat;

        $perubahan->update([
            'submitter_type' => $submitterType,
            'status' => PerubahanAnggaranStatus::Submitted,
            'current_approval_stage' => $firstStage,
        ]);

        // Create first approval record
        $perubahan->approvals()->create([
            'stage' => $firstStage->value,
            'stage_order' => 1,
            'status' => ApprovalStatus::Pending,
        ]);

        // Send notification to first approver
    }

    /**
     * Approve current stage.
     */
    public function approve(PerubahanAnggaran $perubahan, User $approver, ?string $notes): Approval
    {
        $currentStage = $perubahan->current_approval_stage;

        // Validate approver role
        $this->validateApproverRole($currentStage, $approver);

        // Mark current approval as approved
        $approval = $perubahan->approvals()
            ->where('stage', $currentStage->value)
            ->where('status', ApprovalStatus::Pending)
            ->firstOrFail();

        $approval->update([
            'status' => ApprovalStatus::Approved,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'notes' => $notes,
        ]);

        // Get next stage
        $nextStage = $this->getNextStage($perubahan, $currentStage);

        if ($nextStage === null) {
            // Final stage (Bendahara approved) - execute transfer
            $this->executeTransfer($perubahan, $approver);
        } else {
            // Create next approval
            $perubahan->approvals()->create([
                'stage' => $nextStage->value,
                'stage_order' => $approval->stage_order + 1,
                'status' => ApprovalStatus::Pending,
            ]);

            $perubahan->update([
                'current_approval_stage' => $nextStage,
                'status' => PerubahanAnggaranStatus::InReview,
            ]);

            // Send notification to next approver
        }

        return $approval;
    }

    /**
     * Get next approval stage based on routing rules.
     */
    private function getNextStage(PerubahanAnggaran $perubahan, PerubahanApprovalStage $currentStage): ?PerubahanApprovalStage
    {
        return match ($currentStage) {
            PerubahanApprovalStage::Direktur => PerubahanApprovalStage::WakilKetua,
            PerubahanApprovalStage::Sekretariat => PerubahanApprovalStage::Sekretaris,
            PerubahanApprovalStage::WakilKetua => PerubahanApprovalStage::Ketum,
            PerubahanApprovalStage::Sekretaris => PerubahanApprovalStage::Ketum,
            PerubahanApprovalStage::Ketum => PerubahanApprovalStage::Keuangan,
            PerubahanApprovalStage::Keuangan => PerubahanApprovalStage::Bendahara,
            PerubahanApprovalStage::Bendahara => null, // End
        };
    }

    /**
     * Execute the budget transfer when Bendahara approves.
     */
    private function executeTransfer(PerubahanAnggaran $perubahan, User $executor): void
    {
        DB::transaction(function () use ($perubahan, $executor) {
            foreach ($perubahan->items as $item) {
                $source = DetailMataAnggaran::lockForUpdate()->find($item->source_detail_mata_anggaran_id);
                $target = DetailMataAnggaran::lockForUpdate()->find($item->target_detail_mata_anggaran_id);

                // Record before values
                $sourceSaldoBefore = $source->balance;
                $targetSaldoBefore = $target->balance;

                // Validate source has enough balance
                if ($source->balance < $item->amount) {
                    throw new InsufficientBalanceException("Saldo anggaran sumber tidak mencukupi.");
                }

                // Update source (decrease)
                $source->decrement('balance', $item->amount);
                $source->increment('saldo_dipakai', $item->amount);

                // Update target (increase)
                $target->increment('balance', $item->amount);
                $target->decrement('saldo_dipakai', $item->amount);

                // Log the transfer
                PerubahanAnggaranLog::create([
                    'perubahan_anggaran_id' => $perubahan->id,
                    'perubahan_anggaran_item_id' => $item->id,
                    'source_detail_mata_anggaran_id' => $source->id,
                    'target_detail_mata_anggaran_id' => $target->id,
                    'source_saldo_before' => $sourceSaldoBefore,
                    'source_saldo_after' => $source->fresh()->balance,
                    'target_saldo_before' => $targetSaldoBefore,
                    'target_saldo_after' => $target->fresh()->balance,
                    'amount' => $item->amount,
                    'executed_by' => $executor->id,
                    'executed_at' => now(),
                ]);
            }

            // Mark as completed
            $perubahan->update([
                'status' => PerubahanAnggaranStatus::Completed,
                'current_approval_stage' => null,
                'processed_at' => now(),
                'processed_by' => $executor->id,
            ]);

            // Send notification to creator
        });
    }

    /**
     * Revise - request revision from creator.
     */
    public function revise(PerubahanAnggaran $perubahan, User $approver, string $notes): Approval;

    /**
     * Reject - end the workflow.
     */
    public function reject(PerubahanAnggaran $perubahan, User $approver, string $notes): Approval;

    /**
     * Get expected stages for timeline display.
     */
    public function getExpectedStages(PerubahanAnggaran $perubahan): array;
}
```

### 5.3 Controller: PerubahanAnggaranController

```php
class PerubahanAnggaranController extends Controller
{
    // GET /api/v1/perubahan-anggaran
    public function index(Request $request): AnonymousResourceCollection;

    // POST /api/v1/perubahan-anggaran
    public function store(StorePerubahanAnggaranRequest $request): JsonResponse;

    // GET /api/v1/perubahan-anggaran/{id}
    public function show(PerubahanAnggaran $perubahanAnggaran): JsonResponse;

    // PUT /api/v1/perubahan-anggaran/{id}
    public function update(UpdatePerubahanAnggaranRequest $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse;

    // DELETE /api/v1/perubahan-anggaran/{id}
    public function destroy(PerubahanAnggaran $perubahanAnggaran): JsonResponse;

    // POST /api/v1/perubahan-anggaran/{id}/submit
    public function submit(Request $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse;

    // POST /api/v1/perubahan-anggaran/{id}/approve
    public function approve(ApproveRequest $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse;

    // POST /api/v1/perubahan-anggaran/{id}/revise
    public function revise(ReviseRequest $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse;

    // POST /api/v1/perubahan-anggaran/{id}/reject
    public function reject(RejectRequest $request, PerubahanAnggaran $perubahanAnggaran): JsonResponse;
}
```

### 5.4 Request Validation

**StorePerubahanAnggaranRequest.php**
```php
public function rules(): array
{
    return [
        'perihal' => ['required', 'string', 'max:255'],
        'alasan' => ['required', 'string'],
        'items' => ['required', 'array', 'min:1'],
        'items.*.source_detail_mata_anggaran_id' => ['required', 'integer', 'exists:detail_mata_anggarans,id'],
        'items.*.target_detail_mata_anggaran_id' => ['required', 'integer', 'exists:detail_mata_anggarans,id', 'different:items.*.source_detail_mata_anggaran_id'],
        'items.*.amount' => ['required', 'numeric', 'min:1'],
        'items.*.keterangan' => ['nullable', 'string'],
    ];
}
```

### 5.5 API Routes

```php
Route::prefix('perubahan-anggaran')->group(function () {
    Route::get('/', [PerubahanAnggaranController::class, 'index']);
    Route::post('/', [PerubahanAnggaranController::class, 'store']);
    Route::get('/{perubahanAnggaran}', [PerubahanAnggaranController::class, 'show']);
    Route::put('/{perubahanAnggaran}', [PerubahanAnggaranController::class, 'update']);
    Route::delete('/{perubahanAnggaran}', [PerubahanAnggaranController::class, 'destroy']);
    Route::post('/{perubahanAnggaran}/submit', [PerubahanAnggaranController::class, 'submit']);

    // Approval actions (requires approve-perubahan-anggaran permission)
    Route::middleware('permission:approve-perubahan-anggaran')->group(function () {
        Route::post('/{perubahanAnggaran}/approve', [PerubahanAnggaranController::class, 'approve']);
        Route::post('/{perubahanAnggaran}/revise', [PerubahanAnggaranController::class, 'revise']);
        Route::post('/{perubahanAnggaran}/reject', [PerubahanAnggaranController::class, 'reject']);
    });
});
```

---

## 6. Frontend Implementation

### 6.1 Types

**enums.ts**
```typescript
export enum PerubahanAnggaranStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    InReview = 'in-review',
    RevisionRequired = 'revision-required',
    Rejected = 'rejected',
    Completed = 'completed',
}

export enum PerubahanApprovalStage {
    Direktur = 'direktur',
    Sekretariat = 'sekretariat',
    WakilKetua = 'wakil-ketua',
    Sekretaris = 'sekretaris',
    Ketum = 'ketum',
    Keuangan = 'keuangan',
    Bendahara = 'bendahara',
}

export function getPerubahanStatusLabel(status: PerubahanAnggaranStatus): string {
    return {
        [PerubahanAnggaranStatus.Draft]: 'Draft',
        [PerubahanAnggaranStatus.Submitted]: 'Diajukan',
        [PerubahanAnggaranStatus.InReview]: 'Dalam Review',
        [PerubahanAnggaranStatus.RevisionRequired]: 'Perlu Revisi',
        [PerubahanAnggaranStatus.Rejected]: 'Ditolak',
        [PerubahanAnggaranStatus.Completed]: 'Selesai',
    }[status];
}

export function getPerubahanStageLabel(stage: PerubahanApprovalStage): string {
    return {
        [PerubahanApprovalStage.Direktur]: 'Direktur Pendidikan',
        [PerubahanApprovalStage.Sekretariat]: 'Kabag Sekretariat',
        [PerubahanApprovalStage.WakilKetua]: 'Wakil Ketua',
        [PerubahanApprovalStage.Sekretaris]: 'Sekretaris',
        [PerubahanApprovalStage.Ketum]: 'Ketua Umum',
        [PerubahanApprovalStage.Keuangan]: 'Keuangan',
        [PerubahanApprovalStage.Bendahara]: 'Bendahara',
    }[stage];
}
```

**models.ts**
```typescript
export interface PerubahanAnggaran {
    id: number;
    nomor_perubahan: string;
    user_id: number;
    unit_id: number | null;
    tahun: string;
    perihal: string;
    alasan: string;
    submitter_type: 'unit' | 'substansi' | null;
    status: PerubahanAnggaranStatus;
    current_approval_stage: PerubahanApprovalStage | null;
    total_amount: number;
    processed_at: string | null;
    processed_by: number | null;
    created_at: string;
    updated_at: string;

    // Relations
    user?: User;
    unit?: Unit;
    items?: PerubahanAnggaranItem[];
    logs?: PerubahanAnggaranLog[];
    approvals?: Approval[];
    attachments?: Attachment[];
}

export interface PerubahanAnggaranItem {
    id: number;
    perubahan_anggaran_id: number;
    source_detail_mata_anggaran_id: number;
    target_detail_mata_anggaran_id: number;
    amount: number;
    keterangan: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    source_detail?: DetailMataAnggaran;
    target_detail?: DetailMataAnggaran;
}

export interface PerubahanAnggaranLog {
    id: number;
    perubahan_anggaran_id: number;
    perubahan_anggaran_item_id: number;
    source_detail_mata_anggaran_id: number;
    target_detail_mata_anggaran_id: number;
    source_saldo_before: number;
    source_saldo_after: number;
    target_saldo_before: number;
    target_saldo_after: number;
    amount: number;
    executed_by: number;
    executed_at: string;
    created_at: string;

    // Relations
    executor?: User;
    source_detail?: DetailMataAnggaran;
    target_detail?: DetailMataAnggaran;
}
```

**api.ts**
```typescript
export interface CreatePerubahanAnggaranDTO {
    perihal: string;
    alasan: string;
    items: CreatePerubahanItemDTO[];
}

export interface CreatePerubahanItemDTO {
    source_detail_mata_anggaran_id: number;
    target_detail_mata_anggaran_id: number;
    amount: number;
    keterangan?: string;
}
```

### 6.2 Service: perubahanAnggaranService.ts

```typescript
import api from '@/lib/api';
import type { PerubahanAnggaran } from '@/types/models';
import type { ApiResponse, PaginatedResponse, CreatePerubahanAnggaranDTO } from '@/types/api';

export async function getPerubahanAnggarans(params?: {
    tahun?: string;
    status?: string;
    per_page?: number;
}): Promise<PaginatedResponse<PerubahanAnggaran>> {
    const { data } = await api.get('/perubahan-anggaran', { params });
    return data;
}

export async function getPerubahanAnggaran(id: number): Promise<PerubahanAnggaran> {
    const { data } = await api.get<ApiResponse<PerubahanAnggaran>>(`/perubahan-anggaran/${id}`);
    return data.data;
}

export async function createPerubahanAnggaran(dto: CreatePerubahanAnggaranDTO): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>('/perubahan-anggaran', dto);
    return data.data;
}

export async function submitPerubahanAnggaran(id: number): Promise<PerubahanAnggaran> {
    const { data } = await api.post<ApiResponse<PerubahanAnggaran>>(`/perubahan-anggaran/${id}/submit`);
    return data.data;
}

export async function approvePerubahanAnggaran(id: number, notes?: string): Promise<void> {
    await api.post(`/perubahan-anggaran/${id}/approve`, { notes });
}

export async function revisePerubahanAnggaran(id: number, notes: string): Promise<void> {
    await api.post(`/perubahan-anggaran/${id}/revise`, { notes });
}

export async function rejectPerubahanAnggaran(id: number, notes: string): Promise<void> {
    await api.post(`/perubahan-anggaran/${id}/reject`, { notes });
}
```

### 6.3 Hook: usePerubahanAnggaran.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as perubahanService from '@/services/perubahanAnggaranService';

export function usePerubahanAnggaranList(params?: { tahun?: string; status?: string }) {
    return useQuery({
        queryKey: ['perubahan-anggaran', params],
        queryFn: () => perubahanService.getPerubahanAnggarans(params),
    });
}

export function usePerubahanAnggaran(id: number | null) {
    return useQuery({
        queryKey: ['perubahan-anggaran', id],
        queryFn: () => perubahanService.getPerubahanAnggaran(id!),
        enabled: id !== null,
    });
}

export function useCreatePerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: perubahanService.createPerubahanAnggaran,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['perubahan-anggaran'] });
        },
    });
}

export function useSubmitPerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: perubahanService.submitPerubahanAnggaran,
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['perubahan-anggaran'] });
            queryClient.invalidateQueries({ queryKey: ['perubahan-anggaran', id] });
        },
    });
}

export function useApprovePerubahanAnggaran() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, notes }: { id: number; notes?: string }) =>
            perubahanService.approvePerubahanAnggaran(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['perubahan-anggaran'] });
        },
    });
}

// ... revise, reject mutations
```

---

## 7. UI Pages

### 7.1 Daftar Perubahan Anggaran

Route: `/perubahan-anggaran`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Perubahan Anggaran                                      [+ Buat Baru]     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Tahun: [2026 ▼]   Status: [Semua ▼]   🔍 Cari...                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ PA/2026/001                                          [Draft]          │ │
│  │ Pemindahan anggaran ATK ke Konsumsi                                   │ │
│  │ Unit: SD | Total: Rp 5.000.000 | 15 Jan 2026                         │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ PA/2026/002                                          [Dalam Review]   │ │
│  │ Realokasi anggaran pemeliharaan                                       │ │
│  │ Unit: SMP | Total: Rp 10.000.000 | Stage: Wakil Ketua                │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Buat Perubahan Anggaran

Route: `/perubahan-anggaran/create`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Buat Perubahan Anggaran                                                    │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  ┌─ Step 1: Informasi Dasar ─────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  Perihal *                                                            │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Pemindahan anggaran ATK ke Konsumsi Rapat                        │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │  Alasan Perubahan *                                                   │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Saldo ATK masih cukup banyak sedangkan kebutuhan konsumsi rapat  │ │ │
│  │  │ meningkat karena ada tambahan kegiatan rapat koordinasi...       │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ Step 2: Item Perubahan ──────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Item #1                                              [🗑️ Hapus] │   │ │
│  │  ├────────────────────────────────────────────────────────────────┤   │ │
│  │  │                                                                │   │ │
│  │  │ Anggaran Sumber                                                │   │ │
│  │  │ ┌────────────────────────────────────────────────────────────┐│   │ │
│  │  │ │ [Mata Anggaran ▼] [Sub ▼] [Detail ▼]                       ││   │ │
│  │  │ │ 5.1.02.01 - ATK & Perlengkapan - Kertas HVS A4             ││   │ │
│  │  │ │ Saldo tersedia: Rp 5.000.000                               ││   │ │
│  │  │ └────────────────────────────────────────────────────────────┘│   │ │
│  │  │                         ↓                                      │   │ │
│  │  │ Anggaran Tujuan                                                │   │ │
│  │  │ ┌────────────────────────────────────────────────────────────┐│   │ │
│  │  │ │ [Mata Anggaran ▼] [Sub ▼] [Detail ▼]                       ││   │ │
│  │  │ │ 5.1.02.02 - Konsumsi & Akomodasi - Snack Rapat             ││   │ │
│  │  │ │ Saldo tersedia: Rp 2.000.000                               ││   │ │
│  │  │ └────────────────────────────────────────────────────────────┘│   │ │
│  │  │                                                                │   │ │
│  │  │ Nominal Pindah: [Rp 3.000.000]                                │   │ │
│  │  │ Keterangan: [Untuk kebutuhan rapat koordinasi...]            │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                        │ │
│  │  [+ Tambah Item]                                                      │ │
│  │                                                                        │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │ Total Perubahan: Rp 3.000.000                                  │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│                                    [Simpan Draft]  [Ajukan Persetujuan]     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Detail Perubahan Anggaran

Route: `/perubahan-anggaran/:id`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Detail Perubahan Anggaran                                    [← Kembali]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ Pemindahan anggaran ATK ke Konsumsi Rapat              [Dalam Review]  ││
│  │ ──────────────────────────────────────────────────────────────────────  ││
│  │ No: PA/2026/001 | Unit: SD | Stage: Wakil Ketua                       ││
│  │ Total: Rp 3.000.000                                                    ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Detail Item] [Approval] [Riwayat Transfer]                               │
│  ──────────────────────────────────────────────────────────────────────────│
│                                                                             │
│  ┌─ Detail Item ─────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  #  Sumber              →  Tujuan               Nominal                │ │
│  │  ──────────────────────────────────────────────────────────────────── │ │
│  │  1  5.1.02.01.01         5.1.02.02.01           Rp 3.000.000          │ │
│  │     Kertas HVS A4    →   Snack Rapat                                  │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ Approval Timeline ───────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  ✓ Direktur Pendidikan ───────────────────── Approved 15 Jan 2026    │ │
│  │    Dr. Bambang Sutrisno                                               │ │
│  │                                                                        │ │
│  │  ● Wakil Ketua ─────────────────────────────────────── Menunggu      │ │
│  │                                                                        │ │
│  │  ○ Ketua Umum ──────────────────────────────────────── Belum         │ │
│  │                                                                        │ │
│  │  ○ Keuangan ────────────────────────────────────────── Belum         │ │
│  │                                                                        │ │
│  │  ○ Bendahara ───────────────────────────────────────── Belum         │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─ Untuk Approver ──────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  Catatan (opsional):                                                  │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │                                                                │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                        │ │
│  │  [Minta Revisi]  [Tolak]  [Setujui ✓]                                │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Tab Riwayat Transfer (untuk status Completed)

```
┌─ Riwayat Transfer ───────────────────────────────────────────────────────┐
│                                                                           │
│  Dieksekusi oleh: Bu Siti (Bendahara) pada 20 Jan 2026 14:30            │
│                                                                           │
│  #  Item                Sumber                 Tujuan                    │
│  ────────────────────────────────────────────────────────────────────── │
│  1  Kertas → Snack      Rp 5.000.000 →         Rp 2.000.000 →           │
│                         Rp 2.000.000           Rp 5.000.000             │
│                         (-Rp 3.000.000)        (+Rp 3.000.000)          │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Files Summary

### Backend - NEW (15 files):

1. `database/migrations/2026_02_09_000001_create_perubahan_anggarans_table.php`
2. `database/migrations/2026_02_09_000002_create_perubahan_anggaran_items_table.php`
3. `database/migrations/2026_02_09_000003_create_perubahan_anggaran_logs_table.php`
4. `app/Enums/PerubahanAnggaranStatus.php`
5. `app/Enums/PerubahanApprovalStage.php`
6. `app/Models/PerubahanAnggaran.php`
7. `app/Models/PerubahanAnggaranItem.php`
8. `app/Models/PerubahanAnggaranLog.php`
9. `app/Services/PerubahanAnggaranService.php`
10. `app/Http/Controllers/Api/V1/Budget/PerubahanAnggaranController.php`
11. `app/Http/Requests/Budget/StorePerubahanAnggaranRequest.php`
12. `app/Http/Requests/Budget/UpdatePerubahanAnggaranRequest.php`
13. `app/Http/Resources/PerubahanAnggaranResource.php`
14. `app/Http/Resources/PerubahanAnggaranItemResource.php`
15. `app/Http/Resources/PerubahanAnggaranLogResource.php`

### Backend - MODIFY (2 files):

1. `routes/api.php` - Add perubahan-anggaran routes
2. `database/seeders/RoleAndPermissionSeeder.php` - Add `approve-perubahan-anggaran` permission

### Frontend - NEW (6 files):

1. `resources/js/types/enums.ts` - Add PerubahanAnggaranStatus, PerubahanApprovalStage
2. `resources/js/types/models.ts` - Add PerubahanAnggaran interfaces
3. `resources/js/types/api.ts` - Add CreatePerubahanAnggaranDTO
4. `resources/js/services/perubahanAnggaranService.ts`
5. `resources/js/hooks/usePerubahanAnggaran.ts`
6. `resources/js/pages/budget/perubahan/PerubahanAnggaranList.tsx`
7. `resources/js/pages/budget/perubahan/PerubahanAnggaranCreate.tsx`
8. `resources/js/pages/budget/perubahan/PerubahanAnggaranDetail.tsx`

### Frontend - MODIFY (2 files):

1. `resources/js/router.tsx` - Add routes
2. `resources/js/components/layout/Sidebar.tsx` - Add menu item

---

## 9. Verification Checklist

1. Unit user buat perubahan → submit → muncul di dashboard Direktur Pendidikan
2. Substansi user buat perubahan → submit → muncul di dashboard Kabag Sekretariat
3. Direktur approve → pindah ke Wakil Ketua
4. Sekretariat approve → pindah ke Sekretaris
5. Wakil Ketua/Sekretaris approve → pindah ke Ketum
6. Ketum approve → pindah ke Keuangan
7. Keuangan approve → pindah ke Bendahara
8. Bendahara approve →
   - Status jadi Completed
   - Saldo sumber berkurang
   - Saldo tujuan bertambah
   - Riwayat tercatat di logs
   - Notifikasi ke pengaju
9. Revisi di tengah jalan → kembali ke pengaju → edit → submit ulang
10. Tolak di tengah jalan → status Rejected, workflow berakhir
