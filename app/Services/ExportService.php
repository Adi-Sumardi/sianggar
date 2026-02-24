<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PengajuanAnggaran;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExportService
{
    public function __construct(
        private readonly ReportService $reportService,
    ) {}

    /**
     * Export pengajuan list to Excel based on filters
     *
     * @param array{
     *     unit?: string,
     *     tahun?: string,
     *     status?: string,
     *     tanggal_dari?: string,
     *     tanggal_sampai?: string,
     * } $filters
     *
     * @return string File path relative to storage
     */
    public function exportPengajuanExcel(array $filters): string
    {
        $data = $this->reportService->getLaporanPengajuan($filters);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Pengajuan');

        // Header styling
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2E86C1']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];

        // Title row
        $sheet->mergeCells('A1:H1');
        $sheet->setCellValue('A1', 'LAPORAN PENGAJUAN ANGGARAN');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Filter info row
        $filterInfo = 'Tahun: ' . ($filters['tahun'] ?? 'Semua');
        if (!empty($filters['unit'])) {
            $filterInfo .= ' | Unit: ' . $filters['unit'];
        }
        if (!empty($filters['status'])) {
            $filterInfo .= ' | Status: ' . $filters['status'];
        }
        $sheet->mergeCells('A2:H2');
        $sheet->setCellValue('A2', $filterInfo);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Headers
        $headers = ['No', 'No. Surat', 'Tanggal', 'Unit', 'Perihal', 'Jumlah (Rp)', 'Status', 'Tahap Approval'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '4', $header);
            $col++;
        }
        $sheet->getStyle('A4:H4')->applyFromArray($headerStyle);

        // Data rows
        $row = 5;
        $no = 1;
        foreach ($data as $pengajuan) {
            $sheet->setCellValue('A' . $row, $no);
            $sheet->setCellValue('B' . $row, $pengajuan->no_surat ?? '-');
            $sheet->setCellValue('C' . $row, $pengajuan->tanggal ?? '-');
            $sheet->setCellValue('D' . $row, $pengajuan->unit ?? '-');
            $sheet->setCellValue('E' . $row, $pengajuan->perihal ?? '-');
            $sheet->setCellValue('F' . $row, $pengajuan->total_jumlah ?? 0);
            $sheet->setCellValue('G' . $row, $pengajuan->status_proses ?? '-');
            $sheet->setCellValue('H' . $row, $pengajuan->current_approval_stage ?? 'Selesai');

            // Number format for currency
            $sheet->getStyle('F' . $row)->getNumberFormat()->setFormatCode('#,##0');

            $row++;
            $no++;
        }

        // Data borders
        $dataStyle = ['borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]];
        $sheet->getStyle('A4:H' . ($row - 1))->applyFromArray($dataStyle);

        // Auto-size columns
        foreach (range('A', 'H') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }

        // Write to storage
        $filename = 'exports/pengajuan_' . now()->format('Y-m-d_His') . '.xlsx';
        $fullPath = storage_path('app/' . $filename);

        // Ensure directory exists
        $directory = dirname($fullPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $writer = new Xlsx($spreadsheet);
        $writer->save($fullPath);

        return $filename;
    }

    /**
     * Export cawu report to Excel for a specific unit
     *
     * @return string File path relative to storage
     */
    public function exportLaporanCawuExcel(string $unit, string $tahun): string
    {
        $spreadsheet = new Spreadsheet();

        // Create a sheet for each cawu period
        for ($cawu = 1; $cawu <= 3; $cawu++) {
            $report = $this->reportService->getLaporanCawu($unit, $tahun, $cawu);

            if ($cawu > 1) {
                $spreadsheet->createSheet();
            }
            $sheet = $spreadsheet->setActiveSheetIndex($cawu - 1);
            $sheet->setTitle("Cawu {$cawu}");

            // Header styling
            $headerStyle = [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '27AE60']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ];

            // Title
            $sheet->mergeCells('A1:G1');
            $sheet->setCellValue('A1', "LAPORAN CAWU {$cawu} - {$report['periode']}");
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->mergeCells('A2:G2');
            $sheet->setCellValue('A2', "Unit: {$unit} | Tahun Anggaran: {$tahun}");
            $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Column headers
            $headers = ['No', 'Kode', 'Mata Anggaran', 'Anggaran (Rp)', 'Pengajuan (Rp)', 'Realisasi (Rp)', 'Sisa (Rp)'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet->setCellValue($col . '4', $header);
                $col++;
            }
            $sheet->getStyle('A4:G4')->applyFromArray($headerStyle);

            // Data rows
            $row = 5;
            $no = 1;
            foreach ($report['items'] as $item) {
                $sheet->setCellValue('A' . $row, $no);
                $sheet->setCellValue('B' . $row, $item['kode']);
                $sheet->setCellValue('C' . $row, $item['mata_anggaran']);
                $sheet->setCellValue('D' . $row, $item['anggaran']);
                $sheet->setCellValue('E' . $row, $item['pengajuan']);
                $sheet->setCellValue('F' . $row, $item['realisasi']);
                $sheet->setCellValue('G' . $row, $item['sisa']);

                // Number format for currency columns
                foreach (['D', 'E', 'F', 'G'] as $currCol) {
                    $sheet->getStyle($currCol . $row)->getNumberFormat()->setFormatCode('#,##0');
                }

                $row++;
                $no++;
            }

            // Summary row
            $summaryStyle = [
                'font' => ['bold' => true],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F2F3F4']],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
            ];

            $sheet->mergeCells('A' . $row . ':C' . $row);
            $sheet->setCellValue('A' . $row, 'TOTAL');
            $sheet->setCellValue('D' . $row, $report['summary']['total_anggaran']);
            $sheet->setCellValue('E' . $row, $report['summary']['total_pengajuan']);
            $sheet->setCellValue('F' . $row, $report['summary']['total_realisasi']);
            $sheet->setCellValue('G' . $row, $report['summary']['total_sisa']);
            $sheet->getStyle('A' . $row . ':G' . $row)->applyFromArray($summaryStyle);

            foreach (['D', 'E', 'F', 'G'] as $currCol) {
                $sheet->getStyle($currCol . $row)->getNumberFormat()->setFormatCode('#,##0');
            }

            // Data borders
            $dataStyle = ['borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]]];
            $sheet->getStyle('A4:G' . $row)->applyFromArray($dataStyle);

            // Persentase realisasi
            $row += 2;
            $sheet->setCellValue('A' . $row, 'Persentase Realisasi: ' . $report['summary']['persentase_realisasi'] . '%');
            $sheet->getStyle('A' . $row)->getFont()->setBold(true);

            // Auto-size columns
            foreach (range('A', 'G') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
        }

        // Set first sheet as active
        $spreadsheet->setActiveSheetIndex(0);

        // Write to storage
        $filename = 'exports/laporan_cawu_' . $unit . '_' . $tahun . '_' . now()->format('Y-m-d_His') . '.xlsx';
        $fullPath = storage_path('app/' . $filename);

        $directory = dirname($fullPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $writer = new Xlsx($spreadsheet);
        $writer->save($fullPath);

        return $filename;
    }

    /**
     * Export a single pengajuan to PDF
     *
     * @return string File path relative to storage
     */
    public function exportPengajuanPdf(PengajuanAnggaran $pengajuan): string
    {
        $pengajuan->load(['details.detailMataAnggaran', 'details.mataAnggaran', 'approvals.approver', 'creator']);

        $data = [
            'pengajuan' => $pengajuan,
            'details' => $pengajuan->details,
            'approvals' => $pengajuan->approvals()->orderBy('stage_order')->get(),
            'total_jumlah' => $pengajuan->total_jumlah,
            'terbilang' => $this->terbilang((float) $pengajuan->total_jumlah),
            'tanggal_cetak' => now()->translatedFormat('d F Y'),
        ];

        $pdf = Pdf::loadView('exports.pengajuan-pdf', $data);
        $pdf->setPaper('A4', 'portrait');

        $filename = 'exports/pengajuan_' . ($pengajuan->no_surat ? str_replace('/', '-', $pengajuan->no_surat) : $pengajuan->id) . '.pdf';
        $fullPath = storage_path('app/' . $filename);

        $directory = dirname($fullPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $pdf->save($fullPath);

        return $filename;
    }

    /**
     * Convert a number to Indonesian words (terbilang)
     */
    private function terbilang(float $angka): string
    {
        $angka = abs($angka);
        $huruf = [
            '', 'satu', 'dua', 'tiga', 'empat', 'lima',
            'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas',
        ];

        if ($angka < 12) {
            return ' ' . $huruf[(int) $angka];
        }

        if ($angka < 20) {
            return $this->terbilang($angka - 10) . ' belas';
        }

        if ($angka < 100) {
            return $this->terbilang($angka / 10) . ' puluh' . $this->terbilang(fmod($angka, 10));
        }

        if ($angka < 200) {
            return ' seratus' . $this->terbilang($angka - 100);
        }

        if ($angka < 1000) {
            return $this->terbilang($angka / 100) . ' ratus' . $this->terbilang(fmod($angka, 100));
        }

        if ($angka < 2000) {
            return ' seribu' . $this->terbilang($angka - 1000);
        }

        if ($angka < 1000000) {
            return $this->terbilang($angka / 1000) . ' ribu' . $this->terbilang(fmod($angka, 1000));
        }

        if ($angka < 1000000000) {
            return $this->terbilang($angka / 1000000) . ' juta' . $this->terbilang(fmod($angka, 1000000));
        }

        if ($angka < 1000000000000) {
            return $this->terbilang($angka / 1000000000) . ' milyar' . $this->terbilang(fmod($angka, 1000000000));
        }

        if ($angka < 1000000000000000) {
            return $this->terbilang($angka / 1000000000000) . ' triliun' . $this->terbilang(fmod($angka, 1000000000000));
        }

        return '';
    }
}
