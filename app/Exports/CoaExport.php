<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\MataAnggaran;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CoaExport implements FromCollection, WithHeadings, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        protected ?int $unitId = null,
        protected ?string $tahun = null
    ) {}

    public function collection(): Collection
    {
        $query = MataAnggaran::with([
            'unit',
            'subMataAnggarans.detailMataAnggarans',
        ]);

        if ($this->unitId !== null) {
            $query->where('unit_id', $this->unitId);
        }

        if ($this->tahun !== null) {
            $query->where('tahun', $this->tahun);
        }

        $mataAnggarans = $query->orderBy('unit_id')->orderBy('kode')->get();

        $rows = collect();
        $no = 1;

        foreach ($mataAnggarans as $ma) {
            // Main row for Mata Anggaran
            $subTotal = $ma->subMataAnggarans
                ->flatMap->detailMataAnggarans
                ->sum('jumlah');

            $rows->push([
                'no' => $no++,
                'unit' => $ma->unit?->nama ?? '-',
                'kode_ma' => $ma->kode,
                'nama_ma' => $ma->nama,
                'jenis' => $ma->jenis ?? '-',
                'kode_sub' => '',
                'nama_sub' => '',
                'kode_detail' => '',
                'nama_detail' => '',
                'volume' => '',
                'satuan' => '',
                'harga_satuan' => '',
                'jumlah' => $subTotal,
            ]);

            // Sub Mata Anggaran rows
            foreach ($ma->subMataAnggarans as $sub) {
                $detailTotal = $sub->detailMataAnggarans->sum('jumlah');

                $rows->push([
                    'no' => '',
                    'unit' => '',
                    'kode_ma' => '',
                    'nama_ma' => '',
                    'jenis' => '',
                    'kode_sub' => $sub->kode,
                    'nama_sub' => $sub->nama,
                    'kode_detail' => '',
                    'nama_detail' => '',
                    'volume' => '',
                    'satuan' => '',
                    'harga_satuan' => '',
                    'jumlah' => $detailTotal,
                ]);

                // Detail Mata Anggaran rows
                foreach ($sub->detailMataAnggarans as $detail) {
                    $rows->push([
                        'no' => '',
                        'unit' => '',
                        'kode_ma' => '',
                        'nama_ma' => '',
                        'jenis' => '',
                        'kode_sub' => '',
                        'nama_sub' => '',
                        'kode_detail' => $detail->kode ?? '',
                        'nama_detail' => $detail->nama ?? '',
                        'volume' => $detail->volume ?? '',
                        'satuan' => $detail->satuan ?? '',
                        'harga_satuan' => $detail->harga_satuan ?? '',
                        'jumlah' => $detail->jumlah ?? 0,
                    ]);
                }
            }
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'No',
            'Unit',
            'Kode MA',
            'Nama Mata Anggaran',
            'Jenis',
            'Kode Sub',
            'Nama Sub Mata Anggaran',
            'Kode Detail',
            'Nama Detail',
            'Volume',
            'Satuan',
            'Harga Satuan',
            'Jumlah',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0'],
                ],
            ],
        ];
    }

    public function title(): string
    {
        return 'Chart of Accounts';
    }
}
