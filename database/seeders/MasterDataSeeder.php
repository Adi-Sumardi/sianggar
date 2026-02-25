<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DetailMataAnggaran;
use App\Models\Indikator;
use App\Models\Kegiatan;
use App\Models\MataAnggaran;
use App\Models\Proker;
use App\Models\Strategy;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    private string $tahun = '2026/2027';

    /**
     * 15 additional Mata Anggaran (MA-06..MA-20) to complement existing 5 from MataAnggaranSeeder.
     * Each has 1-2 SubMA, each SubMA has 1 DetailMA.
     */
    private array $additionalMaTemplate = [
        [
            'kode' => 'MA-06',
            'nama' => 'Belanja Sosial & Kemasyarakatan',
            'subs' => [
                ['kode' => 'MA-06.01', 'nama' => 'Bantuan Sosial Siswa', 'anggaran' => 8_000_000],
                ['kode' => 'MA-06.02', 'nama' => 'Kegiatan Bakti Sosial', 'anggaran' => 5_000_000],
            ],
        ],
        [
            'kode' => 'MA-07',
            'nama' => 'Belanja Pengembangan Kurikulum',
            'subs' => [
                ['kode' => 'MA-07.01', 'nama' => 'Pengembangan Silabus', 'anggaran' => 6_000_000],
            ],
        ],
        [
            'kode' => 'MA-08',
            'nama' => 'Belanja Kesehatan & Kebersihan',
            'subs' => [
                ['kode' => 'MA-08.01', 'nama' => 'Obat & P3K', 'anggaran' => 3_000_000],
                ['kode' => 'MA-08.02', 'nama' => 'Alat Kebersihan', 'anggaran' => 4_000_000],
            ],
        ],
        [
            'kode' => 'MA-09',
            'nama' => 'Belanja Keamanan & Ketertiban',
            'subs' => [
                ['kode' => 'MA-09.01', 'nama' => 'Jasa Keamanan', 'anggaran' => 12_000_000],
            ],
        ],
        [
            'kode' => 'MA-10',
            'nama' => 'Belanja Publikasi & Promosi',
            'subs' => [
                ['kode' => 'MA-10.01', 'nama' => 'Cetak Brosur & Poster', 'anggaran' => 3_000_000],
                ['kode' => 'MA-10.02', 'nama' => 'Iklan Digital', 'anggaran' => 5_000_000],
            ],
        ],
        [
            'kode' => 'MA-11',
            'nama' => 'Belanja Riset & Pengembangan',
            'subs' => [
                ['kode' => 'MA-11.01', 'nama' => 'Riset Pendidikan', 'anggaran' => 10_000_000],
            ],
        ],
        [
            'kode' => 'MA-12',
            'nama' => 'Belanja Teknologi Informasi',
            'subs' => [
                ['kode' => 'MA-12.01', 'nama' => 'Software & Lisensi', 'anggaran' => 8_000_000],
                ['kode' => 'MA-12.02', 'nama' => 'Internet & Jaringan', 'anggaran' => 6_000_000],
            ],
        ],
        [
            'kode' => 'MA-13',
            'nama' => 'Belanja Perpustakaan',
            'subs' => [
                ['kode' => 'MA-13.01', 'nama' => 'Pengadaan Buku', 'anggaran' => 10_000_000],
            ],
        ],
        [
            'kode' => 'MA-14',
            'nama' => 'Belanja Olahraga & Seni',
            'subs' => [
                ['kode' => 'MA-14.01', 'nama' => 'Peralatan Olahraga', 'anggaran' => 7_000_000],
                ['kode' => 'MA-14.02', 'nama' => 'Peralatan Kesenian', 'anggaran' => 5_000_000],
            ],
        ],
        [
            'kode' => 'MA-15',
            'nama' => 'Belanja Keasramaan',
            'subs' => [
                ['kode' => 'MA-15.01', 'nama' => 'Perlengkapan Asrama', 'anggaran' => 9_000_000],
            ],
        ],
        [
            'kode' => 'MA-16',
            'nama' => 'Belanja Pelatihan & Sertifikasi',
            'subs' => [
                ['kode' => 'MA-16.01', 'nama' => 'Biaya Sertifikasi', 'anggaran' => 6_000_000],
                ['kode' => 'MA-16.02', 'nama' => 'Biaya Pelatihan Eksternal', 'anggaran' => 8_000_000],
            ],
        ],
        [
            'kode' => 'MA-17',
            'nama' => 'Belanja Perjalanan Dinas',
            'subs' => [
                ['kode' => 'MA-17.01', 'nama' => 'Perjalanan Dalam Kota', 'anggaran' => 5_000_000],
            ],
        ],
        [
            'kode' => 'MA-18',
            'nama' => 'Belanja Asuransi & Jaminan',
            'subs' => [
                ['kode' => 'MA-18.01', 'nama' => 'Asuransi Gedung', 'anggaran' => 10_000_000],
            ],
        ],
        [
            'kode' => 'MA-19',
            'nama' => 'Belanja Upacara & Keagamaan',
            'subs' => [
                ['kode' => 'MA-19.01', 'nama' => 'Kegiatan Keagamaan', 'anggaran' => 6_000_000],
                ['kode' => 'MA-19.02', 'nama' => 'Peringatan Hari Besar Islam', 'anggaran' => 4_000_000],
            ],
        ],
        [
            'kode' => 'MA-20',
            'nama' => 'Belanja Lain-Lain',
            'subs' => [
                ['kode' => 'MA-20.01', 'nama' => 'Pengeluaran Tak Terduga', 'anggaran' => 5_000_000],
            ],
        ],
    ];

    /**
     * 20 Proker templates mapped to 5 strategies (4 per strategy).
     */
    private array $prokerTemplate = [
        // S1: Peningkatan Mutu Pendidikan (4 prokers)
        ['strategy' => 'S1', 'indikator' => 'S1.I1', 'kode' => 'PK-01', 'nama' => 'Peningkatan Kualitas Pembelajaran'],
        ['strategy' => 'S1', 'indikator' => 'S1.I2', 'kode' => 'PK-02', 'nama' => 'Program Remedial dan Pengayaan'],
        ['strategy' => 'S1', 'indikator' => 'S1.I3', 'kode' => 'PK-03', 'nama' => 'Pengembangan Metode Ajar Inovatif'],
        ['strategy' => 'S1', 'indikator' => 'S1.I1', 'kode' => 'PK-04', 'nama' => 'Program Tahfidz Al-Quran'],
        // S2: Pengembangan SDM (4 prokers)
        ['strategy' => 'S2', 'indikator' => 'S2.I1', 'kode' => 'PK-05', 'nama' => 'Peningkatan Kompetensi Guru'],
        ['strategy' => 'S2', 'indikator' => 'S2.I2', 'kode' => 'PK-06', 'nama' => 'Program Mentoring Guru'],
        ['strategy' => 'S2', 'indikator' => 'S2.I1', 'kode' => 'PK-07', 'nama' => 'Workshop dan Seminar Internal'],
        ['strategy' => 'S2', 'indikator' => 'S2.I2', 'kode' => 'PK-08', 'nama' => 'Program Sertifikasi Profesi'],
        // S3: Peningkatan Sarana Prasarana (4 prokers)
        ['strategy' => 'S3', 'indikator' => 'S3.I1', 'kode' => 'PK-09', 'nama' => 'Pemeliharaan Gedung dan Fasilitas'],
        ['strategy' => 'S3', 'indikator' => 'S3.I2', 'kode' => 'PK-10', 'nama' => 'Pengadaan Sarana Belajar'],
        ['strategy' => 'S3', 'indikator' => 'S3.I3', 'kode' => 'PK-11', 'nama' => 'Pengembangan Lab dan Perpustakaan'],
        ['strategy' => 'S3', 'indikator' => 'S3.I1', 'kode' => 'PK-12', 'nama' => 'Pengelolaan IT dan Teknologi'],
        // S4: Penguatan Tata Kelola Keuangan (4 prokers)
        ['strategy' => 'S4', 'indikator' => 'S4.I1', 'kode' => 'PK-13', 'nama' => 'Pengelolaan Anggaran Tahunan'],
        ['strategy' => 'S4', 'indikator' => 'S4.I2', 'kode' => 'PK-14', 'nama' => 'Audit dan Monitoring Keuangan'],
        ['strategy' => 'S4', 'indikator' => 'S4.I1', 'kode' => 'PK-15', 'nama' => 'Optimalisasi Penerimaan'],
        ['strategy' => 'S4', 'indikator' => 'S4.I2', 'kode' => 'PK-16', 'nama' => 'Pengelolaan Dana BOS/BOP'],
        // S5: Kerjasama & Humas (4 prokers)
        ['strategy' => 'S5', 'indikator' => 'S5.I1', 'kode' => 'PK-17', 'nama' => 'Kerjasama dengan Industri'],
        ['strategy' => 'S5', 'indikator' => 'S5.I2', 'kode' => 'PK-18', 'nama' => 'Program Keterlibatan Orang Tua'],
        ['strategy' => 'S5', 'indikator' => 'S5.I1', 'kode' => 'PK-19', 'nama' => 'Kegiatan Bakti Sosial Masyarakat'],
        ['strategy' => 'S5', 'indikator' => 'S5.I2', 'kode' => 'PK-20', 'nama' => 'Hubungan Masyarakat dan Promosi'],
    ];

    /**
     * 20 Kegiatan templates (1 per proker).
     */
    private array $kegiatanTemplate = [
        ['proker_kode' => 'PK-01', 'kode' => 'KG-01', 'nama' => 'Supervisi dan Evaluasi Guru', 'jenis' => 'unggulan'],
        ['proker_kode' => 'PK-02', 'kode' => 'KG-02', 'nama' => 'Kelas Remedial Semester', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-03', 'kode' => 'KG-03', 'nama' => 'Pelatihan Pembelajaran Berbasis Proyek', 'jenis' => 'unggulan'],
        ['proker_kode' => 'PK-04', 'kode' => 'KG-04', 'nama' => 'Kegiatan Tahfidz Harian', 'jenis' => 'unggulan'],
        ['proker_kode' => 'PK-05', 'kode' => 'KG-05', 'nama' => 'Pelatihan Kurikulum Nasional', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-06', 'kode' => 'KG-06', 'nama' => 'Mentoring Guru Muda', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-07', 'kode' => 'KG-07', 'nama' => 'Seminar Pendidikan Semester', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-08', 'kode' => 'KG-08', 'nama' => 'Ujian Sertifikasi Kompetensi', 'jenis' => 'unggulan'],
        ['proker_kode' => 'PK-09', 'kode' => 'KG-09', 'nama' => 'Perawatan Gedung Rutin', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-10', 'kode' => 'KG-10', 'nama' => 'Pengadaan Meja dan Kursi', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-11', 'kode' => 'KG-11', 'nama' => 'Renovasi Perpustakaan', 'jenis' => 'unggulan'],
        ['proker_kode' => 'PK-12', 'kode' => 'KG-12', 'nama' => 'Upgrade Jaringan Komputer', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-13', 'kode' => 'KG-13', 'nama' => 'Penyusunan RKA Tahunan', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-14', 'kode' => 'KG-14', 'nama' => 'Audit Internal Keuangan', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-15', 'kode' => 'KG-15', 'nama' => 'Penagihan SPP Tertunggak', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-16', 'kode' => 'KG-16', 'nama' => 'Penyusunan Laporan Dana BOS', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-17', 'kode' => 'KG-17', 'nama' => 'MoU dengan Perusahaan Mitra', 'jenis' => 'unggulan'],
        ['proker_kode' => 'PK-18', 'kode' => 'KG-18', 'nama' => 'Pertemuan Wali Murid Semester', 'jenis' => 'non-unggulan'],
        ['proker_kode' => 'PK-19', 'kode' => 'KG-19', 'nama' => 'Bakti Sosial Ramadhan', 'jenis' => 'unggulan'],
        ['proker_kode' => 'PK-20', 'kode' => 'KG-20', 'nama' => 'Open House dan Pameran Sekolah', 'jenis' => 'unggulan'],
    ];

    public function run(): void
    {
        $units = Unit::all();
        $strategies = Strategy::all()->keyBy('kode');
        $indikators = Indikator::all()->keyBy('kode');

        foreach ($units as $unit) {
            // 1. Additional Mata Anggaran (15 new → total ~20 per unit)
            $this->seedAdditionalMataAnggaran($unit);

            // 2. Proker (20 per unit)
            $prokerMap = $this->seedProkers($unit, $strategies, $indikators);

            // 3. Kegiatan (20 per unit, linked to prokers)
            $this->seedKegiatans($unit, $prokerMap, $strategies, $indikators);
        }
    }

    // =========================================================================
    // Mata Anggaran + SubMA + DetailMA
    // =========================================================================

    private function seedAdditionalMataAnggaran(Unit $unit): array
    {
        $maMap = [];

        foreach ($this->additionalMaTemplate as $maData) {
            $kode = "{$unit->kode}.{$maData['kode']}";

            $ma = MataAnggaran::updateOrCreate(
                ['unit_id' => $unit->id, 'kode' => $kode, 'tahun' => $this->tahun],
                ['nama' => $maData['nama']],
            );

            foreach ($maData['subs'] as $subData) {
                $subKode = "{$unit->kode}.{$subData['kode']}";

                $sub = SubMataAnggaran::updateOrCreate(
                    ['mata_anggaran_id' => $ma->id, 'unit_id' => $unit->id, 'kode' => $subKode],
                    ['nama' => $subData['nama']],
                );

                $dma = DetailMataAnggaran::updateOrCreate(
                    [
                        'mata_anggaran_id' => $ma->id,
                        'sub_mata_anggaran_id' => $sub->id,
                        'unit_id' => $unit->id,
                        'tahun' => $this->tahun,
                    ],
                    [
                        'anggaran_awal' => $subData['anggaran'],
                        'balance' => $subData['anggaran'],
                        'saldo_dipakai' => 0,
                        'realisasi_year' => 0,
                    ],
                );

                $maMap[$maData['kode']] = [
                    'ma' => $ma,
                    'sub' => $sub,
                    'dma' => $dma,
                ];
            }
        }

        return $maMap;
    }

    // =========================================================================
    // Proker
    // =========================================================================

    private function seedProkers(Unit $unit, $strategies, $indikators): array
    {
        $prokerMap = [];

        foreach ($this->prokerTemplate as $tpl) {
            $strategy = $strategies->get($tpl['strategy']);
            $indikator = $indikators->get($tpl['indikator']);
            if (! $strategy || ! $indikator) {
                continue;
            }

            $kode = "{$unit->kode}.{$tpl['kode']}";

            $proker = Proker::updateOrCreate(
                ['unit_id' => $unit->id, 'kode' => $kode],
                [
                    'strategy_id' => $strategy->id,
                    'indikator_id' => $indikator->id,
                    'nama' => $tpl['nama'],
                ],
            );

            $prokerMap[$tpl['kode']] = $proker;
        }

        return $prokerMap;
    }

    // =========================================================================
    // Kegiatan
    // =========================================================================

    private function seedKegiatans(Unit $unit, array $prokerMap, $strategies, $indikators): array
    {
        $kegiatanMap = [];

        foreach ($this->kegiatanTemplate as $tpl) {
            $proker = $prokerMap[$tpl['proker_kode']] ?? null;
            if (! $proker) {
                continue;
            }

            $kode = "{$unit->kode}.{$tpl['kode']}";

            $kegiatan = Kegiatan::updateOrCreate(
                ['proker_id' => $proker->id, 'unit_id' => $unit->id, 'kode' => $kode],
                [
                    'strategy_id' => $proker->strategy_id,
                    'indikator_id' => $proker->indikator_id,
                    'nama' => $tpl['nama'],
                    'jenis_kegiatan' => $tpl['jenis'],
                ],
            );

            $kegiatanMap[$tpl['kode']] = $kegiatan;
        }

        return $kegiatanMap;
    }

}
