<?php

declare(strict_types=1);

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class KegiatanImportTemplate implements FromArray, WithHeadings, WithStyles, ShouldAutoSize, WithColumnFormatting
{
    public function array(): array
    {
        return [
            ['1', '1.1', '1.1.1', '1.1.1.1', 'Contoh Kegiatan', 'non-unggulan'],
        ];
    }

    public function headings(): array
    {
        return [
            'Kode Strategi',
            'Kode Indikator',
            'Kode Proker',
            'Kode Kegiatan',
            'Nama Kegiatan',
            'Jenis Kegiatan',
        ];
    }

    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_TEXT,
            'B' => NumberFormat::FORMAT_TEXT,
            'C' => NumberFormat::FORMAT_TEXT,
            'D' => NumberFormat::FORMAT_TEXT,
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        // Force kode sample values as explicit text strings (prevents 1.1 → float)
        $sheet->getCell('A2')->setValueExplicit('1', DataType::TYPE_STRING);
        $sheet->getCell('B2')->setValueExplicit('1.1', DataType::TYPE_STRING);
        $sheet->getCell('C2')->setValueExplicit('1.1.1', DataType::TYPE_STRING);
        $sheet->getCell('D2')->setValueExplicit('1.1.1.1', DataType::TYPE_STRING);

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
