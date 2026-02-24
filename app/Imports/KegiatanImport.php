<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\Indikator;
use App\Models\Kegiatan;
use App\Models\Proker;
use App\Models\Strategy;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class KegiatanImport implements ToCollection, WithHeadingRow
{
    protected int $imported = 0;

    /** @var list<string> */
    protected array $errors = [];

    public function __construct(
        protected ?int $unitId,
    ) {}

    public function collection(Collection $rows): void
    {
        $seenKodes = [];

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2;

            $kodeStrategi = trim((string) ($row['kode_strategi'] ?? ''));
            $kodeIndikator = trim((string) ($row['kode_indikator'] ?? ''));
            $kodeProker = trim((string) ($row['kode_proker'] ?? ''));
            $kodeKegiatan = trim((string) ($row['kode_kegiatan'] ?? ''));
            $namaKegiatan = trim((string) ($row['nama_kegiatan'] ?? ''));
            $jenisKegiatan = strtolower(trim((string) ($row['jenis_kegiatan'] ?? ''))) ?: 'non-unggulan';
            $keterangan = trim((string) ($row['keterangan'] ?? '')) ?: null;

            // Required fields
            if ($kodeStrategi === '' || $kodeIndikator === '' || $kodeProker === '' || $kodeKegiatan === '' || $namaKegiatan === '') {
                $this->errors[] = "Baris {$rowNum}: Kode Strategi, Kode Indikator, Kode Proker, Kode Kegiatan, dan Nama Kegiatan wajib diisi.";

                continue;
            }

            // Validate jenis_kegiatan
            if (! in_array($jenisKegiatan, ['unggulan', 'non-unggulan'], true)) {
                $this->errors[] = "Baris {$rowNum}: Jenis kegiatan harus 'unggulan' atau 'non-unggulan', diterima: '{$jenisKegiatan}'.";

                continue;
            }

            // Lookup strategy
            $strategy = Strategy::where('kode', $kodeStrategi)->first();
            if (! $strategy) {
                $this->errors[] = "Baris {$rowNum}: Kode strategi '{$kodeStrategi}' tidak ditemukan.";

                continue;
            }

            // Lookup indikator (must belong to the strategy)
            $indikator = Indikator::where('kode', $kodeIndikator)
                ->where('strategy_id', $strategy->id)
                ->first();
            if (! $indikator) {
                $this->errors[] = "Baris {$rowNum}: Kode indikator '{$kodeIndikator}' tidak ditemukan di strategi '{$kodeStrategi}'.";

                continue;
            }

            // Lookup proker (must belong to this user's unit)
            $proker = Proker::where('kode', $kodeProker)
                ->where('unit_id', $this->unitId)
                ->first();
            if (! $proker) {
                $this->errors[] = "Baris {$rowNum}: Kode proker '{$kodeProker}' tidak ditemukan di unit Anda.";

                continue;
            }

            // Check duplicate in DB (kode unique per unit_id)
            $existsInDb = Kegiatan::where('kode', $kodeKegiatan)
                ->where('unit_id', $this->unitId)
                ->exists();
            if ($existsInDb) {
                $this->errors[] = "Baris {$rowNum}: Kode kegiatan '{$kodeKegiatan}' sudah ada di unit Anda. Gunakan kode lain.";

                continue;
            }

            // Check duplicate within file itself
            if (in_array($kodeKegiatan, $seenKodes, true)) {
                $this->errors[] = "Baris {$rowNum}: Kode kegiatan '{$kodeKegiatan}' duplikat dalam file ini.";

                continue;
            }
            $seenKodes[] = $kodeKegiatan;

            Kegiatan::create([
                'strategy_id' => $strategy->id,
                'indikator_id' => $indikator->id,
                'proker_id' => $proker->id,
                'unit_id' => $this->unitId,
                'kode' => $kodeKegiatan,
                'nama' => $namaKegiatan,
                'jenis_kegiatan' => $jenisKegiatan,
                'keterangan' => $keterangan,
            ]);

            $this->imported++;
        }
    }

    public function getImportedCount(): int
    {
        return $this->imported;
    }

    /** @return list<string> */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
