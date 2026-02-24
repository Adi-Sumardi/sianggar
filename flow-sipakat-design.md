# Design Document: SIPAKAT Integration (PKT → RAPBS → APBS)

Berdasarkan analisis `flow-sipakat.md` dan struktur database yang ada.

---

## Analisis Kondisi Saat Ini

### Models yang Sudah Ada
| Model | Tabel | Status |
|-------|-------|--------|
| Bagian | bagians | Ada, perlu connect ke API |
| Strategy | strategies | Ada |
| Indikator | indikators | Ada |
| Proker | prokers | Ada, perlu connect ke API |
| Kegiatan | kegiatans | Ada |
| Pkt | pkts | Ada, tapi model & migration tidak sinkron |
| Apbs | apbs | Ada, schema perlu diperbaiki |

### Yang Belum Ada
- **Rapbs Model & Table** - belum ada, hanya ada controller yang generate data virtual
- **RapbsApproval** - sistem approval RAPBS
- **Audit Log** - logging perubahan & diskusi

### Issues Ditemukan
1. **PKT Model vs Migration Mismatch**:
   - Model fillable: `strategy_id, indikator_id, proker_id, kegiatan_id, mata_anggaran_id, sub_mata_anggaran_id, kode, nama, keterangan`
   - Migration: `strategy_id, indikator_id, proker_id, kegiatan_id, mata_anggaran_id, sub_mata_anggaran_id, tahun, unit, deskripsi_kegiatan, tujuan_kegiatan, saldo_anggaran`

2. **Frontend PktList.tsx**: Menggunakan mock data, belum connect ke API

3. **APBS Schema**: Kurang lengkap untuk kebutuhan pengesahan

---

## PHASE 1: Database Schema Updates

### 1.1 Migration: Update `pkts` table
**File:** `database/migrations/2026_02_10_000001_update_pkts_table_add_missing_columns.php`

```php
Schema::table('pkts', function (Blueprint $table) {
    // Add missing columns
    $table->foreignId('unit_id')->nullable()->after('sub_mata_anggaran_id')->constrained('units');
    $table->foreignId('detail_mata_anggaran_id')->nullable()->after('sub_mata_anggaran_id')->constrained('detail_mata_anggarans');
    $table->foreignId('created_by')->nullable()->after('saldo_anggaran')->constrained('users');
    $table->string('status')->default('draft')->after('created_by'); // draft, submitted, approved, rejected
    $table->text('catatan')->nullable()->after('status');
});
```

### 1.2 Migration: Create `rapbs` table
**File:** `database/migrations/2026_02_10_000002_create_rapbs_table.php`

```php
Schema::create('rapbs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('unit_id')->constrained('units')->onDelete('cascade');
    $table->string('tahun', 10); // '2025/2026'
    $table->decimal('total_anggaran', 15, 2)->default(0);
    $table->string('status')->default('draft'); // draft, submitted, in_review, approved, rejected
    $table->string('current_approval_stage')->nullable(); // direktur, keuangan, sekretaris, etc.
    $table->foreignId('submitted_by')->nullable()->constrained('users');
    $table->timestamp('submitted_at')->nullable();
    $table->foreignId('approved_by')->nullable()->constrained('users');
    $table->timestamp('approved_at')->nullable();
    $table->text('keterangan')->nullable();
    $table->timestamps();

    $table->unique(['unit_id', 'tahun']);
});
```

### 1.3 Migration: Create `rapbs_items` table
**File:** `database/migrations/2026_02_10_000003_create_rapbs_items_table.php`

```php
Schema::create('rapbs_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('rapbs_id')->constrained('rapbs')->onDelete('cascade');
    $table->foreignId('pkt_id')->nullable()->constrained('pkts')->onDelete('set null');
    $table->foreignId('mata_anggaran_id')->constrained('mata_anggarans');
    $table->foreignId('sub_mata_anggaran_id')->nullable()->constrained('sub_mata_anggarans');
    $table->foreignId('detail_mata_anggaran_id')->nullable()->constrained('detail_mata_anggarans');
    $table->string('kode_coa', 50);
    $table->string('nama', 255);
    $table->text('uraian')->nullable();
    $table->decimal('volume', 10, 2)->default(1);
    $table->string('satuan', 50)->nullable();
    $table->decimal('harga_satuan', 15, 2)->default(0);
    $table->decimal('jumlah', 15, 2)->default(0);
    $table->timestamps();
});
```

### 1.4 Migration: Create `rapbs_approvals` table
**File:** `database/migrations/2026_02_10_000004_create_rapbs_approvals_table.php`

```php
Schema::create('rapbs_approvals', function (Blueprint $table) {
    $table->id();
    $table->foreignId('rapbs_id')->constrained('rapbs')->onDelete('cascade');
    $table->foreignId('user_id')->constrained('users');
    $table->string('stage'); // direktur, sekretariat, keuangan, sekretaris, wakil_ketua, ketum, bendahara
    $table->integer('stage_order');
    $table->string('status')->default('pending'); // pending, approved, revised, rejected
    $table->text('notes')->nullable();
    $table->timestamp('acted_at')->nullable();
    $table->timestamps();

    $table->index(['rapbs_id', 'stage_order']);
});
```

