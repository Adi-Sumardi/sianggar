<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\Indikator;
use App\Models\Proker;
use App\Models\Strategy;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProkerImport implements ToCollection, WithHeadingRow
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
            $rowNum = $index + 2; // heading row + 0-indexed

            $kodeStrategi = str_replace(',', '.', trim((string) ($row['kode_strategi'] ?? '')));
            $kodeIndikator = str_replace(',', '.', trim((string) ($row['kode_indikator'] ?? '')));
            $kodeProker = str_replace(',', '.', trim((string) ($row['kode_proker'] ?? '')));
            $namaProker = trim((string) ($row['nama_proker'] ?? ''));

            // Required fields
            if ($kodeStrategi === '' || $kodeIndikator === '' || $kodeProker === '' || $namaProker === '') {
                $this->errors[] = "Baris {$rowNum}: Kode Strategi, Kode Indikator, Kode Proker, dan Nama Proker wajib diisi.";

                continue;
            }

            // Validate kode length
            if (mb_strlen($kodeProker) > 255) {
                $this->errors[] = "Baris {$rowNum}: Kode proker terlalu panjang (maks 255 karakter).";

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

            // Check duplicate in DB (kode unique per unit_id)
            $existsInDb = Proker::where('kode', $kodeProker)
                ->where('unit_id', $this->unitId)
                ->exists();
            if ($existsInDb) {
                $this->errors[] = "Baris {$rowNum}: Kode proker '{$kodeProker}' sudah ada di unit Anda. Gunakan kode lain.";

                continue;
            }

            // Check duplicate within file itself
            if (in_array($kodeProker, $seenKodes, true)) {
                $this->errors[] = "Baris {$rowNum}: Kode proker '{$kodeProker}' duplikat dalam file ini.";

                continue;
            }
            $seenKodes[] = $kodeProker;

            Proker::create([
                'strategy_id' => $strategy->id,
                'indikator_id' => $indikator->id,
                'unit_id' => $this->unitId,
                'kode' => $kodeProker,
                'nama' => $namaProker,
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
