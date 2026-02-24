<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Indikator;
use App\Models\Strategy;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StrategySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $strategies = [
            [
                'kode' => 'S1',
                'nama' => 'Peningkatan Mutu Pendidikan',
                'indikators' => [
                    ['kode' => 'S1.I1', 'nama' => 'Rata-rata nilai ujian siswa meningkat 10%'],
                    ['kode' => 'S1.I2', 'nama' => 'Jumlah siswa berprestasi tingkat nasional'],
                    ['kode' => 'S1.I3', 'nama' => 'Tingkat kelulusan mencapai 100%'],
                ],
            ],
            [
                'kode' => 'S2',
                'nama' => 'Pengembangan Sumber Daya Manusia',
                'indikators' => [
                    ['kode' => 'S2.I1', 'nama' => 'Persentase guru bersertifikasi mencapai 90%'],
                    ['kode' => 'S2.I2', 'nama' => 'Jumlah pelatihan guru per tahun minimal 4 kali'],
                ],
            ],
            [
                'kode' => 'S3',
                'nama' => 'Peningkatan Sarana dan Prasarana',
                'indikators' => [
                    ['kode' => 'S3.I1', 'nama' => 'Rasio ruang kelas terhadap siswa memenuhi standar'],
                    ['kode' => 'S3.I2', 'nama' => 'Tingkat kelengkapan fasilitas laboratorium'],
                    ['kode' => 'S3.I3', 'nama' => 'Persentase peralatan IT yang berfungsi baik'],
                ],
            ],
            [
                'kode' => 'S4',
                'nama' => 'Penguatan Tata Kelola Keuangan',
                'indikators' => [
                    ['kode' => 'S4.I1', 'nama' => 'Laporan keuangan tepat waktu setiap bulan'],
                    ['kode' => 'S4.I2', 'nama' => 'Tingkat penyerapan anggaran mencapai 95%'],
                ],
            ],
            [
                'kode' => 'S5',
                'nama' => 'Pengembangan Kerjasama dan Hubungan Masyarakat',
                'indikators' => [
                    ['kode' => 'S5.I1', 'nama' => 'Jumlah MoU kerjasama baru per tahun'],
                    ['kode' => 'S5.I2', 'nama' => 'Tingkat kepuasan orang tua/wali murid'],
                ],
            ],
        ];

        foreach ($strategies as $strategyData) {
            $indikators = $strategyData['indikators'];
            unset($strategyData['indikators']);

            $strategy = Strategy::updateOrCreate(
                ['kode' => $strategyData['kode']],
                $strategyData,
            );

            foreach ($indikators as $indikatorData) {
                Indikator::updateOrCreate(
                    [
                        'strategy_id' => $strategy->id,
                        'kode' => $indikatorData['kode'],
                    ],
                    array_merge($indikatorData, ['strategy_id' => $strategy->id]),
                );
            }
        }
    }
}
