<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\DetailMataAnggaran;
use App\Models\MataAnggaran;
use App\Models\SubMataAnggaran;
use App\Models\Unit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MataAnggaranSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tahun = '2025/2026';
        $units = Unit::all();

        // ---------------------------------------------------------------
        // Define the mata anggaran structure (shared across units)
        // ---------------------------------------------------------------
        $mataAnggaranTemplate = [
            [
                'kode' => 'MA-01',
                'nama' => 'Belanja Pegawai',
                'subs' => [
                    [
                        'kode' => 'MA-01.01',
                        'nama' => 'Gaji & Tunjangan',
                        'details' => [
                            ['anggaran' => 120000000],
                            ['anggaran' => 36000000],
                        ],
                    ],
                    [
                        'kode' => 'MA-01.02',
                        'nama' => 'Honorarium',
                        'details' => [
                            ['anggaran' => 24000000],
                        ],
                    ],
                ],
            ],
            [
                'kode' => 'MA-02',
                'nama' => 'Belanja Barang & Jasa',
                'subs' => [
                    [
                        'kode' => 'MA-02.01',
                        'nama' => 'Alat Tulis Kantor',
                        'details' => [
                            ['anggaran' => 6000000],
                        ],
                    ],
                    [
                        'kode' => 'MA-02.02',
                        'nama' => 'Bahan Habis Pakai',
                        'details' => [
                            ['anggaran' => 4800000],
                        ],
                    ],
                    [
                        'kode' => 'MA-02.03',
                        'nama' => 'Pemeliharaan & Perbaikan',
                        'details' => [
                            ['anggaran' => 18000000],
                        ],
                    ],
                ],
            ],
            [
                'kode' => 'MA-03',
                'nama' => 'Belanja Kegiatan Pembelajaran',
                'subs' => [
                    [
                        'kode' => 'MA-03.01',
                        'nama' => 'Buku & Referensi',
                        'details' => [
                            ['anggaran' => 12000000],
                        ],
                    ],
                    [
                        'kode' => 'MA-03.02',
                        'nama' => 'Media Pembelajaran',
                        'details' => [
                            ['anggaran' => 9600000],
                        ],
                    ],
                    [
                        'kode' => 'MA-03.03',
                        'nama' => 'Kegiatan Ekstrakurikuler',
                        'details' => [
                            ['anggaran' => 7200000],
                        ],
                    ],
                ],
            ],
            [
                'kode' => 'MA-04',
                'nama' => 'Belanja Modal',
                'subs' => [
                    [
                        'kode' => 'MA-04.01',
                        'nama' => 'Peralatan & Mesin',
                        'details' => [
                            ['anggaran' => 24000000],
                        ],
                    ],
                    [
                        'kode' => 'MA-04.02',
                        'nama' => 'Peralatan IT',
                        'details' => [
                            ['anggaran' => 18000000],
                        ],
                    ],
                ],
            ],
            [
                'kode' => 'MA-05',
                'nama' => 'Belanja Operasional',
                'subs' => [
                    [
                        'kode' => 'MA-05.01',
                        'nama' => 'Listrik, Air & Telepon',
                        'details' => [
                            ['anggaran' => 14400000],
                        ],
                    ],
                    [
                        'kode' => 'MA-05.02',
                        'nama' => 'Transportasi & Perjalanan Dinas',
                        'details' => [
                            ['anggaran' => 9600000],
                        ],
                    ],
                    [
                        'kode' => 'MA-05.03',
                        'nama' => 'Konsumsi & Rapat',
                        'details' => [
                            ['anggaran' => 6000000],
                        ],
                    ],
                ],
            ],
        ];

        // ---------------------------------------------------------------
        // Create mata anggaran for each unit
        // ---------------------------------------------------------------
        foreach ($units as $unit) {
            $this->createMataAnggaranForUnit($unit, $mataAnggaranTemplate, $tahun);
        }
    }

    /**
     * Create mata anggaran hierarchy for a specific unit.
     */
    private function createMataAnggaranForUnit(Unit $unit, array $template, string $tahun): void
    {
        foreach ($template as $maData) {
            $kode = "{$unit->kode}.{$maData['kode']}";

            $mataAnggaran = MataAnggaran::updateOrCreate(
                [
                    'unit_id' => $unit->id,
                    'kode' => $kode,
                    'tahun' => $tahun,
                ],
                [
                    'nama' => $maData['nama'],
                ],
            );

            foreach ($maData['subs'] as $subData) {
                $subKode = "{$unit->kode}.{$subData['kode']}";

                $subMataAnggaran = SubMataAnggaran::updateOrCreate(
                    [
                        'mata_anggaran_id' => $mataAnggaran->id,
                        'unit_id' => $unit->id,
                        'kode' => $subKode,
                    ],
                    [
                        'nama' => $subData['nama'],
                    ],
                );

                foreach ($subData['details'] as $detailData) {
                    $anggaran = $detailData['anggaran'];

                    DetailMataAnggaran::updateOrCreate(
                        [
                            'mata_anggaran_id' => $mataAnggaran->id,
                            'sub_mata_anggaran_id' => $subMataAnggaran->id,
                            'unit_id' => $unit->id,
                            'tahun' => $tahun,
                        ],
                        [
                            'anggaran_awal' => $anggaran,
                            'balance' => $anggaran,
                            'saldo_dipakai' => 0,
                            'realisasi_year' => 0,
                        ],
                    );
                }
            }
        }
    }
}