### 1.5 Migration: Update `apbs` table
**File:** `database/migrations/2026_02_10_000005_update_apbs_table_add_pengesahan.php`

```php
Schema::table('apbs', function (Blueprint $table) {
    $table->dropColumn('mata_anggaran');

    $table->foreignId('rapbs_id')->nullable()->after('unit_id')->constrained('rapbs');
    $table->decimal('total_anggaran', 15, 2)->default(0)->after('tahun');
    $table->decimal('total_realisasi', 15, 2)->default(0)->after('total_anggaran');
    $table->decimal('sisa_anggaran', 15, 2)->default(0)->after('total_realisasi');
    $table->string('nomor_dokumen', 50)->nullable()->after('sisa_anggaran');
    $table->date('tanggal_pengesahan')->nullable()->after('nomor_dokumen');
    $table->string('status')->default('active')->after('tanggal_pengesahan'); // active, closed
    $table->text('keterangan')->nullable()->after('status');

    // Penandatangan
    $table->string('ttd_kepala_sekolah')->nullable();
    $table->string('ttd_bendahara')->nullable();
    $table->string('ttd_ketua_umum')->nullable();
});
```

### 1.6 Migration: Create `apbs_items` table
**File:** `database/migrations/2026_02_10_000006_create_apbs_items_table.php`

```php
Schema::create('apbs_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('apbs_id')->constrained('apbs')->onDelete('cascade');
    $table->foreignId('rapbs_item_id')->nullable()->constrained('rapbs_items');
    $table->foreignId('mata_anggaran_id')->constrained('mata_anggarans');
    $table->foreignId('detail_mata_anggaran_id')->nullable()->constrained('detail_mata_anggarans');
    $table->string('kode_coa', 50);
    $table->string('nama', 255);
    $table->decimal('anggaran', 15, 2)->default(0);
    $table->decimal('realisasi', 15, 2)->default(0);
    $table->decimal('sisa', 15, 2)->default(0);
    $table->timestamps();
});
```

### 1.7 Migration: Create `activity_logs` table (Audit Trail)
**File:** `database/migrations/2026_02_10_000007_create_activity_logs_table.php`

```php
Schema::create('activity_logs', function (Blueprint $table) {
    $table->id();
    $table->string('loggable_type'); // App\Models\Rapbs, App\Models\Pkt, etc.
    $table->unsignedBigInteger('loggable_id');
    $table->foreignId('user_id')->constrained('users');
    $table->string('action'); // created, updated, submitted, approved, rejected, commented
    $table->json('old_values')->nullable();
    $table->json('new_values')->nullable();
    $table->text('description')->nullable();
    $table->timestamps();

    $table->index(['loggable_type', 'loggable_id']);
});
```

---

## PHASE 2: Backend Models

### 2.1 Update `Pkt` model
**File:** `app/Models/Pkt.php`

```php
protected $fillable = [
    'strategy_id',
    'indikator_id',
    'proker_id',
    'kegiatan_id',
    'mata_anggaran_id',
    'sub_mata_anggaran_id',
    'detail_mata_anggaran_id',
    'unit_id',
    'tahun',
    'deskripsi_kegiatan',
    'tujuan_kegiatan',
    'saldo_anggaran',
    'created_by',
    'status',
    'catatan',
];

// Add relationships
public function unit(): BelongsTo
{
    return $this->belongsTo(Unit::class);
}

public function detailMataAnggaran(): BelongsTo
{
    return $this->belongsTo(DetailMataAnggaran::class);
}

public function creator(): BelongsTo
{
    return $this->belongsTo(User::class, 'created_by');
}

public function rapbsItems(): HasMany
{
    return $this->hasMany(RapbsItem::class);
}
```

### 2.2 New `Rapbs` model
**File:** `app/Models/Rapbs.php`

```php
<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\RapbsStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Rapbs extends Model
{
    use HasFactory;

    protected $table = 'rapbs';

    protected $fillable = [
        'unit_id',
        'tahun',
        'total_anggaran',
        'status',
        'current_approval_stage',
        'submitted_by',
        'submitted_at',
        'approved_by',
        'approved_at',
        'keterangan',
    ];

    protected function casts(): array
    {
        return [
            'total_anggaran' => 'decimal:2',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'status' => RapbsStatus::class,
        ];
    }

    // Relationships
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RapbsItem::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(RapbsApproval::class)->orderBy('stage_order');
    }

    public function currentApproval(): HasOne
    {
        return $this->hasOne(RapbsApproval::class)
            ->where('status', 'pending')
            ->orderBy('stage_order');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function apbs(): HasOne
    {
        return $this->hasOne(Apbs::class);
    }

    // Helpers
    public function recalculateTotal(): void
    {
        $this->total_anggaran = $this->items()->sum('jumlah');
        $this->save();
    }
}
```

