# SIANGGAR - Dokumentasi Lengkap & Panduan Migrasi ke Laravel 12 + React

> **Sistem Informasi Anggaran Gabungan (SIANGGAR)**
> Dokumen ini berisi analisis lengkap aplikasi existing (Laravel 7) dan desain arsitektur untuk migrasi ke Laravel 12 + React.

---

## Daftar Isi

1. [Ringkasan Aplikasi](#1-ringkasan-aplikasi)
2. [Fitur-Fitur Aplikasi](#2-fitur-fitur-aplikasi)
3. [Database Schema & Model](#3-database-schema--model)
4. [Sistem Autentikasi & Otorisasi](#4-sistem-autentikasi--otorisasi)
5. [Daftar Role & Hak Akses](#5-daftar-role--hak-akses)
6. [Workflow Approval](#6-workflow-approval)
7. [API Endpoints](#7-api-endpoints)
8. [Daftar Controller & Method](#8-daftar-controller--method)
9. [Helper & Utility Functions](#9-helper--utility-functions)
10. [Package Dependencies](#10-package-dependencies)
11. [Desain Arsitektur Baru (Laravel 12 + React)](#11-desain-arsitektur-baru-laravel-12--react)
12. [Rencana Migrasi Database](#12-rencana-migrasi-database)
13. [Desain API Baru](#13-desain-api-baru)
14. [Desain UI/UX React](#14-desain-uiux-react)
15. [Tahapan Implementasi](#15-tahapan-implementasi)

---

## 1. Ringkasan Aplikasi

| Item | Detail |
|------|--------|
| **Nama** | SIANGGAR (Sistem Informasi Anggaran Gabungan) |
| **Versi Lama** | Laravel 7.x, PHP 7.2.5, Blade Templates |
| **Database** | MySQL (`sianggar`) |
| **Jumlah Model** | 22 Eloquent Models |
| **Jumlah Controller** | 65 Controllers |
| **Jumlah Middleware** | 40+ Middleware |
| **Jumlah Route** | 2.100+ Route definitions |
| **Jumlah View** | 1.870+ Blade Templates |
| **Jumlah Migration** | 55 Migration files |
| **Jumlah Role** | 25+ User roles |

### Deskripsi

SIANGGAR adalah sistem pengelolaan anggaran terpadu untuk yayasan pendidikan yang mengelola beberapa unit pendidikan (PG, RA, TK, SD, SMP, SMA, Stebank). Sistem ini mencakup pengelolaan anggaran, pengajuan dana, pelaporan (LPJ), perencanaan strategis, dan komunikasi internal dengan workflow approval multi-level.

---

## 2. Fitur-Fitur Aplikasi

### 2.1 Manajemen Pengguna (User Management)
- CRUD data pengguna (create, read, update, delete)
- Manajemen password
- Multi-role per user (role disimpan sebagai string, bisa comma-separated)
- Login berbasis email dengan CAPTCHA
- Redirect otomatis berdasarkan role setelah login
- API token-based authentication (Laravel Passport)

### 2.2 Manajemen Anggaran (Budget Management)

#### a. Mata Anggaran
- CRUD Mata Anggaran (kode, nama, tahun, per unit)
- Sub Mata Anggaran (turunan dari Mata Anggaran)
- Detail Mata Anggaran (detail item anggaran dengan saldo)
- No Mata Anggaran (referensi nomor)
- Tracking saldo: `anggaran_awal`, `balance`, `saldo_dipakai`

#### b. RAPBS (Rencana Anggaran Pendapatan dan Belanja Sekolah)
- Data RAPBS per unit
- Rekap mata anggaran per unit
- Search/filter RAPBS
- Filter dinamis berdasarkan unit dan tahun

#### c. APBS (Anggaran Pendapatan dan Belanja Sekolah)
- CRUD data APBS
- Pengelolaan per unit dan tahun
- Jumlah APBS per mata anggaran

#### d. Pengajuan Anggaran (Budget Proposals)
- Buat pengajuan baru dengan detail item
- Upload file pendukung
- Workflow approval multi-level (12+ tahap)
- Status tracking: draft, proses, disetujui, ditolak, revisi
- Print/cetak pengajuan
- Nomor surat otomatis
- Perubahan anggaran (amendment)

#### e. Realisasi Anggaran
- Tracking realisasi per unit
- Perbandingan anggaran vs realisasi
- Reporting cawu (catur wulan / per 4 bulan)

#### f. Penerimaan (Revenue)
- CRUD data penerimaan per unit
- Pengelolaan per tahun

### 2.3 LPJ (Laporan Pertanggungjawaban)
- Pembuatan LPJ terkait pengajuan anggaran
- Upload file lampiran (PDF)
- Input realisasi
- Deskripsi singkat kegiatan
- Workflow approval multi-level
- Status revisi
- Validasi oleh direktur dan pimpinan

### 2.4 Perencanaan Strategis (Strategic Planning)

#### a. Strategi (Strategies)
- CRUD arah/sasaran strategis (kode, nama)

#### b. Indikator (Indicators)
- CRUD indikator kinerja terkait strategi

#### c. Program Kerja (Prokers)
- CRUD program kerja
- Terkait dengan strategi, indikator, dan bagian
- Edit proker per unit

#### d. Kegiatan (Activities)
- CRUD kegiatan
- Terkait dengan strategi, indikator, proker, dan bagian

#### e. Bagian (Sections/Departments)
- CRUD data bagian/departemen

#### f. PKT (Program Kerja Tahunan)
- Menghubungkan strategi, indikator, proker, kegiatan dengan mata anggaran
- Per unit dan tahun
- Deskripsi dan tujuan kegiatan
- Saldo anggaran

### 2.5 Sistem Email/Surat Internal
- Buat dan kirim surat/email internal
- Nomor surat otomatis
- Upload lampiran file (PDF, dokumen)
- Workflow approval surat (multi-level)
- Reply/balasan surat
- Arsip surat
- Status tracking (draft, terkirim, diproses, disetujui)
- Ditujukan ke role tertentu

### 2.6 Akuntansi (Accounting)
- Chart of Accounts (COA) per unit
- Accounting sub mata anggaran
- Accounting pengajuan per mata anggaran
- Data penerimaan per unit
- Data realisasi per unit
- Perubahan COA

### 2.7 Laporan (Reporting)
- Laporan pengajuan anggaran
- Laporan CAWU per unit (4 bulanan)
- Laporan CAWU gabungan (semua unit)
- Laporan accounting
- Rekap mata anggaran
- Export ke Excel (maatwebsite/excel)

### 2.8 Manajemen Unit Pendidikan
Setiap unit memiliki dashboard dan fitur yang sama:

| No | Unit | Kode | Deskripsi |
|----|------|------|-----------|
| 1 | PG | pg | Playgroup |
| 2 | RA | ra | Raudhatul Athfal (TK Islam) |
| 3 | TK | tk | Taman Kanak-Kanak |
| 4 | SD | sd | Sekolah Dasar |
| 5 | SMP 1-2 | smp12 | SMP kelas 1-2 |
| 6 | SMP 5-5 | smp55 | SMP kelas 5-5 |
| 7 | SMA 3-3 | sma33 | SMA kelas 3-3 |
| 8 | Stebank | stebank | Unit Stebank |

Fitur per unit:
- Dashboard dengan ringkasan anggaran
- Data pengajuan anggaran
- Buat pengajuan baru
- Data LPJ
- Buat LPJ baru
- Data perubahan anggaran
- Data otorisasi
- Data RAPBS
- Edit program kerja (proker)

### 2.9 Fitur Tambahan
- **CAPTCHA** - Pada halaman login dan registrasi
- **SweetAlert2** - Notifikasi dan konfirmasi UI
- **PDF Viewer** - View PDF dokumen langsung di browser
- **ESC/POS Print** - Cetak struk/receipt
- **WhatsApp Integration** - Notifikasi via WhatsApp
- **File Management** - Upload, download file pendukung
- **Currency Formatting** - Format Rupiah Indonesia (Rp)
- **Terbilang** - Konversi angka ke teks bahasa Indonesia

---

## 3. Database Schema & Model

### 3.1 ERD (Entity Relationship)

```
users
├── has many → pengajuan_anggaran
├── has many → emails
├── has many → email_replys
└── has many → mata_anggarans

units
├── has many → apbs
├── has many → mata_anggarans
├── has many → sub_mata_anggarans
├── has many → detail_mata_anggarans
├── has many → realisasi_anggarans
└── has many → penerimaans

mata_anggarans
├── belongs to → units
├── has many → sub_mata_anggarans
├── has many → detail_mata_anggarans
├── has many → pengajuan_anggaran
└── has many → detail_pengajuans

sub_mata_anggarans
├── belongs to → mata_anggarans
├── belongs to → units
└── has many → detail_mata_anggarans

detail_mata_anggarans
├── belongs to → units
├── belongs to → mata_anggarans
├── belongs to → sub_mata_anggarans
├── belongs to → pkts
└── has many → detail_pengajuans

pengajuan_anggaran
├── belongs to → users
├── has many → detail_pengajuans
├── has many → lpjs
└── has many → file_pendukungs

detail_pengajuans
├── belongs to → pengajuan_anggaran
├── belongs to → detail_mata_anggarans
├── belongs to → mata_anggarans
└── belongs to → sub_mata_anggarans

strategies
├── has many → indikators
├── has many → prokers
└── has many → pkts

indikators
└── belongs to → strategies

prokers
├── belongs to → strategies
├── belongs to → indikators
├── belongs to → bagians
└── belongs to → kegiatans

kegiatans
├── belongs to → strategies
├── belongs to → indikators
├── belongs to → prokers
└── belongs to → bagians

pkts
├── belongs to → strategies
├── belongs to → indikators
├── belongs to → prokers
├── belongs to → kegiatans
├── belongs to → mata_anggarans
├── belongs to → sub_mata_anggarans
└── belongs to → detail_mata_anggarans

lpjs
├── belongs to → pengajuan_anggaran
└── has file attachments

emails
├── belongs to → users
└── has many → email_replys

email_replys
├── belongs to → emails
└── belongs to → users
```

### 3.2 Tabel Database (22 Tabel Utama)

#### users
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| name | string | Nama user |
| email | string (unique) | Email login |
| role | string | Role user (bisa multi, comma-separated) |
| unit | string | Unit kerja |
| password | string | Password (bcrypt) |
| token | string (nullable) | API token |
| email_verified_at | timestamp | Verifikasi email |
| remember_token | string | Remember me token |
| created_at / updated_at | timestamps | |

#### units
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| kode | string | Kode unit |
| nama | string | Nama unit |
| created_at / updated_at | timestamps | |

#### mata_anggarans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| unit_id | bigint (FK) | Referensi ke units |
| kode | string | Kode mata anggaran |
| nama | string | Nama mata anggaran |
| tahun | string | Tahun anggaran |
| created_at / updated_at | timestamps | |

#### sub_mata_anggarans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| mata_anggaran_id | bigint (FK) | Referensi ke mata_anggarans |
| unit_id | bigint (FK) | Referensi ke units |
| kode | string | Kode sub mata anggaran |
| nama | string | Nama sub mata anggaran |
| created_at / updated_at | timestamps | |

#### detail_mata_anggarans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| mata_anggaran_id | bigint (FK) | Referensi ke mata_anggarans |
| sub_mata_anggaran_id | bigint (FK) | Referensi ke sub_mata_anggarans |
| unit_id | bigint (FK) | Referensi ke units |
| pkt_id | bigint (FK) | Referensi ke pkts |
| tahun | string | Tahun |
| anggaran_awal | decimal | Anggaran awal |
| balance | decimal | Saldo saat ini |
| saldo_dipakai | decimal | Saldo yang sudah digunakan |
| realisasi_year | decimal | Realisasi tahun berjalan |
| created_at / updated_at | timestamps | |

#### pengajuan_anggaran
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| user_id | bigint (FK) | Referensi ke users |
| tahun | string | Tahun anggaran |
| nama_pengajuan | string | Nama/perihal pengajuan |
| no_surat | string | Nomor surat |
| tempat | string | Tempat kegiatan |
| waktu_kegiatan | string | Waktu kegiatan |
| unit | string | Unit pengaju |
| jumlah_pengajuan_total | decimal | Total pengajuan |
| file | text (nullable) | File lampiran |
| status_proses | string | Status proses saat ini |
| status_revisi | string | Status revisi |
| date_revisi | date | Tanggal revisi |
| time_revisi | time | Waktu revisi |
| print_status | string | Status cetak |
| status_payment | string | Status pembayaran |
| no_voucer | string | Nomor voucher |
| approve_kabag | string | Approval KaBag |
| noted_kabag | text | Catatan KaBag |
| approve_staff | string | Approval Staff |
| noted_staff | text | Catatan Staff |
| approve_perguruan | string | Approval Perguruan |
| noted_perguruan | text | Catatan Perguruan |
| approve_sekretariat | string | Approval Sekretariat |
| noted_sekretariat | text | Catatan Sekretariat |
| approve_sekretaris | string | Approval Sekretaris |
| noted_sekretaris | text | Catatan Sekretaris |
| approve_bendahara | string | Approval Bendahara |
| noted_bendahara | text | Catatan Bendahara |
| approve_keuangan | string | Approval Keuangan |
| noted_keuangan | text | Catatan Keuangan |
| approve_staff_keuangan | string | Approval Staff Keuangan |
| noted_staff_keuangan | text | Catatan Staff Keuangan |
| approve_ketua1 | string | Approval Ketua 1 |
| noted_ketua1 | text | Catatan Ketua 1 |
| approve_ketua2 | string | Approval Ketua 2 |
| noted_ketua2 | text | Catatan Ketua 2 |
| approve_ketum | string | Approval Ketum |
| noted_ketum | text | Catatan Ketum |
| (+ date_*, time_*, cek_*, revisi_* per approval stage) | | |
| created_at / updated_at | timestamps | |

#### detail_pengajuans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| pengajuan_anggaran_id | bigint (FK) | Referensi ke pengajuan_anggaran |
| detail_mata_anggaran_id | bigint (FK) | Referensi ke detail_mata_anggarans |
| mata_anggaran_id | bigint (FK) | Referensi ke mata_anggarans |
| sub_mata_anggaran_id | bigint (FK) | Referensi ke sub_mata_anggarans |
| created_at / updated_at | timestamps | |

#### lpjs
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| anggaran_id | bigint (FK) | Referensi ke pengajuan_anggaran |
| pengajuan_id | bigint | ID pengajuan |
| unit | string | Unit |
| no_surat | string | Nomor surat |
| mata_anggaran | string | Mata anggaran |
| perihal | string | Perihal LPJ |
| no_mata_anggaran | string | Nomor mata anggaran |
| jumlah_pengajuan_total | decimal | Total |
| tgl_kegiatan | date | Tanggal kegiatan |
| input_realisasi | decimal | Input realisasi |
| deskripsi_singkat | text | Deskripsi |
| proses | string | Status proses |
| file / file_name / file_mime | | File lampiran |
| status_revisi | string | Status revisi |
| tahun | string | Tahun |
| ditujukan | string | Ditujukan kepada |
| (+ approval fields: approve_*, noted_*, cek_*, date_*, time_*) | | |
| created_at / updated_at | timestamps | |

#### strategies
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| kode | string | Kode strategi |
| nama | string | Nama strategi |
| created_at / updated_at | timestamps | |

#### indikators
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| strategies_id | bigint (FK) | Referensi ke strategies |
| kode | string | Kode indikator |
| nama | string | Nama indikator |
| created_at / updated_at | timestamps | |

#### prokers
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| strategies_id | bigint (FK) | Referensi ke strategies |
| indikators_id | bigint (FK) | Referensi ke indikators |
| bagians_id | bigint (FK) | Referensi ke bagians |
| kode | string | Kode proker |
| nama | string | Nama proker |
| created_at / updated_at | timestamps | |

#### kegiatans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| strategies_id | bigint (FK) | Referensi ke strategies |
| indikators_id | bigint (FK) | Referensi ke indikators |
| prokers_id | bigint (FK) | Referensi ke prokers |
| bagians_id | bigint (FK) | Referensi ke bagians |
| created_at / updated_at | timestamps | |

#### pkts
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| strategies_id | bigint (FK) | Referensi ke strategies |
| indikators_id | bigint (FK) | Referensi ke indikators |
| prokers_id | bigint (FK) | Referensi ke prokers |
| kegiatans_id | bigint (FK) | Referensi ke kegiatans |
| mata_anggaran_id | bigint (FK) | Referensi ke mata_anggarans |
| sub_mata_anggaran_id | bigint (FK) | Referensi ke sub_mata_anggarans |
| tahun | string | Tahun |
| unit | string | Unit |
| deskripsi_kegiatan | text | Deskripsi kegiatan |
| tujuan_kegiatan | text | Tujuan kegiatan |
| saldo_anggaran | decimal | Saldo anggaran |
| created_at / updated_at | timestamps | |

#### emails
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| user_id | bigint (FK) | Referensi ke users |
| name_surat | string | Nama surat |
| no_surat | string | Nomor surat |
| isi_surat | text | Isi surat |
| tgl_surat | date | Tanggal surat |
| file / file_name / file_mime | | File lampiran |
| status | string | Status surat |
| ditujukan | string | Ditujukan kepada |
| status_arsip | string | Status arsip |
| status_revisi | string | Status revisi |
| (+ approval fields) | | |
| created_at / updated_at | timestamps | |

#### email_replys
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| email_id | bigint (FK) | Referensi ke emails |
| user_id | bigint (FK) | Referensi ke users |
| status_reply | string | Status reply |
| file | | File lampiran |
| reply_* fields | | Field reply |
| created_at / updated_at | timestamps | |

#### apbs
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| unit_id | bigint (FK) | Referensi ke units |
| tahun | string | Tahun |
| mata_anggaran | string | Mata anggaran |
| jumlah_apbs | decimal | Jumlah APBS |
| created_at / updated_at | timestamps | |

#### penerimaans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| unit_id | bigint (FK) | Referensi ke units |
| tahun | string | Tahun |
| nama_penerimaan | string | Nama penerimaan |
| jumlah_penerimaan | decimal | Jumlah |
| created_at / updated_at | timestamps | |

#### realisasi_anggarans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| unit_id | bigint (FK) | Referensi ke units |
| tahun | string | Tahun |
| mata_anggaran | string | Mata anggaran |
| jumlah_realisasi | decimal | Jumlah realisasi |
| created_at / updated_at | timestamps | |

#### no_mata_anggarans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| no_mata_anggaran | string | Nomor mata anggaran |
| mata_anggaran | string | Nama mata anggaran |
| created_at / updated_at | timestamps | |

#### bagians
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| nama | string | Nama bagian |
| created_at / updated_at | timestamps | |

#### file_pendukungs
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| anggaran_id | bigint (FK) | Referensi ke pengajuan_anggaran |
| nama_file | string | Nama file |
| unit | string | Unit |
| tahun | string | Tahun |
| created_at / updated_at | timestamps | |

#### lampiran_mata_anggarans
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | bigint (PK) | Auto increment |
| no_pengajuan | string | Nomor pengajuan |
| detail_mata_anggaran_id | bigint (FK) | |
| sub_mata_anggaran_id | bigint (FK) | |
| mata_anggaran_id | bigint (FK) | |
| created_at / updated_at | timestamps | |

---

## 4. Sistem Autentikasi & Otorisasi

### 4.1 Autentikasi (Existing)
- **Web**: Session-based (Laravel default)
- **API**: Token-based (Laravel Passport + custom ApiAuthMiddleware)
- **CAPTCHA**: Pada login & register (mews/captcha)
- **Password**: bcrypt hashing

### 4.2 Otorisasi
- **Middleware per role**: 40+ middleware class, masing-masing mengecek `Auth::user()->role`
- **Redirect after login**: Berdasarkan role user
- **Setiap route group** dilindungi middleware `auth` + middleware role spesifik

---

## 5. Daftar Role & Hak Akses

### 5.1 Role Administratif

| No | Role | Dashboard | Deskripsi |
|----|------|-----------|-----------|
| 1 | `admin` | `/admin` | Super admin - akses penuh ke semua data |
| 2 | `direktur` | `/direktur` | Direktur - approval pengajuan & LPJ |
| 3 | `ketua` | `/ketua` | Ketua - approval level atas |
| 4 | `ketua-1` | `/ketua-1` | Ketua 1 - approval level atas |
| 5 | `ketua-2` | `/ketua-2` | Ketua 2 - approval level atas |
| 6 | `ketum` | `/ketum` | Ketua Umum - approval tertinggi |

### 5.2 Role Departemen

| No | Role | Dashboard | Deskripsi |
|----|------|-----------|-----------|
| 7 | `sekretariat` | `/sekretariat` | Sekretariat - administrasi surat & approval |
| 8 | `sekretaris` | `/sekretaris` | Sekretaris - administrasi |
| 9 | `bendahara` | `/bendahara` | Bendahara - verifikasi keuangan |
| 10 | `keuangan` | `/keuangan` | Keuangan - pengelolaan keuangan |
| 11 | `akuntansi` | `/akuntansi` | Akuntansi - laporan keuangan |
| 12 | `kasir` | `/kasir` | Kasir - pembayaran |
| 13 | `sdm` | `/sdm` | SDM - sumber daya manusia |
| 14 | `umum` | `/umum` | Umum - urusan umum |
| 15 | `kabag-sdm-umum` | `/kabag-sdm-umum` | Kepala Bagian SDM & Umum |

### 5.3 Role Staff

| No | Role | Dashboard | Deskripsi |
|----|------|-----------|-----------|
| 16 | `staff-direktur` | `/staff-direktur` | Staff Direktur |
| 17 | `staff-sekretariat` | `/staff-sekretariat` | Staff Sekretariat |
| 18 | `staff-keuangan` | `/staff-keuangan` | Staff Keuangan |

### 5.4 Role Unit Pendidikan

| No | Role | Dashboard | Deskripsi |
|----|------|-----------|-----------|
| 19 | `pg` | `/pg` | Playgroup |
| 20 | `ra` | `/ra` | Raudhatul Athfal |
| 21 | `tk` | `/tk` | Taman Kanak-Kanak |
| 22 | `sd` | `/sd` | Sekolah Dasar |
| 23 | `smp12` | `/smp12` | SMP 1-2 |
| 24 | `smp55` | `/smp55` | SMP 5-5 |
| 25 | `sma33` | `/sma33` | SMA 3-3 |
| 26 | `stebank` | `/stebank` | Stebank |

### 5.5 Role Khusus

| No | Role | Dashboard | Deskripsi |
|----|------|-----------|-----------|
| 27 | `unit` | `/unit` | Unit generik |
| 28 | `asrama` | `/asrama` | Asrama/Dormitory |
| 29 | `litbang` | `/litbang` | Penelitian & Pengembangan |
| 30 | `laz` | `/laz` | Lembaga Amil Zakat |
| 31 | `pembangunan` | `/pembangunan` | Pembangunan |

### 5.6 Matriks Hak Akses Utama

| Fitur | Admin | Unit | Direktur | Ketua/Ketum | Keuangan | Bendahara | Sekretariat |
|-------|-------|------|----------|-------------|----------|-----------|-------------|
| Kelola User | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Kelola Mata Anggaran | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Buat Pengajuan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Pengajuan | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buat LPJ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve LPJ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lihat Laporan | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kelola COA | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Kelola Email/Surat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data RAPBS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kelola Strategi | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Kelola Proker | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 6. Workflow Approval

### 6.1 Workflow Pengajuan Anggaran

```
Unit/User membuat pengajuan
        │
        ▼
┌─────────────────┐
│ KaBag SDM Umum  │ ── approve/revisi ──┐
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│     Staff       │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│   Perguruan     │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │  ← REVISI kembali ke unit
┌─────────────────┐                      │
│  Sekretariat    │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│   Sekretaris    │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│   Bendahara     │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│    Keuangan     │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│ Staff Keuangan  │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│    Ketua 1      │ ── approve/revisi ──┤
└────────┬────────┘                      │
         ▼                               │
┌─────────────────┐                      │
│    Ketua 2      │ ── approve/revisi ──┘
└────────┬────────┘
         ▼
┌─────────────────┐
│   Ketua Umum    │ ── approve → SELESAI
└─────────────────┘
```

### 6.2 Workflow LPJ

```
Unit membuat LPJ
      │
      ▼
┌──────────────┐
│   Direktur   │ ── validasi/revisi
└──────┬───────┘
       ▼
┌──────────────┐
│   Keuangan   │ ── verifikasi
└──────┬───────┘
       ▼
┌──────────────┐
│  Bendahara   │ ── approval
└──────┬───────┘
       ▼
┌──────────────┐
│  Ketua/Ketum │ ── final approval → SELESAI
└──────────────┘
```

### 6.3 Workflow Email/Surat

```
User membuat surat
       │
       ▼
┌────────────────┐
│  Ditujukan ke  │ ── role/jabatan tertentu
└───────┬────────┘
        ▼
  Review & Approval
        │
        ▼
  Arsip / Balas
```

---

## 7. API Endpoints

### 7.1 Public Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/users` | Register user baru |
| POST | `/api/users/login` | Login (return token) |
| GET | `/api/pengajuanAnggarans/all` | Semua pengajuan |
| GET | `/api/lpjs/all` | Semua LPJ |

### 7.2 Protected Endpoints (Butuh Authorization Header)

#### Users
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/users/all` | Semua user |
| GET | `/api/users/current` | User saat ini |
| PATCH | `/api/users/current` | Update profile |
| DELETE | `/api/users/logout` | Logout |

#### Units
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/units` | Buat unit |
| GET | `/api/units/all` | Semua unit |
| GET | `/api/units/{id}` | Detail unit |
| GET | `/api/units` | Search unit |

#### Mata Anggaran
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/units/{id}/mataAnggarans` | Buat mata anggaran |
| GET | `/api/units/{id}/mataAnggarans` | List per unit |
| GET | `/api/mataAnggarans/all` | Semua mata anggaran |
| GET | `/api/units/{id}/mataAnggarans/{id}` | Detail |

#### Sub Mata Anggaran
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/units/{id}/mataAnggarans/{id}/subMataAnggarans` | List |
| GET | `/api/subMataAnggarans/all` | Semua |
| GET | `/api/.../subMataAnggarans/{id}` | Detail |

#### Detail Mata Anggaran
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/.../detailMataAnggarans` | List |
| GET | `/api/detailMataAnggarans/all` | Semua |
| GET | `/api/.../detailMataAnggarans/{id}` | Detail |

#### Pengajuan Anggaran
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/pengajuanAnggarans` | Search |
| GET | `/api/pengajuanAnggarans/{id}` | Detail |

#### Detail Pengajuan
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/detailPengajuans` | Search |
| GET | `/api/detailPengajuans/all` | Semua |
| GET | `/api/detailPengajuans/{id}` | Detail |

---

## 8. Daftar Controller & Method

### 8.1 AdminController (Terbesar - 100+ method)

**User Management:**
- `dataUser()` - List semua user
- `createUser()` - Form buat user
- `storeUser()` - Simpan user baru
- `editUser($id)` - Form edit user
- `updateUser($id)` - Update user
- `deleteUser($id)` - Hapus user
- `updatePasswordUser($id)` - Update password

**RAPBS:**
- `dataRapbs()` - List RAPBS
- `dataRapbsSearch()` - Search RAPBS
- `dataRapbsRekapMataAnggaran($unitName)` - Rekap per unit

**APBS:**
- `dataApbs()` - List APBS
- `createApbs()` - Form APBS
- `storeApbs()` - Simpan APBS
- `editApbs($id)` - Edit APBS
- `updateApbs($id)` - Update APBS
- `deleteApbs($id)` - Hapus APBS

**Mata Anggaran:**
- `dataMataAnggaran()` - List mata anggaran
- `createMataAnggaran()` - Form buat
- `detailMataAnggaran($id)` - Detail
- `storeMataAnggaran()` - Simpan
- `updateMataAnggaran($id)` - Update
- `deleteMataAnggaran($id)` - Hapus

**Pengajuan:**
- `dataPengajuan()` - List pengajuan
- `createPengajuan()` - Form buat
- `detailPengajuan($id)` - Detail
- `storePengajuan()` - Simpan
- `updatePengajuan($id)` - Update
- `deletePengajuan($id)` - Hapus
- `lampiranPengajuan($id)` - Lampiran
- `printPengajuan($id)` - Cetak

**LPJ:**
- `dataLpj()` - List LPJ
- `createLpj()` - Form buat
- `detailLpj($id)` - Detail
- `storeLpj()` - Simpan
- `deleteLpj($id)` - Hapus
- `lampiranLpj($id)` - Lampiran

**Laporan:**
- `laporanPengajuan()` - Laporan pengajuan
- `laporanCawuUnit()` - Laporan CAWU per unit
- `laporanCawuGabungan()` - Laporan CAWU gabungan
- `laporanAccounting()` - Laporan akuntansi

**Accounting/COA:**
- `dataAccounting()` - Data accounting
- `dataAccountingUnit()` - Per unit
- `accountingSubMataAnggaran($unit_id, $mata_anggaran_id)` - Sub detail
- `accountingPengajuan($mata_anggaran_id, $sub_id)` - Pengajuan
- `coaUnit()` / `coaPenerimaan()` / `coaRealisasi()` / `coaPerubahan()` - COA views
- CRUD COA operations

**No Mata Anggaran:**
- Full CRUD operations

**Perubahan Anggaran:**
- Full CRUD operations

### 8.2 Unit Controllers (8 unit - pattern serupa)

Setiap controller (PgController, RaController, TkController, SdController, Smp12Controller, Smp55Controller, Sma33Controller, StebankController) memiliki method:

- `index()` - Dashboard unit
- `dataPengajuan()` - Data pengajuan
- `createPengajuan()` - Buat pengajuan
- `detailPengajuan($id)` - Detail
- `storePengajuan()` - Simpan
- `dataLpj()` - Data LPJ
- `createLpj()` - Buat LPJ
- `dataPerubahan()` - Data perubahan
- `dataOtorisasi()` - Data otorisasi
- `dataRapbs()` - Data RAPBS
- `editProker()` - Edit program kerja

### 8.3 Approval Controllers

**DirekturController, KetuaController, Ketua1Controller, Ketua2Controller, KetumController:**
- `index()` - Dashboard
- `dataPengajuan()` - List pengajuan menunggu approval
- `detailPengajuan($id)` - Detail pengajuan
- `approvePengajuan($id)` - Approve
- `revisiPengajuan($id)` - Minta revisi
- `dataLpj()` - List LPJ
- `detailLpj($id)` - Detail LPJ
- `approveLpj($id)` / `validasiLpj($id)` - Approve/Validasi LPJ

**SekretariatController, BendaharaController, KeuanganController:**
- Similar approval methods
- Additional department-specific features

### 8.4 Support Controllers

**EmailController:**
- `index()` - List surat
- `create()` - Buat surat
- `store()` - Simpan surat
- `show($id)` - Detail surat
- `reply($id)` - Balas surat

**StrategiesController, IndikatorsController, ProkersController, KegiatansController, BagiansController:**
- Full CRUD operations for strategic planning

**CaptchaController:**
- `reloadCaptcha()` - Reload CAPTCHA
- `reloadCaptchaLogin()` - Reload CAPTCHA login

---

## 9. Helper & Utility Functions

### helpers.php (`app/helper/Helpers.php`)

```php
// Format angka ke Rupiah
currency_IDR($value)
// Output: "Rp 1.000.000"

// Konversi angka ke teks Indonesia
penyebut($nilai)
// Internal function

// Konversi angka ke terbilang
terbilang($nilai)
// Output: "Satu Juta Rupiah"
```

---

## 10. Package Dependencies

### 10.1 Production Dependencies

| Package | Versi | Fungsi |
|---------|-------|--------|
| laravel/framework | ^7.0 | Framework utama |
| laravel/passport | ~9.0 | API authentication |
| laravel/ui | ^2.0 | Auth scaffolding |
| maatwebsite/excel | ^3.1 | Export/import Excel |
| mews/captcha | ^3.3 | CAPTCHA |
| realrashid/sweet-alert | ^5.1 | SweetAlert2 |
| mckenziearts/laravel-notify | ^2.1 | Notifikasi |
| smalot/pdfparser | ^2.10 | Parse PDF |
| zendframework/zendpdf | ^2.0 | Generate PDF |
| mike42/escpos-php | ^2.2 | Cetak struk ESC/POS |
| guzzlehttp/guzzle | ^7.9 | HTTP client |
| fruitcake/laravel-cors | ^1.0 | CORS |
| fideloper/proxy | ^4.2 | Proxy |

### 10.2 Dev Dependencies

| Package | Versi | Fungsi |
|---------|-------|--------|
| facade/ignition | ^1.4 | Error handling |
| fzaninotto/faker | ^1.9.1 | Fake data |
| mockery/mockery | ^1.3.1 | Testing mock |
| nunomaduro/collision | ^4.1 | CLI error |
| phpunit/phpunit | ^8.5 | Testing |

---

## 11. Desain Arsitektur Baru (Laravel 12 + React)

### 11.1 Tech Stack Baru

| Layer | Teknologi | Keterangan |
|-------|-----------|------------|
| **Backend** | Laravel 12 | PHP 8.3+, API-first |
| **Frontend** | React 19 + TypeScript | SPA dengan Inertia.js atau full SPA |
| **State Management** | Zustand / TanStack Query | Lightweight & performant |
| **UI Framework** | Tailwind CSS + shadcn/ui | Modern, customizable |
| **Database** | MySQL 8+ | Sama, dengan optimasi |
| **Auth** | Laravel Sanctum | SPA-friendly auth |
| **API** | RESTful + Laravel API Resources | Consistent response |
| **Testing** | Pest PHP + Vitest | Modern testing |
| **Build Tool** | Vite | Fast build |
| **Form** | React Hook Form + Zod | Validation |
| **Table** | TanStack Table | Data tables |
| **Notifications** | Sonner / React Hot Toast | Toast notifications |
| **PDF** | DomPDF / Spatie Laravel PDF | PDF generation |
| **Excel** | Maatwebsite Excel v4 | Export/import |
| **Real-time** | Laravel Reverb / Echo | WebSocket |

### 11.2 Arsitektur Folder (Laravel 12 + React)

```
sianggar-v2/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/
│   │   │   │   ├── V1/
│   │   │   │   │   ├── Auth/
│   │   │   │   │   │   └── AuthController.php
│   │   │   │   │   ├── Admin/
│   │   │   │   │   │   ├── UserController.php
│   │   │   │   │   │   ├── UnitController.php
│   │   │   │   │   │   └── SettingController.php
│   │   │   │   │   ├── Budget/
│   │   │   │   │   │   ├── MataAnggaranController.php
│   │   │   │   │   │   ├── SubMataAnggaranController.php
│   │   │   │   │   │   ├── DetailMataAnggaranController.php
│   │   │   │   │   │   ├── ApbsController.php
│   │   │   │   │   │   └── RapbsController.php
│   │   │   │   │   ├── Proposal/
│   │   │   │   │   │   ├── PengajuanController.php
│   │   │   │   │   │   ├── DetailPengajuanController.php
│   │   │   │   │   │   ├── ApprovalController.php
│   │   │   │   │   │   └── PerubahanController.php
│   │   │   │   │   ├── Report/
│   │   │   │   │   │   ├── LpjController.php
│   │   │   │   │   │   ├── AccountingController.php
│   │   │   │   │   │   └── LaporanController.php
│   │   │   │   │   ├── Planning/
│   │   │   │   │   │   ├── StrategyController.php
│   │   │   │   │   │   ├── IndicatorController.php
│   │   │   │   │   │   ├── ProkerController.php
│   │   │   │   │   │   ├── ActivityController.php
│   │   │   │   │   │   ├── SectionController.php
│   │   │   │   │   │   └── PktController.php
│   │   │   │   │   └── Communication/
│   │   │   │   │       ├── EmailController.php
│   │   │   │   │       └── EmailReplyController.php
│   │   │   │   └── V2/ (future)
│   │   │   └── Web/
│   │   │       └── SpaController.php
│   │   ├── Middleware/
│   │   │   ├── EnsureUserHasRole.php          # Single middleware untuk semua role
│   │   │   └── EnsureApiAuthenticated.php
│   │   ├── Requests/
│   │   │   ├── Auth/
│   │   │   ├── Budget/
│   │   │   ├── Proposal/
│   │   │   ├── Report/
│   │   │   └── Planning/
│   │   └── Resources/                         # API Resources (JSON transform)
│   │       ├── UserResource.php
│   │       ├── UnitResource.php
│   │       ├── MataAnggaranResource.php
│   │       ├── PengajuanResource.php
│   │       ├── LpjResource.php
│   │       └── ...
│   ├── Models/
│   │   ├── User.php
│   │   ├── Unit.php
│   │   ├── MataAnggaran.php
│   │   ├── SubMataAnggaran.php
│   │   ├── DetailMataAnggaran.php
│   │   ├── PengajuanAnggaran.php
│   │   ├── DetailPengajuan.php
│   │   ├── Lpj.php
│   │   ├── Strategy.php
│   │   ├── Indicator.php
│   │   ├── Proker.php
│   │   ├── Activity.php
│   │   ├── Section.php
│   │   ├── Pkt.php
│   │   ├── Email.php
│   │   ├── EmailReply.php
│   │   ├── Apbs.php
│   │   ├── Revenue.php (Penerimaan)
│   │   ├── BudgetRealization.php (RealisasiAnggaran)
│   │   ├── BudgetItemNumber.php (NoMataAnggaran)
│   │   ├── Attachment.php (LampiranMataAnggaran)
│   │   └── SupportingFile.php (FilePendukung)
│   ├── Services/                              # Business Logic Layer (BARU)
│   │   ├── Auth/
│   │   │   └── AuthService.php
│   │   ├── Budget/
│   │   │   ├── BudgetService.php
│   │   │   ├── BudgetCalculationService.php
│   │   │   └── ApbsService.php
│   │   ├── Proposal/
│   │   │   ├── ProposalService.php
│   │   │   └── ApprovalService.php            # Centralized approval logic
│   │   ├── Report/
│   │   │   ├── LpjService.php
│   │   │   ├── AccountingService.php
│   │   │   └── ReportGeneratorService.php
│   │   ├── Planning/
│   │   │   └── PlanningService.php
│   │   ├── Communication/
│   │   │   └── EmailService.php
│   │   └── Export/
│   │       ├── ExcelExportService.php
│   │       └── PdfExportService.php
│   ├── Enums/                                 # PHP 8.1 Enums (BARU)
│   │   ├── UserRole.php
│   │   ├── ApprovalStatus.php
│   │   ├── ProposalStatus.php
│   │   └── LpjStatus.php
│   ├── Policies/                              # Authorization Policies (BARU)
│   │   ├── PengajuanPolicy.php
│   │   ├── LpjPolicy.php
│   │   └── EmailPolicy.php
│   ├── Events/                                # Event-Driven (BARU)
│   │   ├── ProposalSubmitted.php
│   │   ├── ProposalApproved.php
│   │   ├── ProposalRevised.php
│   │   └── LpjSubmitted.php
│   ├── Listeners/
│   │   ├── SendApprovalNotification.php
│   │   ├── UpdateBudgetBalance.php
│   │   └── LogApprovalAction.php
│   ├── Notifications/                         # Laravel Notifications
│   │   ├── ProposalApprovedNotification.php
│   │   ├── ProposalRevisedNotification.php
│   │   └── NewEmailNotification.php
│   ├── Helpers/
│   │   └── CurrencyHelper.php
│   └── Providers/
│       ├── AppServiceProvider.php
│       ├── AuthServiceProvider.php
│       ├── EventServiceProvider.php
│       └── RouteServiceProvider.php
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   ├── api.php                                # Semua API routes
│   ├── web.php                                # SPA catch-all
│   └── channels.php
├── resources/
│   ├── js/                                    # React Frontend
│   │   ├── app.tsx
│   │   ├── bootstrap.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── models.ts
│   │   │   ├── api.ts
│   │   │   └── enums.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useBudget.ts
│   │   │   ├── useProposal.ts
│   │   │   └── useApproval.ts
│   │   ├── services/                          # API Service Layer
│   │   │   ├── api.ts                         # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── budgetService.ts
│   │   │   ├── proposalService.ts
│   │   │   ├── reportService.ts
│   │   │   └── planningService.ts
│   │   ├── stores/                            # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── budgetStore.ts
│   │   │   └── uiStore.ts
│   │   ├── components/
│   │   │   ├── ui/                            # shadcn/ui components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── RoleBasedLayout.tsx
│   │   │   ├── common/
│   │   │   │   ├── DataTable.tsx              # Reusable data table
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   ├── ApprovalTimeline.tsx
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   ├── CurrencyInput.tsx
│   │   │   │   ├── SearchFilter.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── budget/
│   │   │   │   ├── BudgetCard.tsx
│   │   │   │   ├── BudgetChart.tsx
│   │   │   │   └── BudgetSummary.tsx
│   │   │   ├── proposal/
│   │   │   │   ├── ProposalForm.tsx
│   │   │   │   ├── ProposalDetail.tsx
│   │   │   │   ├── ProposalList.tsx
│   │   │   │   └── ApprovalActions.tsx
│   │   │   └── report/
│   │   │       ├── LpjForm.tsx
│   │   │       ├── LpjDetail.tsx
│   │   │       └── ReportChart.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ForgotPassword.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── UnitDashboard.tsx
│   │   │   │   ├── DirectorDashboard.tsx
│   │   │   │   ├── FinanceDashboard.tsx
│   │   │   │   └── LeadershipDashboard.tsx
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   │   ├── UserList.tsx
│   │   │   │   │   ├── UserCreate.tsx
│   │   │   │   │   └── UserEdit.tsx
│   │   │   │   ├── units/
│   │   │   │   │   └── UnitList.tsx
│   │   │   │   └── settings/
│   │   │   │       └── Settings.tsx
│   │   │   ├── budget/
│   │   │   │   ├── mata-anggaran/
│   │   │   │   │   ├── MataAnggaranList.tsx
│   │   │   │   │   ├── MataAnggaranCreate.tsx
│   │   │   │   │   ├── MataAnggaranDetail.tsx
│   │   │   │   │   └── MataAnggaranEdit.tsx
│   │   │   │   ├── apbs/
│   │   │   │   │   ├── ApbsList.tsx
│   │   │   │   │   └── ApbsForm.tsx
│   │   │   │   ├── rapbs/
│   │   │   │   │   ├── RapbsList.tsx
│   │   │   │   │   └── RapbsDetail.tsx
│   │   │   │   └── coa/
│   │   │   │       ├── CoaList.tsx
│   │   │   │       └── CoaForm.tsx
│   │   │   ├── proposal/
│   │   │   │   ├── PengajuanList.tsx
│   │   │   │   ├── PengajuanCreate.tsx
│   │   │   │   ├── PengajuanDetail.tsx
│   │   │   │   ├── PengajuanEdit.tsx
│   │   │   │   ├── ApprovalQueue.tsx
│   │   │   │   └── PerubahanList.tsx
│   │   │   ├── report/
│   │   │   │   ├── LpjList.tsx
│   │   │   │   ├── LpjCreate.tsx
│   │   │   │   ├── LpjDetail.tsx
│   │   │   │   ├── LaporanPengajuan.tsx
│   │   │   │   ├── LaporanCawu.tsx
│   │   │   │   └── LaporanAccounting.tsx
│   │   │   ├── planning/
│   │   │   │   ├── StrategyList.tsx
│   │   │   │   ├── IndicatorList.tsx
│   │   │   │   ├── ProkerList.tsx
│   │   │   │   ├── ActivityList.tsx
│   │   │   │   ├── SectionList.tsx
│   │   │   │   └── PktList.tsx
│   │   │   └── communication/
│   │   │       ├── EmailList.tsx
│   │   │       ├── EmailCreate.tsx
│   │   │       ├── EmailDetail.tsx
│   │   │       └── EmailReply.tsx
│   │   ├── router/
│   │   │   ├── index.tsx                      # React Router config
│   │   │   ├── routes.tsx                     # Route definitions
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── RoleGuard.tsx
│   │   └── utils/
│   │       ├── currency.ts                    # Format Rupiah
│   │       ├── terbilang.ts                   # Angka ke teks
│   │       ├── date.ts                        # Format tanggal
│   │       └── constants.ts                   # Enum & constants
│   ├── css/
│   │   └── app.css                            # Tailwind CSS
│   └── views/
│       └── app.blade.php                      # SPA entry point
├── tests/
│   ├── Feature/
│   │   ├── Auth/
│   │   ├── Budget/
│   │   ├── Proposal/
│   │   └── Report/
│   └── Unit/
│       ├── Services/
│       └── Models/
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── composer.json
├── package.json
└── .env
```

### 11.3 Perbaikan Arsitektur dari Versi Lama

| Aspek | Lama (Laravel 7) | Baru (Laravel 12 + React) |
|-------|-------------------|---------------------------|
| **Frontend** | Blade Templates (1.870+ file) | React SPA (~100 components) |
| **Middleware** | 40+ middleware (1 per role) | 1 middleware `EnsureUserHasRole` dengan parameter |
| **Controllers** | 65 controllers (banyak duplikasi) | ~20 controllers terstruktur |
| **Business Logic** | Di controller | Service Layer terpisah |
| **Role Management** | String di database | PHP Enum + Spatie Permission |
| **Approval** | Field per-stage di model | Approval Service + Event-Driven |
| **API** | Partial REST | Full RESTful API Resources |
| **Auth** | Passport (overkill untuk web) | Sanctum (SPA-optimized) |
| **Validation** | Mix controller + request | Form Requests + Zod (frontend) |
| **Notifications** | SweetAlert (server-side) | Toast (client-side) + Laravel Notifications |
| **State** | Full page reload | SPA with client-side state |
| **Search/Filter** | Server-side per page | Reusable DataTable component |
| **PDF** | ZendPDF (deprecated) | DomPDF / Spatie PDF |

### 11.4 Middleware Baru (Simplified)

```php
// LAMA: 40+ middleware files
// app/Http/Middleware/Admin.php
// app/Http/Middleware/Direktur.php
// app/Http/Middleware/Ketua.php
// ... 37 more files

// BARU: 1 middleware file
// app/Http/Middleware/EnsureUserHasRole.php
class EnsureUserHasRole
{
    public function handle($request, Closure $next, string ...$roles)
    {
        if (!in_array($request->user()->role, $roles)) {
            abort(403);
        }
        return $next($request);
    }
}

// Usage in routes:
Route::middleware(['auth:sanctum', 'role:admin'])->group(fn() => ...);
Route::middleware(['auth:sanctum', 'role:direktur,ketua,ketum'])->group(fn() => ...);
```

### 11.5 Enum untuk Role & Status

```php
// app/Enums/UserRole.php
enum UserRole: string
{
    case Admin = 'admin';
    case Direktur = 'direktur';
    case Ketua = 'ketua';
    case Ketua1 = 'ketua-1';
    case Ketua2 = 'ketua-2';
    case Ketum = 'ketum';
    case Sekretariat = 'sekretariat';
    case Sekretaris = 'sekretaris';
    case Bendahara = 'bendahara';
    case Keuangan = 'keuangan';
    case Akuntansi = 'akuntansi';
    case Kasir = 'kasir';
    case SDM = 'sdm';
    case Umum = 'umum';
    case KabagSdmUmum = 'kabag-sdm-umum';
    case StaffDirektur = 'staff-direktur';
    case StaffSekretariat = 'staff-sekretariat';
    case StaffKeuangan = 'staff-keuangan';
    case PG = 'pg';
    case RA = 'ra';
    case TK = 'tk';
    case SD = 'sd';
    case SMP12 = 'smp12';
    case SMP55 = 'smp55';
    case SMA33 = 'sma33';
    case Stebank = 'stebank';
    case Unit = 'unit';
    case Asrama = 'asrama';
    case Litbang = 'litbang';
    case Laz = 'laz';
    case Pembangunan = 'pembangunan';
}

// app/Enums/ApprovalStatus.php
enum ApprovalStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Revised = 'revised';
    case Rejected = 'rejected';
}

// app/Enums/ProposalStatus.php
enum ProposalStatus: string
{
    case Draft = 'draft';
    case Submitted = 'submitted';
    case InReview = 'in_review';
    case Approved = 'approved';
    case Revised = 'revised';
    case Rejected = 'rejected';
    case Paid = 'paid';
}
```

---

## 12. Rencana Migrasi Database

### 12.1 Perbaikan Schema

#### Normalisasi Approval System

**LAMA** - Approval fields langsung di tabel `pengajuan_anggaran`:
```
approve_kabag, noted_kabag, date_kabag, time_kabag, cek_kabag,
approve_staff, noted_staff, date_staff, time_staff, cek_staff,
... (12+ stages x 5 fields = 60+ columns)
```

**BARU** - Tabel terpisah `approvals`:
```sql
CREATE TABLE approvals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    approvable_type VARCHAR(255),       -- 'App\Models\PengajuanAnggaran' / 'App\Models\Lpj'
    approvable_id BIGINT,               -- Polymorphic relation
    stage VARCHAR(50),                  -- 'kabag', 'staff', 'perguruan', etc.
    stage_order INT,                    -- 1, 2, 3, ... (urutan)
    status ENUM('pending','approved','revised','rejected') DEFAULT 'pending',
    approved_by BIGINT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_approvable (approvable_type, approvable_id),
    INDEX idx_stage (stage)
);
```

#### Tabel Baru yang Disarankan

```sql
-- Activity Log / Audit Trail
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100),
    model_type VARCHAR(255),
    model_id BIGINT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP
);

-- Notifications (untuk in-app notification)
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY,
    type VARCHAR(255),
    notifiable_type VARCHAR(255),
    notifiable_id BIGINT,
    data JSON,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP
);

-- File Attachments (unified)
CREATE TABLE attachments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    attachable_type VARCHAR(255),
    attachable_id BIGINT,
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_mime VARCHAR(100),
    file_size BIGINT,
    uploaded_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP
);

-- Fiscal Years (tahun anggaran)
CREATE TABLE fiscal_years (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    year YEAR,
    is_active BOOLEAN DEFAULT FALSE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 12.2 Index Optimasi

```sql
-- Performance indexes
ALTER TABLE pengajuan_anggaran ADD INDEX idx_unit_tahun (unit, tahun);
ALTER TABLE pengajuan_anggaran ADD INDEX idx_status (status_proses);
ALTER TABLE pengajuan_anggaran ADD INDEX idx_user (user_id);
ALTER TABLE mata_anggarans ADD INDEX idx_unit_tahun (unit_id, tahun);
ALTER TABLE detail_mata_anggarans ADD INDEX idx_unit_tahun (unit_id, tahun);
ALTER TABLE lpjs ADD INDEX idx_unit_tahun (unit, tahun);
ALTER TABLE emails ADD INDEX idx_user_status (user_id, status);
```

---

## 13. Desain API Baru

### 13.1 API Versioning & Convention

```
Base URL: /api/v1

Response format:
{
    "status": "success" | "error",
    "message": "...",
    "data": { ... } | [...],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 100,
        "last_page": 7
    }
}
```

### 13.2 Endpoint Catalog

#### Authentication
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

#### Users (Admin only)
```
GET    /api/v1/users                    # List users (paginated, filterable)
POST   /api/v1/users                    # Create user
GET    /api/v1/users/{id}               # Get user detail
PUT    /api/v1/users/{id}               # Update user
DELETE /api/v1/users/{id}               # Delete user
PATCH  /api/v1/users/{id}/password      # Update password
```

#### Units
```
GET    /api/v1/units                    # List units
POST   /api/v1/units                    # Create unit
GET    /api/v1/units/{id}               # Get unit detail
PUT    /api/v1/units/{id}               # Update unit
DELETE /api/v1/units/{id}               # Delete unit
```

#### Mata Anggaran (Budget Items)
```
GET    /api/v1/mata-anggaran                        # List (filter: unit, tahun)
POST   /api/v1/mata-anggaran                        # Create
GET    /api/v1/mata-anggaran/{id}                    # Detail
PUT    /api/v1/mata-anggaran/{id}                    # Update
DELETE /api/v1/mata-anggaran/{id}                    # Delete
GET    /api/v1/mata-anggaran/{id}/sub                # List sub mata anggaran
POST   /api/v1/mata-anggaran/{id}/sub                # Create sub
GET    /api/v1/mata-anggaran/{id}/sub/{subId}        # Detail sub
GET    /api/v1/mata-anggaran/{id}/sub/{subId}/detail  # List detail
POST   /api/v1/mata-anggaran/{id}/sub/{subId}/detail  # Create detail
```

#### APBS
```
GET    /api/v1/apbs                     # List (filter: unit, tahun)
POST   /api/v1/apbs                     # Create
PUT    /api/v1/apbs/{id}                # Update
DELETE /api/v1/apbs/{id}                # Delete
```

#### RAPBS
```
GET    /api/v1/rapbs                    # List (filter: unit, tahun)
GET    /api/v1/rapbs/rekap/{unit}       # Rekap per unit
```

#### Pengajuan Anggaran (Budget Proposals)
```
GET    /api/v1/pengajuan                # List (filter: unit, tahun, status)
POST   /api/v1/pengajuan                # Create
GET    /api/v1/pengajuan/{id}           # Detail (include: details, approvals)
PUT    /api/v1/pengajuan/{id}           # Update
DELETE /api/v1/pengajuan/{id}           # Delete
GET    /api/v1/pengajuan/{id}/lampiran  # Get attachments
POST   /api/v1/pengajuan/{id}/lampiran  # Upload attachment
GET    /api/v1/pengajuan/{id}/print     # Generate print PDF

# Approval actions
POST   /api/v1/pengajuan/{id}/approve   # Approve (body: { stage, notes })
POST   /api/v1/pengajuan/{id}/revise    # Request revision
POST   /api/v1/pengajuan/{id}/reject    # Reject

# Approval queue (for approvers)
GET    /api/v1/approval-queue           # Pending approvals for current user
```

#### Perubahan Anggaran (Budget Amendments)
```
GET    /api/v1/perubahan                # List
POST   /api/v1/perubahan                # Create
GET    /api/v1/perubahan/{id}           # Detail
PUT    /api/v1/perubahan/{id}           # Update
DELETE /api/v1/perubahan/{id}           # Delete
```

#### LPJ (Reports)
```
GET    /api/v1/lpj                      # List (filter: unit, tahun, status)
POST   /api/v1/lpj                      # Create
GET    /api/v1/lpj/{id}                 # Detail
PUT    /api/v1/lpj/{id}                 # Update
DELETE /api/v1/lpj/{id}                 # Delete
POST   /api/v1/lpj/{id}/approve        # Approve
POST   /api/v1/lpj/{id}/revise         # Request revision
POST   /api/v1/lpj/{id}/validate       # Validate (direktur)
```

#### Laporan (Reporting)
```
GET    /api/v1/laporan/pengajuan        # Laporan pengajuan
GET    /api/v1/laporan/cawu-unit        # Laporan CAWU per unit
GET    /api/v1/laporan/cawu-gabungan    # Laporan CAWU gabungan
GET    /api/v1/laporan/accounting       # Laporan accounting
GET    /api/v1/laporan/export/excel     # Export Excel
GET    /api/v1/laporan/export/pdf       # Export PDF
```

#### COA (Chart of Accounts)
```
GET    /api/v1/coa/unit                 # COA per unit
GET    /api/v1/coa/penerimaan           # COA penerimaan
GET    /api/v1/coa/realisasi            # COA realisasi
POST   /api/v1/coa/penerimaan           # Create penerimaan
PUT    /api/v1/coa/penerimaan/{id}      # Update penerimaan
DELETE /api/v1/coa/penerimaan/{id}      # Delete penerimaan
POST   /api/v1/coa/realisasi            # Create realisasi
PUT    /api/v1/coa/realisasi/{id}       # Update realisasi
DELETE /api/v1/coa/realisasi/{id}       # Delete realisasi
```

#### Perencanaan Strategis (Strategic Planning)
```
# Strategies
GET    /api/v1/strategies               # List
POST   /api/v1/strategies               # Create
PUT    /api/v1/strategies/{id}          # Update
DELETE /api/v1/strategies/{id}          # Delete

# Indicators
GET    /api/v1/indicators               # List (filter: strategy_id)
POST   /api/v1/indicators               # Create
PUT    /api/v1/indicators/{id}          # Update
DELETE /api/v1/indicators/{id}          # Delete

# Work Programs (Proker)
GET    /api/v1/prokers                  # List (filter: strategy, indicator, section)
POST   /api/v1/prokers                  # Create
PUT    /api/v1/prokers/{id}             # Update
DELETE /api/v1/prokers/{id}             # Delete

# Activities
GET    /api/v1/activities               # List
POST   /api/v1/activities               # Create
PUT    /api/v1/activities/{id}          # Update
DELETE /api/v1/activities/{id}          # Delete

# Sections
GET    /api/v1/sections                 # List
POST   /api/v1/sections                 # Create
PUT    /api/v1/sections/{id}            # Update
DELETE /api/v1/sections/{id}            # Delete

# PKT
GET    /api/v1/pkt                      # List (filter: unit, tahun)
POST   /api/v1/pkt                      # Create
PUT    /api/v1/pkt/{id}                 # Update
DELETE /api/v1/pkt/{id}                 # Delete
```

#### Email/Surat Internal
```
GET    /api/v1/emails                   # List (filter: status, ditujukan)
POST   /api/v1/emails                   # Create & send
GET    /api/v1/emails/{id}              # Detail
DELETE /api/v1/emails/{id}              # Delete
POST   /api/v1/emails/{id}/reply        # Reply
POST   /api/v1/emails/{id}/approve      # Approve
POST   /api/v1/emails/{id}/archive      # Archive
GET    /api/v1/emails/archives          # Archived emails
```

#### Dashboard Statistics
```
GET    /api/v1/dashboard/stats          # Dashboard statistics (role-aware)
GET    /api/v1/dashboard/charts         # Chart data
GET    /api/v1/dashboard/recent         # Recent activities
GET    /api/v1/dashboard/pending        # Pending approvals count
```

---

## 14. Desain UI/UX React

### 14.1 Layout System

```
┌──────────────────────────────────────────────────────┐
│  Navbar (logo, search, notifications, user profile)  │
├───────────┬──────────────────────────────────────────┤
│           │                                          │
│  Sidebar  │              Main Content                │
│           │                                          │
│  - Menu   │  ┌──────────────────────────────────┐   │
│  - Items  │  │  Page Header (title, breadcrumb) │   │
│  - Based  │  ├──────────────────────────────────┤   │
│  - On     │  │                                  │   │
│  - Role   │  │       Page Content               │   │
│           │  │                                  │   │
│           │  │  - Cards                         │   │
│           │  │  - Tables                        │   │
│           │  │  - Forms                         │   │
│           │  │  - Charts                        │   │
│           │  │                                  │   │
│           │  └──────────────────────────────────┘   │
│           │                                          │
└───────────┴──────────────────────────────────────────┘
```

### 14.2 Halaman Utama per Role

#### Admin Dashboard
- Stats cards: Total user, total pengajuan, total LPJ, total anggaran
- Chart: Anggaran vs realisasi per unit
- Table: Pengajuan terbaru
- Quick actions: Buat user, buat mata anggaran

#### Unit Dashboard (PG/RA/TK/SD/SMP/SMA/Stebank)
- Stats cards: Saldo anggaran, pengajuan pending, LPJ pending
- Chart: Penggunaan anggaran per bulan
- Table: Pengajuan terbaru
- Quick actions: Buat pengajuan, buat LPJ

#### Direktur/Ketua Dashboard
- Stats cards: Approval pending, total approved, total revised
- Table: Antrian approval
- Timeline: Recent approval activities

#### Keuangan/Bendahara Dashboard
- Stats cards: Total penerimaan, total pengeluaran, saldo
- Chart: Cash flow
- Table: Pengajuan menunggu verifikasi

### 14.3 Komponen Reusable

1. **DataTable** - Tabel data dengan sorting, filtering, pagination, export
2. **ApprovalTimeline** - Visualisasi progress approval multi-stage
3. **StatusBadge** - Badge warna untuk status (pending=kuning, approved=hijau, revised=merah)
4. **CurrencyInput** - Input format Rupiah otomatis
5. **FileUpload** - Upload file dengan drag & drop
6. **SearchFilter** - Filter komponen dengan multi-criteria
7. **ConfirmDialog** - Dialog konfirmasi aksi (delete, approve, revise)
8. **BudgetChart** - Chart anggaran (bar, pie, line)
9. **RoleBasedMenu** - Menu sidebar berdasarkan role
10. **BreadcrumbNav** - Navigasi breadcrumb otomatis

### 14.4 Routing React

```typescript
// Simplified route structure
const routes = [
  // Auth
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },

  // Protected routes
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      // Dashboard (role-aware - single route, component decides view)
      { path: 'dashboard', element: <Dashboard /> },

      // Admin
      { path: 'admin/users', element: <RoleGuard roles={['admin']}><UserList /></RoleGuard> },
      { path: 'admin/users/create', element: <UserCreate /> },
      { path: 'admin/users/:id/edit', element: <UserEdit /> },

      // Budget Management
      { path: 'budget/mata-anggaran', element: <MataAnggaranList /> },
      { path: 'budget/mata-anggaran/create', element: <MataAnggaranCreate /> },
      { path: 'budget/mata-anggaran/:id', element: <MataAnggaranDetail /> },
      { path: 'budget/apbs', element: <ApbsList /> },
      { path: 'budget/rapbs', element: <RapbsList /> },
      { path: 'budget/coa', element: <CoaList /> },

      // Proposals
      { path: 'pengajuan', element: <PengajuanList /> },
      { path: 'pengajuan/create', element: <PengajuanCreate /> },
      { path: 'pengajuan/:id', element: <PengajuanDetail /> },
      { path: 'pengajuan/:id/edit', element: <PengajuanEdit /> },
      { path: 'perubahan', element: <PerubahanList /> },

      // Approvals
      { path: 'approvals', element: <ApprovalQueue /> },

      // LPJ
      { path: 'lpj', element: <LpjList /> },
      { path: 'lpj/create', element: <LpjCreate /> },
      { path: 'lpj/:id', element: <LpjDetail /> },

      // Reports
      { path: 'laporan/pengajuan', element: <LaporanPengajuan /> },
      { path: 'laporan/cawu', element: <LaporanCawu /> },
      { path: 'laporan/accounting', element: <LaporanAccounting /> },

      // Strategic Planning
      { path: 'planning/strategies', element: <StrategyList /> },
      { path: 'planning/indicators', element: <IndicatorList /> },
      { path: 'planning/prokers', element: <ProkerList /> },
      { path: 'planning/activities', element: <ActivityList /> },
      { path: 'planning/sections', element: <SectionList /> },
      { path: 'planning/pkt', element: <PktList /> },

      // Communication
      { path: 'emails', element: <EmailList /> },
      { path: 'emails/create', element: <EmailCreate /> },
      { path: 'emails/:id', element: <EmailDetail /> },
    ]
  }
];
```

**Catatan penting**: Dengan React SPA, kita TIDAK perlu lagi route terpisah per role (admin, pg, ra, tk, dll). Cukup 1 set route, dan konten/akses diatur oleh `RoleGuard` component dan API-level authorization.

---

## 15. Tahapan Implementasi

### Phase 1: Foundation
- [ ] Setup project Laravel 12 + React + Vite + TypeScript
- [ ] Setup database (migrasi schema dari lama + perbaikan)
- [ ] Implementasi autentikasi (Sanctum)
- [ ] Implementasi middleware role-based (single middleware)
- [ ] Setup Enum untuk role & status
- [ ] Buat model Eloquent dengan relationship
- [ ] Setup React dengan routing, layout, Tailwind + shadcn/ui

### Phase 2: Core Features
- [ ] API & UI - User Management (CRUD)
- [ ] API & UI - Unit Management (CRUD)
- [ ] API & UI - Mata Anggaran (CRUD + Sub + Detail)
- [ ] API & UI - Dashboard (role-aware statistics & charts)

### Phase 3: Budget & Proposal
- [ ] API & UI - APBS Management
- [ ] API & UI - RAPBS Management
- [ ] API & UI - Pengajuan Anggaran (CRUD)
- [ ] API & UI - Detail Pengajuan
- [ ] API & UI - Approval Workflow (multi-stage)
- [ ] API & UI - Perubahan Anggaran

### Phase 4: Reporting
- [ ] API & UI - LPJ (CRUD + approval)
- [ ] API & UI - Laporan Pengajuan
- [ ] API & UI - Laporan CAWU (per unit & gabungan)
- [ ] API & UI - Accounting & COA
- [ ] Export Excel & PDF

### Phase 5: Planning & Communication
- [ ] API & UI - Strategic Planning (strategies, indicators, prokers, activities, sections)
- [ ] API & UI - PKT (Program Kerja Tahunan)
- [ ] API & UI - Email/Surat Internal
- [ ] API & UI - Notifikasi & Activity Log

### Phase 6: Enhancement
- [ ] File management & upload
- [ ] Real-time notifications (Laravel Reverb)
- [ ] Print/PDF generation
- [ ] Search optimization
- [ ] Performance optimization & caching
- [ ] Testing (Feature + Unit tests)

### Phase 7: Migration & Deployment
- [ ] Data migration dari database lama
- [ ] User acceptance testing (UAT)
- [ ] Documentation
- [ ] Production deployment

---

## Catatan Penting untuk Pengembangan

1. **Eliminasi Duplikasi**: 8 unit controller yang identik akan digabung jadi 1 controller + filter unit
2. **Service Layer**: Semua business logic dipindah ke Service classes, bukan di Controller
3. **Approval System**: Gunakan polymorphic relation + tabel `approvals` agar scalable
4. **API Resources**: Setiap response API konsisten menggunakan Laravel API Resources
5. **Frontend State**: Gunakan TanStack Query untuk server state, Zustand untuk client state
6. **Type Safety**: TypeScript di frontend, PHP strict types di backend
7. **Testing**: Pest PHP untuk backend, Vitest untuk frontend
8. **Real-time**: Laravel Reverb untuk notifikasi real-time approval

---

*Dokumen ini dibuat sebagai panduan lengkap untuk migrasi SIANGGAR dari Laravel 7 (Blade) ke Laravel 12 (React).*
*Terakhir diperbarui: 4 Februari 2026*
