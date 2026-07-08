<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AccountType;
use App\Enums\NormalBalance;
use App\Models\Account;
use App\Models\MataAnggaranJenisAccountMap;
use App\Models\Unit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the default Chart of Accounts for the general ledger:
     * - Group headers (Pendapatan, Beban, Dana Internal Unit)
     * - One expense account per Mata Anggaran `jenis`, mapped via
     *   mata_anggaran_jenis_account_maps
     * - One "Dana Unit" account per existing Unit (fund balance, saldo
     *   normal = debit, saldo awal dihitung live dari total APBS unit —
     *   lihat LedgerService::getUnitDanaOpeningBalance)
     */
    public function run(): void
    {
        $pendapatanGroup = Account::firstOrCreate(
            ['kode' => '4000'],
            [
                'nama' => 'Pendapatan',
                'tipe' => AccountType::Pendapatan->value,
                'saldo_normal' => NormalBalance::Kredit->value,
                'is_postable' => false,
            ],
        );

        $bebanGroup = Account::firstOrCreate(
            ['kode' => '5000'],
            [
                'nama' => 'Beban',
                'tipe' => AccountType::Beban->value,
                'saldo_normal' => NormalBalance::Debit->value,
                'is_postable' => false,
            ],
        );

        $danaUnitGroup = Account::firstOrCreate(
            ['kode' => '1000'],
            [
                'nama' => 'Dana Internal Unit',
                'tipe' => AccountType::Aset->value,
                'saldo_normal' => NormalBalance::Debit->value,
                'is_postable' => false,
            ],
        );

        $pendapatanAccount = Account::firstOrCreate(
            ['kode' => '4100'],
            [
                'nama' => 'Pendapatan Unit',
                'tipe' => AccountType::Pendapatan->value,
                'saldo_normal' => NormalBalance::Kredit->value,
                'parent_id' => $pendapatanGroup->id,
            ],
        );

        $jenisAccounts = [
            'belanja_pegawai' => ['5100', 'Beban Pegawai'],
            'belanja_barang' => ['5200', 'Beban Barang & Jasa'],
            'belanja_modal' => ['5300', 'Beban Modal'],
            'belanja_lainnya' => ['5400', 'Beban Lainnya'],
        ];

        foreach ($jenisAccounts as $jenis => [$kode, $nama]) {
            $account = Account::firstOrCreate(
                ['kode' => $kode],
                [
                    'nama' => $nama,
                    'tipe' => AccountType::Beban->value,
                    'saldo_normal' => NormalBalance::Debit->value,
                    'parent_id' => $bebanGroup->id,
                ],
            );

            MataAnggaranJenisAccountMap::firstOrCreate(
                ['jenis' => $jenis],
                ['account_id' => $account->id],
            );
        }

        MataAnggaranJenisAccountMap::firstOrCreate(
            ['jenis' => 'pendapatan'],
            ['account_id' => $pendapatanAccount->id],
        );

        Unit::all()->each(function (Unit $unit) use ($danaUnitGroup) {
            Account::firstOrCreate(
                ['unit_id' => $unit->id, 'parent_id' => $danaUnitGroup->id],
                [
                    'kode' => '1' . str_pad((string) $unit->id, 3, '0', STR_PAD_LEFT),
                    'nama' => "Dana Unit — {$unit->nama}",
                    'tipe' => AccountType::Aset->value,
                    'saldo_normal' => NormalBalance::Debit->value,
                ],
            );
        });
    }
}