### 2.3 New `RapbsItem` model
**File:** `app/Models/RapbsItem.php`

### 2.4 New `RapbsApproval` model
**File:** `app/Models/RapbsApproval.php`

### 2.5 Update `Apbs` model
**File:** `app/Models/Apbs.php`

### 2.6 New `ApbsItem` model
**File:** `app/Models/ApbsItem.php`

### 2.7 New `ActivityLog` model
**File:** `app/Models/ActivityLog.php`

---

## PHASE 3: Backend Enums

### 3.1 New `RapbsStatus` enum
**File:** `app/Enums/RapbsStatus.php`

```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum RapbsStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case InReview = 'in_review';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Submitted => 'Diajukan',
            self::InReview => 'Dalam Review',
            self::Approved => 'Disetujui',
            self::Rejected => 'Ditolak',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => 'gray',
            self::Submitted => 'blue',
            self::InReview => 'yellow',
            self::Approved => 'green',
            self::Rejected => 'red',
        };
    }
}
```

### 3.2 New `RapbsApprovalStage` enum
**File:** `app/Enums/RapbsApprovalStage.php`

```php
<?php

declare(strict_types=1);

namespace App\Enums;

enum RapbsApprovalStage: string
{
    // Flow untuk Unit
    case Direktur = 'direktur';
    // Flow untuk Substansi
    case Sekretariat = 'sekretariat';
    // Common flow
    case Keuangan = 'keuangan';
    case Sekretaris = 'sekretaris';
    case WakilKetua = 'wakil_ketua';
    case Ketum = 'ketum';
    case Bendahara = 'bendahara';

    public function label(): string
    {
        return match ($this) {
            self::Direktur => 'Direktur Pendidikan',
            self::Sekretariat => 'Sekretariat',
            self::Keuangan => 'Keuangan',
            self::Sekretaris => 'Sekretaris',
            self::WakilKetua => 'Wakil Ketua',
            self::Ketum => 'Ketua Umum',
            self::Bendahara => 'Bendahara',
        };
    }

    public function requiredRole(): UserRole
    {
        return match ($this) {
            self::Direktur => UserRole::Direktur,
            self::Sekretariat => UserRole::Sekretariat,
            self::Keuangan => UserRole::Keuangan,
            self::Sekretaris => UserRole::Sekretaris,
            self::WakilKetua => UserRole::Ketua1,
            self::Ketum => UserRole::Ketum,
            self::Bendahara => UserRole::Bendahara,
        };
    }

    /**
     * Get approval stages for Unit submitter
     */
    public static function unitFlow(): array
    {
        return [
            self::Direktur,
            self::Keuangan,
            self::Sekretaris,
            self::WakilKetua,
            self::Ketum,
            self::Bendahara,
        ];
    }

    /**
     * Get approval stages for Substansi submitter
     */
    public static function substansiFlow(): array
    {
        return [
            self::Sekretariat,
            self::Keuangan,
            self::Sekretaris,
            self::WakilKetua,
            self::Ketum,
            self::Bendahara,
        ];
    }

    public static function getNextStage(self $currentStage, bool $isUnit): ?self
    {
        $flow = $isUnit ? self::unitFlow() : self::substansiFlow();
        $currentIndex = array_search($currentStage, $flow, true);

        if ($currentIndex === false || $currentIndex === count($flow) - 1) {
            return null;
        }

        return $flow[$currentIndex + 1];
    }
}
```

---

## PHASE 4: Service Layer

