<?php

declare(strict_types=1);

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProkerImportTemplate implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithColumnFormatting
{
    public function array(): array
    {
        return [
            ['1', '1.1', '1.1.1', 'Contoh Program Kerja', 'Keterangan opsional'],
        ];
    }

    public function headings(): array
    {
        return [
            'Kode Strategi',
            'Kode Indikator',
            'Kode Proker',
            'Nama Proker',
            'Keterangan',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_TEXT,
            'B' => NumberFormat::FORMAT_TEXT,
            'C' => NumberFormat::FORMAT_TEXT,
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
}
