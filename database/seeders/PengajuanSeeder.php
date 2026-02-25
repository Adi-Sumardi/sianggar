<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AmountCategory;
use App\Enums\ApprovalStage;
use App\Enums\ApprovalStatus;
use App\Enums\ProposalStatus;
use App\Enums\ReferenceType;
use App\Models\Approval;
use App\Models\DetailMataAnggaran;
use App\Models\DetailPengajuan;
use App\Models\PengajuanAnggaran;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class PengajuanSeeder extends Seeder
{
    private string $tahun = '2026/2027';

    private string $tahunDoc = '2026';

    private int $nomorUrut = 1;

    public function run(): void
    {
        // =====================================================================
        // UNIT PENGAJUAN (8 Units x 5+ records each)
        // Units start at StaffDirektur stage
        // =====================================================================

        // ---------------------------------------------------------------
        // PG - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'pg@sianggar.test',
            unit: 'PG',
            nama: 'Pembelian Snack Anak',
            total: 2_400_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Snack Sehat', 'volume' => 120, 'satuan' => 'paket', 'harga_satuan' => 20_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'pg@sianggar.test',
            unit: 'PG',
            nama: 'Pengadaan Mainan Edukasi',
            total: 5_500_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Mainan Balok Kayu', 'volume' => 20, 'satuan' => 'set', 'harga_satuan' => 175_000],
                ['uraian' => 'Puzzle ABC', 'volume' => 30, 'satuan' => 'set', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'pg@sianggar.test',
            unit: 'PG',
            nama: 'Kegiatan Parent Meeting',
            total: 3_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::Direktur,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Konsumsi Rapat', 'volume' => 60, 'satuan' => 'porsi', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'pg@sianggar.test',
            unit: 'PG',
            nama: 'Perbaikan Ruang Bermain',
            total: 8_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Bendahara,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Cat Dinding', 'volume' => 10, 'satuan' => 'kaleng', 'harga_satuan' => 300_000],
                ['uraian' => 'Karpet Lantai', 'volume' => 50, 'satuan' => 'm2', 'harga_satuan' => 100_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'pg@sianggar.test',
            unit: 'PG',
            nama: 'Festival Anak Sehat',
            total: 15_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::WakilKetua,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Dekorasi Acara', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 5_000_000],
                ['uraian' => 'Doorprize', 'volume' => 50, 'satuan' => 'item', 'harga_satuan' => 100_000],
                ['uraian' => 'Konsumsi', 'volume' => 100, 'satuan' => 'porsi', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // RA - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'ra@sianggar.test',
            unit: 'RA',
            nama: 'Kegiatan Maulid Nabi',
            total: 5_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Konsumsi Acara', 'volume' => 150, 'satuan' => 'porsi', 'harga_satuan' => 25_000],
                ['uraian' => 'Dekorasi', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 1_250_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'ra@sianggar.test',
            unit: 'RA',
            nama: 'Pengadaan Alat Peraga Islami',
            total: 7_500_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Poster Huruf Hijaiyah', 'volume' => 30, 'satuan' => 'set', 'harga_satuan' => 50_000],
                ['uraian' => 'Miniatur Kabah', 'volume' => 5, 'satuan' => 'unit', 'harga_satuan' => 1_200_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'ra@sianggar.test',
            unit: 'RA',
            nama: 'Pelatihan Guru TPA',
            total: 4_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::Direktur,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Honor Narasumber', 'volume' => 2, 'satuan' => 'orang', 'harga_satuan' => 1_500_000],
                ['uraian' => 'Modul Pelatihan', 'volume' => 20, 'satuan' => 'buku', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'ra@sianggar.test',
            unit: 'RA',
            nama: 'Perlombaan Tahfidz',
            total: 12_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::WakilKetua,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Hadiah Pemenang', 'volume' => 10, 'satuan' => 'paket', 'harga_satuan' => 800_000],
                ['uraian' => 'Sertifikat & Piala', 'volume' => 50, 'satuan' => 'item', 'harga_satuan' => 40_000],
                ['uraian' => 'Konsumsi Juri', 'volume' => 20, 'satuan' => 'porsi', 'harga_satuan' => 100_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'ra@sianggar.test',
            unit: 'RA',
            nama: 'Wisuda Santri',
            total: 25_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Ketum,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Sewa Gedung', 'volume' => 1, 'satuan' => 'hari', 'harga_satuan' => 10_000_000],
                ['uraian' => 'Dekorasi Panggung', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 8_000_000],
                ['uraian' => 'Konsumsi', 'volume' => 200, 'satuan' => 'porsi', 'harga_satuan' => 35_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // TK - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'tk@sianggar.test',
            unit: 'TK',
            nama: 'Pengadaan Mainan Edukatif',
            total: 6_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Mainan Balok Susun', 'volume' => 10, 'satuan' => 'set', 'harga_satuan' => 350_000],
                ['uraian' => 'Puzzle Edukasi', 'volume' => 15, 'satuan' => 'set', 'harga_satuan' => 150_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'tk@sianggar.test',
            unit: 'TK',
            nama: 'Kegiatan Field Trip',
            total: 8_500_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Sewa Bus', 'volume' => 2, 'satuan' => 'unit', 'harga_satuan' => 2_500_000],
                ['uraian' => 'Tiket Masuk', 'volume' => 70, 'satuan' => 'orang', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'tk@sianggar.test',
            unit: 'TK',
            nama: 'Perbaikan Playground',
            total: 20_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::WakilKetua,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Alat Bermain Outdoor', 'volume' => 1, 'satuan' => 'set', 'harga_satuan' => 15_000_000],
                ['uraian' => 'Pemasangan', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 5_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'tk@sianggar.test',
            unit: 'TK',
            nama: 'Pelatihan Montessori',
            total: 4_500_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Keuangan,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Biaya Workshop', 'volume' => 5, 'satuan' => 'orang', 'harga_satuan' => 750_000],
                ['uraian' => 'Transport', 'volume' => 5, 'satuan' => 'orang', 'harga_satuan' => 150_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'tk@sianggar.test',
            unit: 'TK',
            nama: 'Pentas Seni Anak',
            total: 9_000_000,
            status: ProposalStatus::Done,
            currentStage: ApprovalStage::Kasir,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Kostum Penampil', 'volume' => 50, 'satuan' => 'set', 'harga_satuan' => 120_000],
                ['uraian' => 'Sound System', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 3_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // SD - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'sd@sianggar.test',
            unit: 'SD',
            nama: 'Pengadaan Buku Pelajaran',
            total: 8_500_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Buku Matematika Kelas 1-6', 'volume' => 60, 'satuan' => 'buku', 'harga_satuan' => 85_000],
                ['uraian' => 'Buku Bahasa Indonesia', 'volume' => 50, 'satuan' => 'buku', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sd@sianggar.test',
            unit: 'SD',
            nama: 'Kegiatan Class Meeting',
            total: 6_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Hadiah Lomba', 'volume' => 20, 'satuan' => 'paket', 'harga_satuan' => 200_000],
                ['uraian' => 'Perlengkapan Lomba', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 2_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sd@sianggar.test',
            unit: 'SD',
            nama: 'Pengadaan Seragam Guru',
            total: 6_500_000,
            status: ProposalStatus::RevisionRequired,
            currentStage: null,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Seragam Batik', 'volume' => 20, 'satuan' => 'set', 'harga_satuan' => 325_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Revised, 'approver' => 'staff.direktur@sianggar.test', 'notes' => 'Mohon lengkapi ukuran seragam.'],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sd@sianggar.test',
            unit: 'SD',
            nama: 'Pelatihan Kurikulum Merdeka',
            total: 7_500_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::Direktur,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Honor Narasumber', 'volume' => 3, 'satuan' => 'orang', 'harga_satuan' => 2_000_000],
                ['uraian' => 'Modul Peserta', 'volume' => 30, 'satuan' => 'buku', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sd@sianggar.test',
            unit: 'SD',
            nama: 'Renovasi Lab Komputer',
            total: 35_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Ketum,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Komputer Desktop', 'volume' => 15, 'satuan' => 'unit', 'harga_satuan' => 1_800_000],
                ['uraian' => 'Meja Komputer', 'volume' => 15, 'satuan' => 'unit', 'harga_satuan' => 400_000],
                ['uraian' => 'AC', 'volume' => 2, 'satuan' => 'unit', 'harga_satuan' => 4_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // SMP12 - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'smp12@sianggar.test',
            unit: 'SMP12',
            nama: 'Kegiatan Study Tour',
            total: 7_200_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Transport Bus', 'volume' => 2, 'satuan' => 'unit', 'harga_satuan' => 2_500_000],
                ['uraian' => 'Konsumsi Siswa', 'volume' => 44, 'satuan' => 'orang', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp12@sianggar.test',
            unit: 'SMP12',
            nama: 'Pengadaan Alat Olahraga',
            total: 5_500_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Bola Basket', 'volume' => 10, 'satuan' => 'buah', 'harga_satuan' => 250_000],
                ['uraian' => 'Bola Voli', 'volume' => 10, 'satuan' => 'buah', 'harga_satuan' => 150_000],
                ['uraian' => 'Net Badminton', 'volume' => 5, 'satuan' => 'set', 'harga_satuan' => 200_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp12@sianggar.test',
            unit: 'SMP12',
            nama: 'Olimpiade Sains',
            total: 15_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::WakilKetua,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Pendaftaran Lomba', 'volume' => 20, 'satuan' => 'siswa', 'harga_satuan' => 300_000],
                ['uraian' => 'Transport & Akomodasi', 'volume' => 25, 'satuan' => 'orang', 'harga_satuan' => 360_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp12@sianggar.test',
            unit: 'SMP12',
            nama: 'Perbaikan Mushola',
            total: 8_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Bendahara,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Karpet Sajadah', 'volume' => 50, 'satuan' => 'm2', 'harga_satuan' => 100_000],
                ['uraian' => 'AC Portable', 'volume' => 2, 'satuan' => 'unit', 'harga_satuan' => 1_500_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp12@sianggar.test',
            unit: 'SMP12',
            nama: 'Wisata Religi',
            total: 3_600_000,
            status: ProposalStatus::Paid,
            currentStage: null,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Transport', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 2_500_000],
                ['uraian' => 'Konsumsi', 'volume' => 40, 'satuan' => 'orang', 'harga_satuan' => 27_500],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Approved, 'approver' => 'kasir@sianggar.test'],
                ['stage' => ApprovalStage::Payment, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
            ],
            noVoucher: 'VCR/2026/002',
        );

        // ---------------------------------------------------------------
        // SMP55 - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'smp55@sianggar.test',
            unit: 'SMP55',
            nama: 'Pembangunan Ruang Kelas',
            total: 150_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Ketum,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Konstruksi Bangunan', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 120_000_000],
                ['uraian' => 'Instalasi Listrik', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 15_000_000],
                ['uraian' => 'Perabotan Kelas', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 15_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp55@sianggar.test',
            unit: 'SMP55',
            nama: 'Pengadaan Proyektor',
            total: 9_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Proyektor LED', 'volume' => 3, 'satuan' => 'unit', 'harga_satuan' => 3_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp55@sianggar.test',
            unit: 'SMP55',
            nama: 'Lomba Debat Bahasa Inggris',
            total: 7_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Pendaftaran', 'volume' => 5, 'satuan' => 'tim', 'harga_satuan' => 500_000],
                ['uraian' => 'Transport', 'volume' => 15, 'satuan' => 'orang', 'harga_satuan' => 200_000],
                ['uraian' => 'Konsumsi', 'volume' => 15, 'satuan' => 'orang', 'harga_satuan' => 100_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp55@sianggar.test',
            unit: 'SMP55',
            nama: 'Pelatihan Public Speaking',
            total: 4_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::Direktur,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Honor Trainer', 'volume' => 2, 'satuan' => 'sesi', 'harga_satuan' => 1_500_000],
                ['uraian' => 'Materi Peserta', 'volume' => 40, 'satuan' => 'buku', 'harga_satuan' => 25_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'smp55@sianggar.test',
            unit: 'SMP55',
            nama: 'Kegiatan Camping',
            total: 12_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Keuangan,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Sewa Tenda', 'volume' => 20, 'satuan' => 'unit', 'harga_satuan' => 200_000],
                ['uraian' => 'Perlengkapan Camping', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 4_000_000],
                ['uraian' => 'Konsumsi 2 Hari', 'volume' => 80, 'satuan' => 'orang', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // SMA33 - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'sma33@sianggar.test',
            unit: 'SMA33',
            nama: 'Renovasi Laboratorium',
            total: 45_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::Direktur,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Komputer Desktop', 'volume' => 20, 'satuan' => 'unit', 'harga_satuan' => 1_500_000],
                ['uraian' => 'Meja Komputer', 'volume' => 20, 'satuan' => 'unit', 'harga_satuan' => 500_000],
                ['uraian' => 'Instalasi Jaringan', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 5_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sma33@sianggar.test',
            unit: 'SMA33',
            nama: 'Persiapan Ujian Nasional',
            total: 8_000_000,
            status: ProposalStatus::Draft,
            currentStage: null,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Fotokopi Soal Try Out', 'volume' => 500, 'satuan' => 'set', 'harga_satuan' => 10_000],
                ['uraian' => 'Konsumsi Pengawas', 'volume' => 30, 'satuan' => 'orang', 'harga_satuan' => 100_000],
            ],
            approvals: [],
        );

        $this->createPengajuan(
            userEmail: 'sma33@sianggar.test',
            unit: 'SMA33',
            nama: 'Kegiatan Pramuka',
            total: 6_500_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Peralatan Pramuka', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 3_000_000],
                ['uraian' => 'Konsumsi Jambore', 'volume' => 70, 'satuan' => 'orang', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sma33@sianggar.test',
            unit: 'SMA33',
            nama: 'Lomba Karya Ilmiah',
            total: 5_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Biaya Pendaftaran', 'volume' => 10, 'satuan' => 'tim', 'harga_satuan' => 300_000],
                ['uraian' => 'Material Penelitian', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 2_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sma33@sianggar.test',
            unit: 'SMA33',
            nama: 'Wisuda Angkatan',
            total: 50_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Bendahara,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Sewa Gedung', 'volume' => 1, 'satuan' => 'hari', 'harga_satuan' => 25_000_000],
                ['uraian' => 'Dekorasi', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 15_000_000],
                ['uraian' => 'Konsumsi', 'volume' => 200, 'satuan' => 'porsi', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // Stebank - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'stebank@sianggar.test',
            unit: 'Stebank',
            nama: 'Pelatihan Kewirausahaan',
            total: 12_000_000,
            status: ProposalStatus::Paid,
            currentStage: null,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Narasumber', 'volume' => 2, 'satuan' => 'orang', 'harga_satuan' => 3_000_000],
                ['uraian' => 'Sewa Venue', 'volume' => 1, 'satuan' => 'hari', 'harga_satuan' => 4_000_000],
                ['uraian' => 'Konsumsi', 'volume' => 50, 'satuan' => 'orang', 'harga_satuan' => 40_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Approved, 'approver' => 'ketua1@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Approved, 'approver' => 'kasir@sianggar.test'],
                ['stage' => ApprovalStage::Payment, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
            ],
            noVoucher: 'VCR/2026/001',
        );

        $this->createPengajuan(
            userEmail: 'stebank@sianggar.test',
            unit: 'Stebank',
            nama: 'Pengadaan Mesin Jahit',
            total: 15_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffDirektur,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Mesin Jahit Industrial', 'volume' => 5, 'satuan' => 'unit', 'harga_satuan' => 3_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'stebank@sianggar.test',
            unit: 'Stebank',
            nama: 'Praktik Kerja Industri',
            total: 8_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'unit',
            referenceType: null,
            items: [
                ['uraian' => 'Transport Siswa', 'volume' => 40, 'satuan' => 'orang', 'harga_satuan' => 150_000],
                ['uraian' => 'Seragam Prakerin', 'volume' => 40, 'satuan' => 'set', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'stebank@sianggar.test',
            unit: 'Stebank',
            nama: 'Workshop Digital Marketing',
            total: 6_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::Direktur,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Instruktur', 'volume' => 2, 'satuan' => 'orang', 'harga_satuan' => 2_500_000],
                ['uraian' => 'Material Kursus', 'volume' => 30, 'satuan' => 'paket', 'harga_satuan' => 33_333],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'stebank@sianggar.test',
            unit: 'Stebank',
            nama: 'Pameran Produk Siswa',
            total: 20_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::WakilKetua,
            submitterType: 'unit',
            referenceType: ReferenceType::Education,
            items: [
                ['uraian' => 'Sewa Stand', 'volume' => 5, 'satuan' => 'booth', 'harga_satuan' => 2_000_000],
                ['uraian' => 'Material Display', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 5_000_000],
                ['uraian' => 'Transport & Konsumsi', 'volume' => 50, 'satuan' => 'orang', 'harga_satuan' => 100_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffDirektur, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.direktur@sianggar.test'],
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Direktur, 'status' => ApprovalStatus::Approved, 'approver' => 'direktur@sianggar.test'],
                ['stage' => ApprovalStage::WakilKetua, 'status' => ApprovalStatus::Pending],
            ],
        );

        // =====================================================================
        // SUBSTANSI PENGAJUAN (6 Substansi x 5+ records each)
        // Substansi start directly at StaffKeuangan stage (skip StaffDirektur)
        // =====================================================================

        // ---------------------------------------------------------------
        // Asrama - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'asrama@sianggar.test',
            unit: 'Asrama',
            nama: 'Pemeliharaan Gedung Asrama',
            total: 15_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::KabagSdmUmum,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Pengecatan Dinding', 'volume' => 500, 'satuan' => 'm2', 'harga_satuan' => 25_000],
                ['uraian' => 'Perbaikan Atap', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 2_500_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'asrama@sianggar.test',
            unit: 'Asrama',
            nama: 'Pengadaan Kasur Baru',
            total: 8_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'substansi',
            referenceType: null,
            items: [
                ['uraian' => 'Kasur Single', 'volume' => 20, 'satuan' => 'unit', 'harga_satuan' => 400_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'asrama@sianggar.test',
            unit: 'Asrama',
            nama: 'Perbaikan Listrik',
            total: 5_500_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Keuangan,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Material Listrik', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 3_000_000],
                ['uraian' => 'Jasa Teknisi', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 2_500_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'asrama@sianggar.test',
            unit: 'Asrama',
            nama: 'Kegiatan Halal Bihalal',
            total: 4_000_000,
            status: ProposalStatus::Done,
            currentStage: ApprovalStage::Kasir,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Konsumsi', 'volume' => 100, 'satuan' => 'porsi', 'harga_satuan' => 35_000],
                ['uraian' => 'Dekorasi', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 500_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'asrama@sianggar.test',
            unit: 'Asrama',
            nama: 'Renovasi Kamar Mandi',
            total: 25_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Sekretaris,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Material Bangunan', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 15_000_000],
                ['uraian' => 'Jasa Tukang', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 10_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // LAZ - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'laz@sianggar.test',
            unit: 'LAZ',
            nama: 'Program Beasiswa Dhuafa',
            total: 30_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Sekretaris,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Bantuan Biaya Pendidikan', 'volume' => 30, 'satuan' => 'siswa', 'harga_satuan' => 1_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'laz@sianggar.test',
            unit: 'LAZ',
            nama: 'Santunan Anak Yatim',
            total: 10_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'substansi',
            referenceType: null,
            items: [
                ['uraian' => 'Paket Santunan', 'volume' => 50, 'satuan' => 'paket', 'harga_satuan' => 200_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'laz@sianggar.test',
            unit: 'LAZ',
            nama: 'Kegiatan Donor Darah',
            total: 3_500_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::KabagSdmUmum,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Konsumsi Pendonor', 'volume' => 100, 'satuan' => 'orang', 'harga_satuan' => 25_000],
                ['uraian' => 'Souvenir', 'volume' => 100, 'satuan' => 'item', 'harga_satuan' => 10_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'laz@sianggar.test',
            unit: 'LAZ',
            nama: 'Bakti Sosial Ramadhan',
            total: 15_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Bendahara,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Sembako', 'volume' => 100, 'satuan' => 'paket', 'harga_satuan' => 150_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretaris@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'laz@sianggar.test',
            unit: 'LAZ',
            nama: 'Bantuan Bencana Alam',
            total: 50_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Ketum,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Bantuan Darurat', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 30_000_000],
                ['uraian' => 'Logistik', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 20_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretaris@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // Litbang - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'litbang@sianggar.test',
            unit: 'Litbang',
            nama: 'Penelitian Kurikulum',
            total: 12_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::KabagSekretariat,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Honor Peneliti', 'volume' => 3, 'satuan' => 'orang', 'harga_satuan' => 3_000_000],
                ['uraian' => 'Material Penelitian', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 3_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'litbang@sianggar.test',
            unit: 'Litbang',
            nama: 'Seminar Pendidikan',
            total: 8_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'substansi',
            referenceType: null,
            items: [
                ['uraian' => 'Narasumber', 'volume' => 2, 'satuan' => 'orang', 'harga_satuan' => 2_500_000],
                ['uraian' => 'Konsumsi', 'volume' => 60, 'satuan' => 'orang', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'litbang@sianggar.test',
            unit: 'Litbang',
            nama: 'Pengembangan E-Learning',
            total: 25_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Sekretaris,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Pengembangan Platform', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 20_000_000],
                ['uraian' => 'Konten Pembelajaran', 'volume' => 50, 'satuan' => 'modul', 'harga_satuan' => 100_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'litbang@sianggar.test',
            unit: 'Litbang',
            nama: 'Workshop Inovasi Pembelajaran',
            total: 6_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Keuangan,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Fasilitator', 'volume' => 2, 'satuan' => 'orang', 'harga_satuan' => 2_000_000],
                ['uraian' => 'Material Workshop', 'volume' => 40, 'satuan' => 'paket', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'litbang@sianggar.test',
            unit: 'Litbang',
            nama: 'Survey Kepuasan Stakeholder',
            total: 4_500_000,
            status: ProposalStatus::Paid,
            currentStage: null,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Enumerator', 'volume' => 10, 'satuan' => 'orang', 'harga_satuan' => 350_000],
                ['uraian' => 'Analisis Data', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 1_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Approved, 'approver' => 'kasir@sianggar.test'],
                ['stage' => ApprovalStage::Payment, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
            ],
            noVoucher: 'VCR/2026/003',
        );

        // ---------------------------------------------------------------
        // SDM - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'sdm@sianggar.test',
            unit: 'SDM',
            nama: 'Pelatihan Leadership Guru',
            total: 15_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::KabagSdmUmum,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Instruktur', 'volume' => 2, 'satuan' => 'orang', 'harga_satuan' => 5_000_000],
                ['uraian' => 'Akomodasi', 'volume' => 30, 'satuan' => 'orang', 'harga_satuan' => 166_667],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sdm@sianggar.test',
            unit: 'SDM',
            nama: 'Rekrutmen Guru Baru',
            total: 5_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'substansi',
            referenceType: null,
            items: [
                ['uraian' => 'Iklan Lowongan', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 2_000_000],
                ['uraian' => 'Biaya Seleksi', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 3_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sdm@sianggar.test',
            unit: 'SDM',
            nama: 'Assessment Center',
            total: 20_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Sekretaris,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Jasa Psikolog', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 15_000_000],
                ['uraian' => 'Material Assessment', 'volume' => 50, 'satuan' => 'set', 'harga_satuan' => 100_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sdm@sianggar.test',
            unit: 'SDM',
            nama: 'Team Building',
            total: 12_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Bendahara,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Sewa Venue Outbound', 'volume' => 1, 'satuan' => 'hari', 'harga_satuan' => 8_000_000],
                ['uraian' => 'Konsumsi', 'volume' => 80, 'satuan' => 'orang', 'harga_satuan' => 50_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretaris@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'sdm@sianggar.test',
            unit: 'SDM',
            nama: 'Sertifikasi Guru',
            total: 8_500_000,
            status: ProposalStatus::Done,
            currentStage: ApprovalStage::Kasir,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Biaya Sertifikasi', 'volume' => 10, 'satuan' => 'orang', 'harga_satuan' => 850_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Pending],
            ],
        );

        // ---------------------------------------------------------------
        // Umum - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'umum@sianggar.test',
            unit: 'Umum',
            nama: 'Pengadaan Kendaraan Operasional',
            total: 150_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Ketum,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Mobil Operasional', 'volume' => 1, 'satuan' => 'unit', 'harga_satuan' => 150_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretaris@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'umum@sianggar.test',
            unit: 'Umum',
            nama: 'Pengadaan ATK Bulanan',
            total: 3_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'substansi',
            referenceType: null,
            items: [
                ['uraian' => 'Kertas HVS', 'volume' => 50, 'satuan' => 'rim', 'harga_satuan' => 45_000],
                ['uraian' => 'Tinta Printer', 'volume' => 10, 'satuan' => 'botol', 'harga_satuan' => 75_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'umum@sianggar.test',
            unit: 'Umum',
            nama: 'Service AC Rutin',
            total: 5_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::KabagSdmUmum,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Jasa Service', 'volume' => 20, 'satuan' => 'unit', 'harga_satuan' => 250_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'umum@sianggar.test',
            unit: 'Umum',
            nama: 'Perawatan Taman',
            total: 4_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Keuangan,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Jasa Taman', 'volume' => 4, 'satuan' => 'bulan', 'harga_satuan' => 1_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'umum@sianggar.test',
            unit: 'Umum',
            nama: 'Pengecatan Gedung',
            total: 35_000_000,
            status: ProposalStatus::Paid,
            currentStage: null,
            submitterType: 'substansi',
            referenceType: ReferenceType::HrGeneral,
            items: [
                ['uraian' => 'Material Cat', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 15_000_000],
                ['uraian' => 'Jasa Pengecatan', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 20_000_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSdmUmum, 'status' => ApprovalStatus::Approved, 'approver' => 'kabag@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretaris@sianggar.test'],
                ['stage' => ApprovalStage::Ketum, 'status' => ApprovalStatus::Approved, 'approver' => 'ketum@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Approved, 'approver' => 'kasir@sianggar.test'],
                ['stage' => ApprovalStage::Payment, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
            ],
            noVoucher: 'VCR/2026/004',
        );

        // ---------------------------------------------------------------
        // Staff Sekretariat - 5 records
        // ---------------------------------------------------------------
        $this->createPengajuan(
            userEmail: 'staff.sekretariat@sianggar.test',
            unit: 'Sekretariat',
            nama: 'Pengadaan Software Office',
            total: 10_000_000,
            status: ProposalStatus::ApprovedLevel1,
            currentStage: ApprovalStage::KabagSekretariat,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Lisensi MS Office', 'volume' => 20, 'satuan' => 'user', 'harga_satuan' => 500_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'staff.sekretariat@sianggar.test',
            unit: 'Sekretariat',
            nama: 'Cetak Kalender Tahunan',
            total: 5_000_000,
            status: ProposalStatus::Submitted,
            currentStage: ApprovalStage::StaffKeuangan,
            submitterType: 'substansi',
            referenceType: null,
            items: [
                ['uraian' => 'Cetak Kalender', 'volume' => 500, 'satuan' => 'buah', 'harga_satuan' => 10_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'staff.sekretariat@sianggar.test',
            unit: 'Sekretariat',
            nama: 'Rapat Kerja Tahunan',
            total: 25_000_000,
            status: ProposalStatus::ApprovedLevel2,
            currentStage: ApprovalStage::Sekretaris,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Sewa Hotel', 'volume' => 2, 'satuan' => 'hari', 'harga_satuan' => 8_000_000],
                ['uraian' => 'Konsumsi', 'volume' => 100, 'satuan' => 'orang', 'harga_satuan' => 90_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Sekretaris, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'staff.sekretariat@sianggar.test',
            unit: 'Sekretariat',
            nama: 'Pembuatan Company Profile',
            total: 8_000_000,
            status: ProposalStatus::FinalApproved,
            currentStage: ApprovalStage::Bendahara,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Jasa Desain', 'volume' => 1, 'satuan' => 'paket', 'harga_satuan' => 5_000_000],
                ['uraian' => 'Cetak Buku', 'volume' => 100, 'satuan' => 'buku', 'harga_satuan' => 30_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Pending],
            ],
        );

        $this->createPengajuan(
            userEmail: 'staff.sekretariat@sianggar.test',
            unit: 'Sekretariat',
            nama: 'Pengarsipan Digital',
            total: 7_500_000,
            status: ProposalStatus::Done,
            currentStage: ApprovalStage::Kasir,
            submitterType: 'substansi',
            referenceType: ReferenceType::Secretariat,
            items: [
                ['uraian' => 'Scanner', 'volume' => 2, 'satuan' => 'unit', 'harga_satuan' => 2_500_000],
                ['uraian' => 'Storage Server', 'volume' => 1, 'satuan' => 'unit', 'harga_satuan' => 2_500_000],
            ],
            approvals: [
                ['stage' => ApprovalStage::StaffKeuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'staff.keuangan@sianggar.test'],
                ['stage' => ApprovalStage::KabagSekretariat, 'status' => ApprovalStatus::Approved, 'approver' => 'sekretariat@sianggar.test'],
                ['stage' => ApprovalStage::Keuangan, 'status' => ApprovalStatus::Approved, 'approver' => 'keuangan@sianggar.test'],
                ['stage' => ApprovalStage::Bendahara, 'status' => ApprovalStatus::Approved, 'approver' => 'bendahara@sianggar.test'],
                ['stage' => ApprovalStage::Kasir, 'status' => ApprovalStatus::Pending],
            ],
        );
    }

    private function createPengajuan(
        string $userEmail,
        string $unit,
        string $nama,
        float $total,
        ProposalStatus $status,
        ?ApprovalStage $currentStage,
        string $submitterType,
        ?ReferenceType $referenceType,
        array $items,
        array $approvals,
        ?string $noVoucher = null,
    ): void {
        $user = User::where('email', $userEmail)->first();
        if (! $user) {
            return;
        }

        $unitModel = Unit::where('kode', $unit)->orWhere('nama', $unit)->first();

        // Generate nomor pengajuan
        $noSurat = $status !== ProposalStatus::Draft
            ? sprintf('PA/%s/%s/%03d', $this->tahunDoc, strtoupper(substr($unit, 0, 3)), $this->nomorUrut++)
            : null;

        $pengajuan = PengajuanAnggaran::create([
            'user_id' => $user->id,
            'unit_id' => $unitModel?->id,
            'tahun' => $this->tahun,
            'nomor_pengajuan' => $noSurat,
            'perihal' => $nama,
            'nama_pengajuan' => $nama,
            'no_surat' => $noSurat,
            'tempat' => 'Kampus Al-Azhar',
            'waktu_kegiatan' => Carbon::now()->addDays(rand(7, 30))->format('Y-m-d'),
            'unit' => $unitModel?->nama ?? $unit,
            'jumlah_pengajuan_total' => $total,
            'status_proses' => $status,
            'current_approval_stage' => $currentStage?->value,
            'submitter_type' => $submitterType,
            'amount_category' => AmountCategory::fromAmount($total),
            'reference_type' => $referenceType,
            'need_lpj' => $total >= 10_000_000,
            'approved_amount' => $status === ProposalStatus::Paid ? $total : null,
            'no_voucher' => $noVoucher,
            'status_payment' => $status === ProposalStatus::Paid ? 'paid' : 'unpaid',
        ]);

        // Create detail items
        $detailMataAnggaran = DetailMataAnggaran::where('tahun', $this->tahun)->first();
        $mataAnggaran = $detailMataAnggaran?->mataAnggaran;
        $subMataAnggaran = $detailMataAnggaran?->subMataAnggaran;

        foreach ($items as $item) {
            $jumlah = $item['volume'] * $item['harga_satuan'];
            DetailPengajuan::create([
                'pengajuan_anggaran_id' => $pengajuan->id,
                'detail_mata_anggaran_id' => $detailMataAnggaran?->id,
                'mata_anggaran_id' => $mataAnggaran?->id,
                'sub_mata_anggaran_id' => $subMataAnggaran?->id,
                'uraian' => $item['uraian'],
                'volume' => $item['volume'],
                'satuan' => $item['satuan'],
                'harga_satuan' => $item['harga_satuan'],
                'jumlah' => $jumlah,
            ]);
        }

        // Create approval records
        $stageOrder = 1;
        foreach ($approvals as $approval) {
            $approver = isset($approval['approver'])
                ? User::where('email', $approval['approver'])->first()
                : null;

            Approval::create([
                'approvable_type' => PengajuanAnggaran::class,
                'approvable_id' => $pengajuan->id,
                'stage' => $approval['stage'],
                'stage_order' => $stageOrder++,
                'status' => $approval['status'],
                'approved_by' => $approver?->id,
                'notes' => $approval['notes'] ?? null,
                'approved_at' => $approval['status'] !== ApprovalStatus::Pending
                    ? Carbon::now()->subDays(rand(1, 5))
                    : null,
            ]);
        }
    }
}