### 4.1 New `RapbsApprovalService`
**File:** `app/Services/RapbsApprovalService.php`

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RapbsApprovalStage;
use App\Enums\RapbsStatus;
use App\Enums\UserRole;
use App\Models\Apbs;
use App\Models\ApbsItem;
use App\Models\Rapbs;
use App\Models\RapbsApproval;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RapbsApprovalService
{
    /**
     * Submit RAPBS untuk approval
     */
    public function submit(Rapbs $rapbs, User $submitter): void
    {
        DB::transaction(function () use ($rapbs, $submitter) {
            // Determine if submitter is Unit or Substansi
            $isUnit = $submitter->role->isUnit();
            $flow = $isUnit
                ? RapbsApprovalStage::unitFlow()
                : RapbsApprovalStage::substansiFlow();

            $firstStage = $flow[0];

            // Create first approval record
            RapbsApproval::create([
                'rapbs_id' => $rapbs->id,
                'user_id' => $submitter->id, // Will be updated when approver acts
                'stage' => $firstStage->value,
                'stage_order' => 1,
                'status' => 'pending',
            ]);

            // Update RAPBS status
            $rapbs->update([
                'status' => RapbsStatus::Submitted,
                'current_approval_stage' => $firstStage->value,
                'submitted_by' => $submitter->id,
                'submitted_at' => now(),
            ]);

            // Log activity
            $this->logActivity($rapbs, $submitter, 'submitted', 'RAPBS diajukan untuk approval');
        });
    }

    /**
     * Approve current stage
     */
    public function approve(Rapbs $rapbs, User $approver, ?string $notes = null): RapbsApproval
    {
        return DB::transaction(function () use ($rapbs, $approver, $notes) {
            $currentApproval = $rapbs->currentApproval;

            if (!$currentApproval) {
                throw new \Exception('Tidak ada approval yang pending');
            }

            // Validate approver role
            $requiredRole = RapbsApprovalStage::from($currentApproval->stage)->requiredRole();
            if ($approver->role !== $requiredRole) {
                throw new \Exception('Anda tidak memiliki akses untuk approve stage ini');
            }

            // Mark current approval as approved
            $currentApproval->update([
                'user_id' => $approver->id,
                'status' => 'approved',
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            // Determine submitter type
            $isUnit = $rapbs->submitter?->role->isUnit() ?? true;

            // Get next stage
            $currentStage = RapbsApprovalStage::from($currentApproval->stage);
            $nextStage = RapbsApprovalStage::getNextStage($currentStage, $isUnit);

            if ($nextStage) {
                // Create next approval record
                RapbsApproval::create([
                    'rapbs_id' => $rapbs->id,
                    'user_id' => $approver->id,
                    'stage' => $nextStage->value,
                    'stage_order' => $currentApproval->stage_order + 1,
                    'status' => 'pending',
                ]);

                $rapbs->update([
                    'status' => RapbsStatus::InReview,
                    'current_approval_stage' => $nextStage->value,
                ]);
            } else {
                // Final approval (Bendahara) - generate APBS
                $rapbs->update([
                    'status' => RapbsStatus::Approved,
                    'current_approval_stage' => null,
                    'approved_by' => $approver->id,
                    'approved_at' => now(),
                ]);

                $this->generateApbs($rapbs);
            }

            $this->logActivity($rapbs, $approver, 'approved', "Disetujui oleh {$approver->name} pada stage {$currentStage->label()}");

            return $currentApproval;
        });
    }

    /**
     * Request revision
     */
    public function revise(Rapbs $rapbs, User $approver, string $notes): RapbsApproval
    {
        return DB::transaction(function () use ($rapbs, $approver, $notes) {
            $currentApproval = $rapbs->currentApproval;

            $currentApproval->update([
                'user_id' => $approver->id,
                'status' => 'revised',
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            $rapbs->update([
                'status' => RapbsStatus::Draft,
                'current_approval_stage' => null,
            ]);

            $this->logActivity($rapbs, $approver, 'revised', "Diminta revisi: {$notes}");

            return $currentApproval;
        });
    }

    /**
     * Reject RAPBS
     */
    public function reject(Rapbs $rapbs, User $approver, string $notes): RapbsApproval
    {
        return DB::transaction(function () use ($rapbs, $approver, $notes) {
            $currentApproval = $rapbs->currentApproval;

            $currentApproval->update([
                'user_id' => $approver->id,
                'status' => 'rejected',
                'notes' => $notes,
                'acted_at' => now(),
            ]);

            $rapbs->update([
                'status' => RapbsStatus::Rejected,
                'current_approval_stage' => null,
            ]);

            $this->logActivity($rapbs, $approver, 'rejected', "Ditolak: {$notes}");

            return $currentApproval;
        });
    }

    /**
     * Generate APBS from approved RAPBS
     */
    protected function generateApbs(Rapbs $rapbs): Apbs
    {
        // Create APBS
        $apbs = Apbs::create([
            'unit_id' => $rapbs->unit_id,
            'rapbs_id' => $rapbs->id,
            'tahun' => $rapbs->tahun,
            'total_anggaran' => $rapbs->total_anggaran,
            'total_realisasi' => 0,
            'sisa_anggaran' => $rapbs->total_anggaran,
            'nomor_dokumen' => $this->generateApbsNumber($rapbs),
            'tanggal_pengesahan' => now()->toDateString(),
            'status' => 'active',
        ]);

        // Copy RAPBS items to APBS items
        foreach ($rapbs->items as $rapbsItem) {
            ApbsItem::create([
                'apbs_id' => $apbs->id,
                'rapbs_item_id' => $rapbsItem->id,
                'mata_anggaran_id' => $rapbsItem->mata_anggaran_id,
                'detail_mata_anggaran_id' => $rapbsItem->detail_mata_anggaran_id,
                'kode_coa' => $rapbsItem->kode_coa,
                'nama' => $rapbsItem->nama,
                'anggaran' => $rapbsItem->jumlah,
                'realisasi' => 0,
                'sisa' => $rapbsItem->jumlah,
            ]);

            // Update DetailMataAnggaran balance if linked
            if ($rapbsItem->detail_mata_anggaran_id) {
                $detail = $rapbsItem->detailMataAnggaran;
                $detail->update([
                    'anggaran_awal' => $rapbsItem->jumlah,
                    'balance' => $rapbsItem->jumlah,
                ]);
            }
        }

        $this->logActivity($rapbs, null, 'apbs_generated', "APBS #{$apbs->nomor_dokumen} berhasil dibuat");

        return $apbs;
    }

    protected function generateApbsNumber(Rapbs $rapbs): string
    {
        $count = Apbs::where('tahun', $rapbs->tahun)->count() + 1;
        return sprintf('APBS/%s/%s/%03d', $rapbs->unit->kode, $rapbs->tahun, $count);
    }

    protected function logActivity(Rapbs $rapbs, ?User $user, string $action, string $description): void
    {
        \App\Models\ActivityLog::create([
            'loggable_type' => Rapbs::class,
            'loggable_id' => $rapbs->id,
            'user_id' => $user?->id ?? auth()->id(),
            'action' => $action,
            'description' => $description,
        ]);
    }

    /**
     * Get pending approvals for a user based on their role
     */
    public function getPendingForUser(User $user): \Illuminate\Database\Eloquent\Collection
    {
        $role = $user->role;

        // Find stages that match user's role
        $matchingStages = collect(RapbsApprovalStage::cases())
            ->filter(fn ($stage) => $stage->requiredRole() === $role)
            ->map(fn ($stage) => $stage->value)
            ->toArray();

        if (empty($matchingStages)) {
            return collect();
        }

        return Rapbs::whereIn('current_approval_stage', $matchingStages)
            ->where('status', RapbsStatus::Submitted)
            ->orWhere('status', RapbsStatus::InReview)
            ->with(['unit', 'items', 'currentApproval', 'submitter'])
            ->get();
    }
}
```

### 4.2 New `PktService`
**File:** `app/Services/PktService.php`

```php
<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Pkt;
use App\Models\Rapbs;
use App\Models\RapbsItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PktService
{
    /**
     * Create PKT and auto-generate RAPBS entry
     */
    public function create(array $data, User $creator): Pkt
    {
        return DB::transaction(function () use ($data, $creator) {
            // Create PKT
            $pkt = Pkt::create([
                ...$data,
                'created_by' => $creator->id,
                'status' => 'draft',
            ]);

            // Get or create RAPBS for this unit/year
            $rapbs = Rapbs::firstOrCreate(
                [
                    'unit_id' => $pkt->unit_id,
                    'tahun' => $pkt->tahun,
                ],
                [
                    'total_anggaran' => 0,
                    'status' => 'draft',
                ]
            );

            // Create RAPBS item from PKT
            $rapbsItem = RapbsItem::create([
                'rapbs_id' => $rapbs->id,
                'pkt_id' => $pkt->id,
                'mata_anggaran_id' => $pkt->mata_anggaran_id,
                'sub_mata_anggaran_id' => $pkt->sub_mata_anggaran_id,
                'detail_mata_anggaran_id' => $pkt->detail_mata_anggaran_id,
                'kode_coa' => $this->generateCoaCode($pkt),
                'nama' => $pkt->kegiatan->nama ?? $pkt->deskripsi_kegiatan,
                'uraian' => $pkt->deskripsi_kegiatan,
                'jumlah' => $pkt->saldo_anggaran,
            ]);

            // Recalculate RAPBS total
            $rapbs->recalculateTotal();

            return $pkt;
        });
    }

    protected function generateCoaCode(Pkt $pkt): string
    {
        $parts = [];

        if ($pkt->mataAnggaran) {
            $parts[] = $pkt->mataAnggaran->kode;
        }
        if ($pkt->subMataAnggaran) {
            $parts[] = $pkt->subMataAnggaran->kode;
        }
        if ($pkt->detailMataAnggaran) {
            $parts[] = $pkt->detailMataAnggaran->kode;
        }

        return implode('.', $parts) ?: 'N/A';
    }
}
```

---

## PHASE 5: Controllers

### 5.1 Update `PktController`
**File:** `app/Http/Controllers/Api/V1/Planning/PktController.php`

- Connect to real database (remove mock data)
- Use PktService for create/update
- Auto-generate RAPBS entries

### 5.2 New `RapbsApprovalController`
**File:** `app/Http/Controllers/Api/V1/Budget/RapbsApprovalController.php`

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Budget;

use App\Http\Controllers\Controller;
use App\Http\Resources\RapbsResource;
use App\Models\Rapbs;
use App\Services\RapbsApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RapbsApprovalController extends Controller
{
    public function __construct(
        private RapbsApprovalService $approvalService
    ) {}

    /**
     * Get pending approvals for current user
     */
    public function pending(Request $request): JsonResponse
    {
        $pending = $this->approvalService->getPendingForUser($request->user());

        return response()->json([
            'data' => RapbsResource::collection($pending),
        ]);
    }

    /**
     * Submit RAPBS for approval
     */
    public function submit(Rapbs $rapbs, Request $request): JsonResponse
    {
        $this->approvalService->submit($rapbs, $request->user());

        return response()->json([
            'message' => 'RAPBS berhasil diajukan untuk approval',
            'data' => new RapbsResource($rapbs->fresh()),
        ]);
    }

    /**
     * Approve current stage
     */
    public function approve(Rapbs $rapbs, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->approvalService->approve($rapbs, $request->user(), $validated['notes'] ?? null);

        return response()->json([
            'message' => 'RAPBS berhasil disetujui',
            'data' => new RapbsResource($rapbs->fresh()),
        ]);
    }

    /**
     * Request revision
     */
    public function revise(Rapbs $rapbs, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $this->approvalService->revise($rapbs, $request->user(), $validated['notes']);

        return response()->json([
            'message' => 'RAPBS dikembalikan untuk revisi',
            'data' => new RapbsResource($rapbs->fresh()),
        ]);
    }

    /**
     * Reject RAPBS
     */
    public function reject(Rapbs $rapbs, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $this->approvalService->reject($rapbs, $request->user(), $validated['notes']);

        return response()->json([
            'message' => 'RAPBS ditolak',
            'data' => new RapbsResource($rapbs->fresh()),
        ]);
    }
}
```

### 5.3 Update `ApbsController`
**File:** `app/Http/Controllers/Api/V1/Budget/ApbsController.php`

- Add pengesahan view (PDF/printable format)
- Show APBS items with anggaran/realisasi/sisa

---

## PHASE 6: API Routes

**File:** `routes/api.php`

```php
// RAPBS Approval
Route::middleware('permission:approve-rapbs')->group(function () {
    Route::get('rapbs/pending', [RapbsApprovalController::class, 'pending']);
    Route::post('rapbs/{rapbs}/submit', [RapbsApprovalController::class, 'submit']);
    Route::post('rapbs/{rapbs}/approve', [RapbsApprovalController::class, 'approve']);
    Route::post('rapbs/{rapbs}/revise', [RapbsApprovalController::class, 'revise']);
    Route::post('rapbs/{rapbs}/reject', [RapbsApprovalController::class, 'reject']);
});

// APBS
Route::middleware('permission:view-budget')->group(function () {
    Route::get('apbs', [ApbsController::class, 'index']);
    Route::get('apbs/{apbs}', [ApbsController::class, 'show']);
    Route::get('apbs/{apbs}/pengesahan', [ApbsController::class, 'pengesahan']); // Printable view
});
```

---

## PHASE 7: Frontend Types

### 7.1 Update `enums.ts`
**File:** `resources/js/types/enums.ts`

```typescript
export enum RapbsStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    InReview = 'in_review',
    Approved = 'approved',
    Rejected = 'rejected',
}

export enum RapbsApprovalStage {
    Direktur = 'direktur',
    Sekretariat = 'sekretariat',
    Keuangan = 'keuangan',
    Sekretaris = 'sekretaris',
    WakilKetua = 'wakil_ketua',
    Ketum = 'ketum',
    Bendahara = 'bendahara',
}

export function getRapbsStatusLabel(status: RapbsStatus): string {
    const labels: Record<RapbsStatus, string> = {
        [RapbsStatus.Draft]: 'Draft',
        [RapbsStatus.Submitted]: 'Diajukan',
        [RapbsStatus.InReview]: 'Dalam Review',
        [RapbsStatus.Approved]: 'Disetujui',
        [RapbsStatus.Rejected]: 'Ditolak',
    };
    return labels[status] || status;
}

export function getRapbsStageLabel(stage: RapbsApprovalStage): string {
    const labels: Record<RapbsApprovalStage, string> = {
        [RapbsApprovalStage.Direktur]: 'Direktur Pendidikan',
        [RapbsApprovalStage.Sekretariat]: 'Sekretariat',
        [RapbsApprovalStage.Keuangan]: 'Keuangan',
        [RapbsApprovalStage.Sekretaris]: 'Sekretaris',
        [RapbsApprovalStage.WakilKetua]: 'Wakil Ketua',
        [RapbsApprovalStage.Ketum]: 'Ketua Umum',
        [RapbsApprovalStage.Bendahara]: 'Bendahara',
    };
    return labels[stage] || stage;
}
```

### 7.2 Update `models.ts`
**File:** `resources/js/types/models.ts`

```typescript
export interface Pkt {
    id: number;
    strategy_id: number;
    indikator_id: number;
    proker_id: number;
    kegiatan_id: number;
    mata_anggaran_id: number;
    sub_mata_anggaran_id?: number;
    detail_mata_anggaran_id?: number;
    unit_id: number;
    tahun: string;
    deskripsi_kegiatan?: string;
    tujuan_kegiatan?: string;
    saldo_anggaran: number;
    status: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    // Relations
    strategy?: Strategy;
    indikator?: Indikator;
    proker?: Proker;
    kegiatan?: Kegiatan;
    mata_anggaran?: MataAnggaran;
    unit?: Unit;
    creator?: User;
}

export interface Rapbs {
    id: number;
    unit_id: number;
    tahun: string;
    total_anggaran: number;
    status: RapbsStatus;
    current_approval_stage?: RapbsApprovalStage;
    submitted_by?: number;
    submitted_at?: string;
    approved_by?: number;
    approved_at?: string;
    keterangan?: string;
    created_at: string;
    updated_at: string;
    // Relations
    unit?: Unit;
    items?: RapbsItem[];
    approvals?: RapbsApproval[];
    current_approval?: RapbsApproval;
    submitter?: User;
    approver?: User;
}

export interface RapbsItem {
    id: number;
    rapbs_id: number;
    pkt_id?: number;
    mata_anggaran_id: number;
    kode_coa: string;
    nama: string;
    uraian?: string;
    volume: number;
    satuan?: string;
    harga_satuan: number;
    jumlah: number;
    // Relations
    pkt?: Pkt;
    mata_anggaran?: MataAnggaran;
}

export interface RapbsApproval {
    id: number;
    rapbs_id: number;
    user_id: number;
    stage: RapbsApprovalStage;
    stage_order: number;
    status: 'pending' | 'approved' | 'revised' | 'rejected';
    notes?: string;
    acted_at?: string;
    // Relations
    user?: User;
}

export interface Apbs {
    id: number;
    unit_id: number;
    rapbs_id?: number;
    tahun: string;
    total_anggaran: number;
    total_realisasi: number;
    sisa_anggaran: number;
    nomor_dokumen?: string;
    tanggal_pengesahan?: string;
    status: 'active' | 'closed';
    keterangan?: string;
    ttd_kepala_sekolah?: string;
    ttd_bendahara?: string;
    ttd_ketua_umum?: string;
    // Relations
    unit?: Unit;
    rapbs?: Rapbs;
    items?: ApbsItem[];
}

export interface ApbsItem {
    id: number;
    apbs_id: number;
    kode_coa: string;
    nama: string;
    anggaran: number;
    realisasi: number;
    sisa: number;
}

export interface ActivityLog {
    id: number;
    loggable_type: string;
    loggable_id: number;
    user_id: number;
    action: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    description?: string;
    created_at: string;
    user?: User;
}
```

---

## PHASE 8: Frontend Services & Hooks

### 8.1 New `rapbsApprovalService.ts`
**File:** `resources/js/services/rapbsApprovalService.ts`

### 8.2 New `useRapbsApproval.ts`
**File:** `resources/js/hooks/useRapbsApproval.ts`

### 8.3 Update `pktService.ts`
**File:** `resources/js/services/pktService.ts`

### 8.4 Update `usePkt.ts`
**File:** `resources/js/hooks/usePkt.ts`

---

## PHASE 9: Frontend Pages

### 9.1 Update `PktList.tsx`
**File:** `resources/js/pages/planning/PktList.tsx`

- Connect to real API
- Replace mock data with TanStack Query hooks
- Add submit to RAPBS action

### 9.2 New `RapbsDetail.tsx`
**File:** `resources/js/pages/budget/rapbs/RapbsDetail.tsx`

- Show RAPBS items
- Show approval timeline
- Action buttons: Submit / Approve / Revise / Reject
- Activity log

### 9.3 New `RapbsApprovalQueue.tsx`
**File:** `resources/js/pages/budget/rapbs/RapbsApprovalQueue.tsx`

- List pending RAPBS approvals for current user
- Quick approve/revise/reject actions

### 9.4 New `ApbsPengesahan.tsx`
**File:** `resources/js/pages/budget/apbs/ApbsPengesahan.tsx`

- Printable APBS document
- Signature areas for:
  - Kepala Sekolah
  - Bendahara
  - Ketua Umum
- PDF export

### 9.5 Update Dashboard
**File:** `resources/js/pages/Dashboard.tsx`

- Add "Approval RAPBS" tab in approval queue section
- Show count badge for pending RAPBS approvals

---

## PHASE 10: Permissions

### 10.1 Update `RoleAndPermissionSeeder`
**File:** `database/seeders/RoleAndPermissionSeeder.php`

New permission: `approve-rapbs`

Roles with `approve-rapbs`:
- Direktur
- Sekretariat
- Keuangan
- Sekretaris
- Ketua1 (Wakil Ketua)
- Ketum
- Bendahara

---

## Files Summary

### Backend - NEW (16 files):
1. `database/migrations/2026_02_10_000001_update_pkts_table_add_missing_columns.php`
2. `database/migrations/2026_02_10_000002_create_rapbs_table.php`
3. `database/migrations/2026_02_10_000003_create_rapbs_items_table.php`
4. `database/migrations/2026_02_10_000004_create_rapbs_approvals_table.php`
5. `database/migrations/2026_02_10_000005_update_apbs_table_add_pengesahan.php`
6. `database/migrations/2026_02_10_000006_create_apbs_items_table.php`
7. `database/migrations/2026_02_10_000007_create_activity_logs_table.php`
8. `app/Enums/RapbsStatus.php`
9. `app/Enums/RapbsApprovalStage.php`
10. `app/Models/Rapbs.php`
11. `app/Models/RapbsItem.php`
12. `app/Models/RapbsApproval.php`
13. `app/Models/ApbsItem.php`
14. `app/Models/ActivityLog.php`
15. `app/Services/RapbsApprovalService.php`
16. `app/Services/PktService.php`
17. `app/Http/Controllers/Api/V1/Budget/RapbsApprovalController.php`
18. `app/Http/Resources/RapbsResource.php`
19. `app/Http/Resources/RapbsItemResource.php`

### Backend - MODIFY (6 files):
1. `app/Models/Pkt.php` - Add new fields & relationships
2. `app/Models/Apbs.php` - Add new fields & relationships
3. `app/Http/Controllers/Api/V1/Planning/PktController.php` - Use service
4. `app/Http/Controllers/Api/V1/Budget/ApbsController.php` - Add pengesahan
5. `routes/api.php` - Add RAPBS approval routes
6. `database/seeders/RoleAndPermissionSeeder.php` - Add approve-rapbs permission

### Frontend - NEW (6 files):
1. `resources/js/services/rapbsApprovalService.ts`
2. `resources/js/hooks/useRapbsApproval.ts`
3. `resources/js/services/pktService.ts`
4. `resources/js/hooks/usePkt.ts`
5. `resources/js/pages/budget/rapbs/RapbsDetail.tsx`
6. `resources/js/pages/budget/rapbs/RapbsApprovalQueue.tsx`
7. `resources/js/pages/budget/apbs/ApbsPengesahan.tsx`

### Frontend - MODIFY (4 files):
1. `resources/js/types/enums.ts` - Add RAPBS enums
2. `resources/js/types/models.ts` - Add RAPBS interfaces
3. `resources/js/pages/planning/PktList.tsx` - Connect to real API
4. `resources/js/pages/Dashboard.tsx` - Add RAPBS approval tab

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     SIPAKAT WORKFLOW                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Strategy │───>│ Indikator│───>│  Proker  │───>│ Kegiatan │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │                                               │
     │              ┌────────────────────────────────┘
     │              │
     v              v
┌────────────────────────┐
│         PKT            │ <── Unit/Substansi creates
│  (Program Kerja        │
│   Tahunan)             │
└───────────┬────────────┘
            │
            │ Auto-generate
            v
┌────────────────────────┐
│        RAPBS           │
│ (Rencana Anggaran)     │
└───────────┬────────────┘
            │
            │ Submit for approval
            v
┌────────────────────────────────────────────────────────────┐
│                    APPROVAL FLOW                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│   UNIT submitter:                                          │
│   ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌────────┐  │
│   │Direktur │──>│Keuangan │──>│Sekretaris│──>│ Wakil  │  │
│   │Pendidikan│  │         │   │          │   │ Ketua  │  │
│   └─────────┘   └─────────┘   └──────────┘   └───┬────┘  │
│                                                   │       │
│   SUBSTANSI submitter:                            v       │
│   ┌──────────┐  ┌─────────┐   ┌──────────┐   ┌───────┐   │
│   │Sekretariat│─>│Keuangan │──>│Sekretaris│──>│ Ketum │   │
│   └──────────┘  └─────────┘   └──────────┘   └───┬───┘   │
│                                                   │       │
│                                                   v       │
│                                            ┌──────────┐   │
│                                            │Bendahara │   │
│                                            └────┬─────┘   │
└─────────────────────────────────────────────────┼─────────┘
                                                  │
                                                  │ Final approval
                                                  v
                                    ┌────────────────────────┐
                                    │         APBS           │
                                    │ (Anggaran Resmi)       │
                                    │                        │
                                    │ - Budget Aktif         │
                                    │ - Bisa untuk Pengajuan │
                                    └────────────────────────┘
```

---

## Verification Checklist

1. [ ] `php artisan migrate` - all migrations successful
2. [ ] `npm run build` - no TypeScript errors
3. [ ] Login as Unit → create PKT → auto appears in RAPBS
4. [ ] Submit RAPBS → appears in Direktur's approval queue
5. [ ] Direktur approve → moves to Keuangan
6. [ ] Keuangan approve → moves to Sekretaris
7. [ ] Continue through Wakil Ketua → Ketum → Bendahara
8. [ ] Bendahara approve → APBS generated
9. [ ] Test revision: approver revise → back to draft → edit → resubmit
10. [ ] Test rejection: workflow ends, status rejected
11. [ ] Login as Substansi → submit RAPBS → goes to Sekretariat (not Direktur)
12. [ ] APBS pengesahan page shows correct document format
13. [ ] Activity log shows all actions
