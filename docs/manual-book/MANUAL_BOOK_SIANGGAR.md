# MANUAL BOOK APLIKASI SIANGGAR

**Sistem Informasi Anggaran**

---

> **Versi:** 1.0.0  
> **Tanggal:** April 2026  
> **Instansi:** Yayasan Asrama Pelajar Islam
> **Dibuat oleh:** Tim IT YAPI

---

## DAFTAR ISI

- [BAB 1 — Pendahuluan](#bab-1--pendahuluan)
- [BAB 2 — Memulai Aplikasi](#bab-2--memulai-aplikasi)
- [BAB 3 — Role & Hak Akses](#bab-3--role--hak-akses)
- [BAB 4 — Dashboard](#bab-4--dashboard)
- [BAB 5 — Modul Mata Anggaran](#bab-5--modul-mata-anggaran)
- [BAB 6 — Modul COA (Chart of Account)](#bab-6--modul-coa-chart-of-account)
- [BAB 7 — Modul RAPBS](#bab-7--modul-rapbs)
- [BAB 8 — Modul APBS](#bab-8--modul-apbs)
- [BAB 9 — Modul Pengajuan Anggaran](#bab-9--modul-pengajuan-anggaran)
- [BAB 10 — Modul Approval Pengajuan](#bab-10--modul-approval-pengajuan)
- [BAB 11 — Modul Diskusi](#bab-11--modul-diskusi)
- [BAB 12 — Modul Perubahan Anggaran](#bab-12--modul-perubahan-anggaran)
- [BAB 13 — Modul LPJ](#bab-13--modul-lpj-laporan-pertanggungjawaban)
- [BAB 14 — Modul Laporan](#bab-14--modul-laporan)
- [BAB 15 — Modul SIPAKAT (Perencanaan)](#bab-15--modul-sipakat-perencanaan)
- [BAB 16 — Modul Surat Internal](#bab-16--modul-surat-internal)
- [BAB 17 — Modul Admin](#bab-17--modul-admin)
- [BAB 18 — Alur Kerja Lengkap](#bab-18--alur-kerja-lengkap)
- [BAB 19 — Panduan Per Role](#bab-19--panduan-per-role)
- [BAB 20 — Notifikasi & Komunikasi](#bab-20--notifikasi--komunikasi)
- [BAB 21 — Tips & Troubleshooting](#bab-21--tips--troubleshooting)
- [Lampiran](#lampiran)

---

---

# BAB 1 — PENDAHULUAN

## 1.1 Tentang SIANGGAR

**SIANGGAR** (Sistem Informasi Anggaran) adalah aplikasi berbasis web yang dirancang khusus untuk mengelola seluruh siklus anggaran di lingkungan Yayasan Al Azhar. Aplikasi ini mencakup proses perencanaan, pengajuan, persetujuan, pembayaran, hingga pelaporan anggaran secara digital dan terintegrasi.

SIANGGAR menggantikan proses manual berbasis kertas sehingga:
- Proses approval lebih cepat dan terdokumentasi
- Data anggaran real-time dan akurat
- Audit trail lengkap untuk setiap transaksi
- Pengurangan risiko human error

## 1.2 Tujuan Sistem

| Tujuan | Keterangan |
|--------|------------|
| **Efisiensi** | Mempersingkat waktu proses pengajuan dan approval anggaran |
| **Transparansi** | Setiap tahap approval tercatat dan dapat dilacak |
| **Akuntabilitas** | Setiap perubahan data tercatat beserta pelakunya |
| **Integrasi** | Menghubungkan perencanaan (SIPAKAT) → anggaran (RAPBS/APBS) → realisasi (Pengajuan/LPJ) |
| **Pelaporan** | Laporan keuangan tersedia kapan saja secara real-time |

## 1.3 Ruang Lingkup

SIANGGAR mencakup modul-modul berikut:

1. **Master Anggaran** — Mata Anggaran, COA, RAPBS, APBS
2. **Pengajuan** — Pengajuan Anggaran, Perubahan Anggaran
3. **Approval** — Multi-level workflow approval
4. **Laporan** — LPJ, Laporan Pengajuan, Laporan Akuntansi
5. **Perencanaan (SIPAKAT)** — Strategi, Proker, PKT
6. **Komunikasi** — Surat Internal
7. **Administrasi** — User, Unit, Role & Permission

## 1.4 Daftar Istilah

| Istilah | Kepanjangan / Keterangan |
|---------|--------------------------|
| **SIANGGAR** | Sistem Informasi Anggaran |
| **RAPBS** | Rencana Anggaran Pendapatan dan Belanja Sekolah |
| **APBS** | Anggaran Pendapatan dan Belanja Sekolah |
| **COA** | Chart of Account — Struktur rekening anggaran |
| **LPJ** | Laporan Pertanggungjawaban |
| **PKT** | Program Kerja Tahunan |
| **SIPAKAT** | Sistem Perencanaan dan Kegiatan Tahunan |
| **Mata Anggaran** | Rekening/akun anggaran utama |
| **Sub Mata Anggaran** | Sub-rekening dari Mata Anggaran |
| **Detail Mata Anggaran** | Rincian spesifik dari Sub Mata Anggaran |
| **Pengajuan** | Permohonan pencairan anggaran |
| **Proker** | Program Kerja |
| **TA** | Tahun Anggaran |
| **CMS** | Cash Management System (sistem perbankan) |
| **Voucher** | Dokumen bukti pembayaran |

---

# BAB 2 — MEMULAI APLIKASI

## 2.1 Akses Aplikasi

SIANGGAR diakses melalui browser (Chrome, Firefox, Edge, Safari) menggunakan alamat:

```
https://sianggar.yapinet.id
```

> **ℹ️ INFO:** Gunakan browser versi terbaru untuk pengalaman terbaik. Resolusi layar minimal yang direkomendasikan adalah 1280×720 piksel.

> **⚠️ PERHATIAN:** Akses aplikasi memerlukan koneksi internet. Pastikan perangkat Anda terhubung ke jaringan.

## 2.2 Halaman Login

---
> **📸 SCREENSHOT — Halaman Login**
> - **URL:** `/login`
> - **Tampilkan:** Form login dengan field Email, Password, tombol "Masuk", dan logo SIANGGAR
---

**Langkah Login:**

1. Buka browser dan akses URL aplikasi
2. Masukkan **Email** yang telah terdaftar di sistem
3. Masukkan **Password** akun Anda
4. Klik tombol **Masuk**
5. Jika berhasil, Anda akan diarahkan ke halaman Dashboard

> **⚠️ PERHATIAN:** Jika muncul pesan "Kredensial tidak valid", periksa kembali email dan password. Pastikan huruf kapital sesuai.

> **✅ TIPS:** Gunakan fitur "Tampilkan Password" (ikon mata) untuk memastikan password yang diketik sudah benar.

## 2.3 Struktur Tampilan Aplikasi

Setelah login, tampilan aplikasi terdiri dari tiga bagian utama:

---
> **📸 SCREENSHOT — Layout Utama Aplikasi**
> - **URL:** `/dashboard`
> - **Tampilkan:** Tampilan keseluruhan aplikasi dengan Sidebar di kiri, Navbar di atas, dan area konten di tengah
---

### Sidebar (Navigasi Kiri)

Sidebar berisi menu navigasi utama yang dikelompokkan berdasarkan kategori:

| Kategori | Menu |
|----------|------|
| **Utama** | Dashboard |
| **Anggaran** | Mata Anggaran, APBS, RAPBS, COA |
| **Pengajuan** | Pengajuan Baru, Daftar Pengajuan, Perubahan Anggaran |
| **Approval** | Antrian Approval |
| **Laporan** | LPJ, Laporan Pengajuan, Laporan Semester, Laporan Akuntansi |
| **SIPAKAT** | Strategi, Indikator, Proker, Kegiatan, PKT |
| **Komunikasi** | Surat Internal |
| **Admin** | Kelola User, Kelola Unit, Role & Permission |

> **ℹ️ INFO:** Menu yang tampil berbeda-beda tergantung role pengguna. Pengguna hanya melihat menu yang sesuai dengan hak aksesnya.

### Navbar (Bagian Atas)

Navbar menampilkan:
- **Judul halaman** aktif
- **Informasi pengguna** (nama, role, unit)
- **Tombol Logout**
- **Notifikasi** (jika ada)

### Area Konten (Tengah)

Area konten menampilkan halaman yang sedang aktif sesuai menu yang dipilih.

## 2.4 Logout

---
> **📸 SCREENSHOT — Menu Logout**
> - **URL:** `/dashboard`
> - **Tampilkan:** Dropdown menu pengguna di pojok kanan atas dengan opsi Logout
---

**Langkah Logout:**

1. Klik nama pengguna atau ikon profil di pojok kanan atas Navbar
2. Pilih **Keluar** / **Logout**
3. Anda akan diarahkan kembali ke halaman Login

> **✅ TIPS:** Selalu logout setelah selesai menggunakan aplikasi, terutama jika menggunakan perangkat bersama.

---

# BAB 3 — ROLE & HAK AKSES

## 3.1 Konsep Role

SIANGGAR menggunakan sistem **Role-Based Access Control (RBAC)**. Setiap pengguna memiliki satu role yang menentukan fitur dan data apa yang dapat diakses.

## 3.2 Daftar Role dan Kategori

### Kategori A — Unit Pendidikan
Role ini digunakan oleh satuan pendidikan sebagai pengaju anggaran.

| Role | Keterangan |
|------|------------|
| RA Sakinah | Raudlatul Athfal Sakinah |
| Playgroup Sakinah | Playgroup Sakinah |
| TKIA Al Azhar 13 | Taman Kanak-kanak Islam Al Azhar 13 |
| SDIA Al Azhar 13 | Sekolah Dasar Islam Al Azhar 13 |
| SMPIA Al Azhar 12 | Sekolah Menengah Pertama Islam Al Azhar 12 |
| SMPIA Al Azhar 55 | Sekolah Menengah Pertama Islam Al Azhar 55 |
| SMAIA Al Azhar 33 | Sekolah Menengah Atas Islam Al Azhar 33 |

### Kategori B — Substansi (Departemen)
Role ini digunakan oleh departemen/bagian sebagai pengaju anggaran.

| Role | Keterangan |
|------|------------|
| Asrama | Unit Asrama |
| LAZ | Lembaga Amil Zakat |
| Litbang | Lembaga Penelitian dan Pengembangan |
| STEBANK | Sekolah Tinggi Ekonomi dan Bisnis |
| Staf Direktur | Staf dari Direktur |
| Staf Sekretariat | Staf dari Sekretariat |
| SDM | Sumber Daya Manusia |
| Umum | Divisi Umum |
| YTA | PT Yapi Talent Academy |
| Pembangunan | Divisi Pembangunan |

### Kategori C — Approval & Pimpinan
Role ini melakukan persetujuan pada berbagai tahap workflow.

| Role | Fungsi Utama |
|------|-------------|
| Direktur | Approval tahap direktur untuk unit pendidikan |
| Wakil Ketua (Ketua-1) | Approval middle-layer untuk unit pendidikan |
| Ketua Umum (Ketum) | Approval final pimpinan tertinggi + membuka diskusi |
| Sekretaris | Approval middle-layer untuk substansi |
| Kabag SDM & Umum | Approval untuk pengajuan kategori SDM/Umum |
| Staf Direktur | Approval awal untuk pengaju unit |
| Staf Keuangan | Validasi dan routing pengajuan |

### Kategori D — Keuangan & Pembayaran

| Role | Fungsi Utama |
|------|-------------|
| Keuangan | Approval akhir + edit nominal pengajuan |
| Bendahara | Approval final + verifikasi keuangan |
| Kasir | Cetak voucher, route ke Payment |
| Payment | Proses pembayaran via CMS Bank |
| Akuntansi | Akses laporan akuntansi |

### Kategori E — Admin

| Role | Fungsi Utama |
|------|-------------|
| Admin | Akses penuh: kelola user, unit, role, dan semua data |

## 3.3 Matriks Hak Akses

| Fitur | Unit | Substansi | Direktur | Ketum | Keuangan | Bendahara | Kasir | Payment | Admin |
|-------|------|-----------|----------|-------|----------|-----------|-------|---------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mata Anggaran | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ✅ |
| RAPBS | ✅ | ✅ | ✅ | 👁️ | ✅ | ✅ | ❌ | ❌ | ✅ |
| APBS | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ✅ |
| COA | ✅ | ✅ | 👁️ | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ✅ |
| Buat Pengajuan | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approval Pengajuan | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Perubahan Anggaran | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| LPJ | ✅ | ✅ | ✅ | 👁️ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Laporan | 👁️ | 👁️ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| SIPAKAT | ✅ | ✅ | 👁️ | 👁️ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Surat Internal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Kelola User | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Kelola Unit | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Keterangan:** ✅ = Akses penuh | 👁️ = Hanya lihat | ❌ = Tidak ada akses

---

# BAB 4 — DASHBOARD

Dashboard adalah halaman pertama yang tampil setelah login. Isi dashboard berbeda tergantung role pengguna.

---
> **📸 SCREENSHOT — Dashboard Unit/Substansi**
> - **URL:** `/dashboard`
> - **Tampilkan:** Kartu statistik (total pengajuan, total disetujui, saldo tersedia), daftar pengajuan terbaru, grafik anggaran
---

## 4.1 Dashboard Unit / Substansi

Pengguna dengan role unit atau substansi melihat:

| Widget | Keterangan |
|--------|------------|
| **Ringkasan Anggaran** | Total anggaran, terpakai, dan sisa |
| **Pengajuan Terbaru** | Daftar pengajuan beserta statusnya |
| **Pengajuan Pending** | Jumlah pengajuan yang menunggu approval |
| **LPJ Pending** | Jumlah LPJ yang belum selesai |
| **Notifikasi** | Pemberitahuan terbaru (revisi, approval, dll.) |

## 4.2 Dashboard Pimpinan / Approval

---
> **📸 SCREENSHOT — Dashboard Pimpinan**
> - **URL:** `/dashboard`
> - **Tampilkan:** Antrian pengajuan menunggu persetujuan, statistik approval, grafik per unit
---

Pengguna dengan role approval (Direktur, Wakil Ketua, Ketum, Sekretaris, Kabag) melihat:

| Widget | Keterangan |
|--------|------------|
| **Antrian Persetujuan** | Daftar pengajuan yang menunggu tindakan |
| **Statistik Approval** | Total pending, disetujui, ditolak bulan ini |
| **Overview LPJ** | Laporan pertanggungjawaban yang perlu ditinjau |
| **Ringkasan Anggaran** | Overview total anggaran seluruh unit |

## 4.3 Dashboard Keuangan / Bendahara

---
> **📸 SCREENSHOT — Dashboard Keuangan**
> - **URL:** `/dashboard`
> - **Tampilkan:** Widget antrian verifikasi keuangan, edit nominal, status pembayaran
---

| Widget | Keterangan |
|--------|------------|
| **Antrian Verifikasi** | Pengajuan yang siap diverifikasi keuangan |
| **Edit Nominal Pending** | Pengajuan yang nominalnya perlu disesuaikan |
| **Tracking Pembayaran** | Status pembayaran yang sedang diproses |
| **Rekap Realisasi** | Total realisasi anggaran periode ini |

## 4.4 Dashboard Kasir & Payment

---
> **📸 SCREENSHOT — Dashboard Kasir**
> - **URL:** `/dashboard`
> - **Tampilkan:** Antrian voucher siap cetak, riwayat voucher yang sudah dicetak
---

| Widget | Keterangan |
|--------|------------|
| **Antrian Voucher** | Pengajuan Done yang perlu dicetak vouchernya |
| **Antrian Pembayaran** | Voucher yang siap dibayarkan (Payment) |
| **Riwayat Transaksi** | Daftar pembayaran yang sudah selesai |

## 4.5 Dashboard Admin

---
> **📸 SCREENSHOT — Dashboard Admin**
> - **URL:** `/dashboard`
> - **Tampilkan:** Overview keseluruhan sistem: jumlah user, unit, total pengajuan, statistik global
---

| Widget | Keterangan |
|--------|------------|
| **Statistik Pengguna** | Jumlah total user aktif per role |
| **Overview Pengajuan** | Total pengajuan seluruh unit per status |
| **Anggaran Global** | Total anggaran dan realisasi semua unit |
| **Log Aktivitas** | Aktivitas terbaru di sistem |

---

# BAB 5 — MODUL MATA ANGGARAN

## 5.1 Pengertian

**Mata Anggaran** adalah rekening/akun anggaran utama yang menjadi dasar perencanaan dan pencatatan keuangan. Setiap mata anggaran dapat memiliki Sub Mata Anggaran dan Detail Mata Anggaran.

```
Mata Anggaran
└── Sub Mata Anggaran
    └── Detail Mata Anggaran (COA)
        └── Saldo (Awal, Dipakai, Tersedia, Realisasi)
```

## 5.2 Melihat Daftar Mata Anggaran

---
> **📸 SCREENSHOT — Daftar Mata Anggaran**
> - **URL:** `/budget/mata-anggaran`
> - **Tampilkan:** Tabel daftar mata anggaran dengan kolom Kode, Nama, Unit, Tahun, Jumlah Sub, Aksi. Filter tahun dan unit di atas tabel.
---

**Langkah:**
1. Klik menu **Anggaran** → **Mata Anggaran** di sidebar
2. Daftar mata anggaran akan tampil dalam bentuk tabel
3. Gunakan **filter tahun** untuk menyaring berdasarkan tahun anggaran
4. Gunakan **kolom pencarian** untuk mencari berdasarkan kode atau nama
5. Klik ikon **▶** di kiri baris untuk memperluas dan melihat Sub Mata Anggaran

> **ℹ️ INFO:** Pengguna unit hanya melihat mata anggaran milik unitnya sendiri. Admin dapat melihat semua unit.

## 5.3 Menambah Mata Anggaran

---
> **📸 SCREENSHOT — Form Tambah Mata Anggaran**
> - **URL:** `/budget/mata-anggaran/create`
> - **Tampilkan:** Form dengan field: Kode, Nama, Unit, Tahun, Jenis, APBS Tahun Lalu, Asumsi Realisasi
---

**Langkah:**
1. Di halaman Daftar Mata Anggaran, klik tombol **+ Tambah Mata Anggaran**
2. Isi formulir:
   - **Kode** — Kode unik mata anggaran (contoh: `1.01`)
   - **Nama** — Nama mata anggaran
   - **Unit** — Unit pemilik anggaran
   - **Tahun** — Tahun anggaran (format: `2026/2027`)
   - **Jenis** — Jenis anggaran (Pendapatan / Belanja)
   - **APBS Tahun Lalu** — Nominal APBS periode sebelumnya (opsional)
   - **Asumsi Realisasi** — Estimasi realisasi tahun berjalan (opsional)
3. Klik tombol **Simpan**

> **⚠️ PERHATIAN:** Kode mata anggaran harus unik dalam satu unit dan tahun yang sama.

## 5.4 Mengubah Mata Anggaran

---
> **📸 SCREENSHOT — Form Edit Mata Anggaran**
> - **URL:** `/budget/mata-anggaran/{id}/edit`
> - **Tampilkan:** Form edit dengan data yang sudah terisi, tombol Simpan dan Batal
---

**Langkah:**
1. Di daftar Mata Anggaran, klik ikon **pensil** ✏️ pada baris yang ingin diubah
2. Ubah data yang diperlukan
3. Klik **Simpan**

## 5.5 Menghapus Mata Anggaran

**Langkah:**
1. Di daftar Mata Anggaran, klik ikon **tempat sampah** 🗑️
2. Dialog konfirmasi akan muncul
3. Klik **Hapus** untuk mengonfirmasi

> **⚠️ PERHATIAN:** Mata anggaran yang sudah memiliki pengajuan anggaran terkait **tidak dapat dihapus**. Hapus terlebih dahulu seluruh data yang merujuk ke mata anggaran tersebut.

## 5.6 Melihat Detail Mata Anggaran

---
> **📸 SCREENSHOT — Detail Mata Anggaran**
> - **URL:** `/budget/mata-anggaran/{id}`
> - **Tampilkan:** Informasi lengkap mata anggaran, tabel sub mata anggaran, dan daftar detail mata anggaran
---

**Langkah:**
1. Klik ikon **mata** 👁️ di baris mata anggaran
2. Halaman detail menampilkan:
   - Informasi umum mata anggaran
   - Daftar Sub Mata Anggaran
   - Detail saldo per sub

## 5.7 Mengelola Sub Mata Anggaran

Sub Mata Anggaran adalah tingkat kedua dalam hierarki anggaran.

---
> **📸 SCREENSHOT — Sub Mata Anggaran**
> - **URL:** `/budget/mata-anggaran/{id}` (bagian sub)
> - **Tampilkan:** Tabel sub mata anggaran dengan kolom Kode, Nama, Jumlah Detail, Aksi
---

**Menambah Sub Mata Anggaran:**
1. Di halaman Detail Mata Anggaran, klik **+ Tambah Sub**
2. Isi **Kode** dan **Nama** sub mata anggaran
3. Klik **Simpan**

**Mengubah / Menghapus Sub Mata Anggaran:**
- Klik ikon **pensil** untuk edit
- Klik ikon **tempat sampah** untuk hapus (pastikan tidak ada detail terkait)

## 5.8 Mengelola Detail Mata Anggaran (COA)

Detail Mata Anggaran adalah rincian paling spesifik dari anggaran, berisi volume, satuan, dan harga satuan.

---
> **📸 SCREENSHOT — Detail Mata Anggaran (COA)**
> - **URL:** `/budget/coa`
> - **Tampilkan:** Tabel rincian COA dengan kolom Kode, Nama, Volume, Satuan, Harga Satuan, Jumlah, Saldo Tersedia
---

**Field yang diisi:**
| Field | Keterangan |
|-------|------------|
| **Kode** | Kode rekening spesifik |
| **Nama** | Nama item anggaran |
| **Volume** | Jumlah/kuantitas |
| **Satuan** | Satuan ukur (paket, buah, orang, dll.) |
| **Harga Satuan** | Harga per satuan |
| **Jumlah** | Otomatis = Volume × Harga Satuan |

---

# BAB 6 — MODUL COA (Chart of Account)

## 6.1 Pengertian COA

**COA (Chart of Account)** adalah struktur hierarki rekening anggaran yang menampilkan rincian lengkap saldo anggaran. COA menjadi acuan saat membuat pengajuan anggaran.

## 6.2 Melihat Struktur COA

---
> **📸 SCREENSHOT — Halaman COA**
> - **URL:** `/budget/coa`
> - **Tampilkan:** Tabel COA hierarki dengan informasi saldo: Anggaran, Dipakai, Tersedia, Realisasi. Filter unit dan tahun.
---

**Langkah:**
1. Klik menu **Anggaran** → **COA** di sidebar
2. Tampil tabel COA dengan kolom:
   - **Kode** — Kode rekening
   - **Nama** — Nama rekening
   - **Anggaran** — Total anggaran yang dialokasikan
   - **Dipakai** — Jumlah yang sudah diajukan/dipakai
   - **Tersedia** — Sisa anggaran yang masih bisa dipakai
   - **Realisasi** — Jumlah yang sudah terealisasi (LPJ)
3. Gunakan filter **Tahun** dan **Unit** untuk menyaring data

## 6.3 Memahami Saldo COA

| Kolom | Penjelasan |
|-------|------------|
| **Anggaran Awal** | Total yang disetujui dalam APBS |
| **Dipakai** | Total nominal pengajuan yang sudah disetujui |
| **Tersedia** | Anggaran Awal − Dipakai |
| **Realisasi** | Total LPJ yang sudah disetujui |

> **⚠️ PERHATIAN:** Saat membuat pengajuan, nominal yang diajukan tidak boleh melebihi saldo **Tersedia** pada rekening COA yang dipilih.

## 6.4 Export COA

---
> **📸 SCREENSHOT — Export COA**
> - **URL:** `/budget/coa`
> - **Tampilkan:** Tombol Export di halaman COA, atau modal pilihan format export (Excel/PDF)
---

**Langkah:**
1. Di halaman COA, klik tombol **Export**
2. Pilih format (Excel atau PDF)
3. File akan otomatis diunduh

---

# BAB 7 — MODUL RAPBS

## 7.1 Pengertian RAPBS

**RAPBS (Rencana Anggaran Pendapatan dan Belanja Sekolah)** adalah dokumen perencanaan anggaran tahunan yang dibuat oleh unit/substansi dan harus mendapatkan persetujuan bertingkat sebelum menjadi APBS (anggaran resmi).

### Alur Status RAPBS

```
DRAFT → SUBMITTED → VERIFIED → IN REVIEW → APPROVED → APBS GENERATED → ACTIVE
              ↑                    ↑
              └──── REVISION REQUIRED ────┘
                         ↓
                      REJECTED
```

## 7.2 Melihat Daftar RAPBS

---
> **📸 SCREENSHOT — Daftar RAPBS**
> - **URL:** `/budget/rapbs`
> - **Tampilkan:** Daftar RAPBS per unit dengan status badge, total anggaran, tombol submit dan detail
---

**Langkah:**
1. Klik menu **Anggaran** → **RAPBS** di sidebar
2. Tampil daftar RAPBS beserta status dan total anggaran
3. Gunakan filter **Tahun** dan **Status** untuk menyaring

## 7.3 Membuat RAPBS Baru

---
> **📸 SCREENSHOT — Form Buat RAPBS**
> - **URL:** `/budget/rapbs/create` atau tombol di halaman RAPBS
> - **Tampilkan:** Form dengan field Tahun Anggaran, Unit, tombol generate dari PKT
---

**Langkah:**
1. Klik tombol **+ Buat RAPBS**
2. Pilih **Tahun Anggaran**
3. Item RAPBS akan otomatis terisi dari data **PKT** (Program Kerja Tahunan) yang sudah dibuat
4. Tinjau dan sesuaikan jika perlu
5. Klik **Simpan sebagai Draft**

> **ℹ️ INFO:** RAPBS harus dibuat setiap awal tahun anggaran. Pastikan semua PKT sudah diinput sebelum membuat RAPBS.

> **✅ TIPS:** Item RAPBS yang berasal dari PKT sudah otomatis terhubung dengan Mata Anggaran dan Sub Mata Anggaran. Anda hanya perlu mengecek kewajaran jumlahnya.

## 7.4 Submit RAPBS

---
> **📸 SCREENSHOT — Detail RAPBS dengan Tombol Submit**
> - **URL:** `/budget/rapbs/{id}`
> - **Tampilkan:** Halaman detail RAPBS dengan daftar item, total, dan tombol Submit berwarna biru
---

**Langkah:**
1. Buka detail RAPBS yang sudah dibuat
2. Pastikan semua item sudah benar
3. Klik tombol **Submit RAPBS**
4. Dialog konfirmasi akan muncul
5. Klik **Ya, Submit** untuk mengajukan

> **⚠️ PERHATIAN:** Setelah disubmit, RAPBS tidak dapat diubah oleh pengaju. Periksa kembali sebelum submit.

## 7.5 Alur Approval RAPBS

RAPBS melewati 7 tahap approval:

| Tahap | Approver | Aksi |
|-------|----------|------|
| 1 | Direktur / Sekretariat | Approve / Revise / Reject |
| 2 | Keuangan | Verify |
| 3 | Sekretaris | Approve / Revise / Reject |
| 4 | Wakil Ketua | Approve / Revise / Reject |
| 5 | Ketua Umum | Approve / Revise / Reject |
| 6 | Bendahara | Final Approve |
| 7 | Sistem | Generate APBS otomatis |

---
> **📸 SCREENSHOT — Timeline Approval RAPBS**
> - **URL:** `/budget/rapbs/{id}`
> - **Tampilkan:** Timeline visual approval RAPBS dengan status setiap tahap (completed, active, pending)
---

## 7.6 Setelah RAPBS Disetujui (Generate APBS)

Setelah Bendahara menyetujui RAPBS:
- Status berubah menjadi **APBS Generated**
- **APBS** (Anggaran Pendapatan dan Belanja Sekolah) otomatis dibuat
- Unit dapat mulai mengajukan pengajuan anggaran menggunakan APBS yang aktif

---

# BAB 8 — MODUL APBS

## 8.1 Pengertian APBS

**APBS (Anggaran Pendapatan dan Belanja Sekolah)** adalah dokumen anggaran resmi yang telah disetujui dan menjadi acuan untuk seluruh pengajuan anggaran dalam satu tahun anggaran.

## 8.2 Melihat APBS

---
> **📸 SCREENSHOT — Halaman APBS**
> - **URL:** `/budget/apbs`
> - **Tampilkan:** Daftar APBS per unit per tahun, dengan status (Active/Closed) dan total anggaran
---

**Langkah:**
1. Klik menu **Anggaran** → **APBS** di sidebar
2. Tampil daftar APBS
3. Klik nama unit untuk melihat detail

## 8.3 Detail APBS

---
> **📸 SCREENSHOT — Detail APBS**
> - **URL:** `/budget/apbs/{id}`
> - **Tampilkan:** Header APBS (unit, tahun, total), tabel item APBS dengan kode rekening dan nominal, informasi pengesahan
---

Halaman detail APBS menampilkan:
- **Informasi Umum** — Unit, Tahun Anggaran, Total Anggaran
- **Tabel Item** — Daftar rekening dengan alokasi anggaran
- **Pengesahan** — Tanda tangan Kepala Sekolah, Bendahara, Ketua Umum

## 8.4 Pengesahan APBS

APBS resmi ketika sudah ditandatangani oleh:
1. **Kepala Sekolah** (unit pendidikan) atau Kepala Unit
2. **Bendahara**
3. **Ketua Umum**

## 8.5 Print APBS

---
> **📸 SCREENSHOT — Print APBS**
> - **URL:** `/budget/apbs/{id}`
> - **Tampilkan:** Tombol Print/Cetak di pojok kanan atas halaman detail APBS
---

**Langkah:**
1. Buka detail APBS
2. Klik tombol **Cetak** / **Print**
3. Dokumen APBS akan dibuka di tab baru dalam format siap cetak
4. Gunakan fungsi print browser (`Ctrl+P` / `Cmd+P`)

---

# BAB 9 — MODUL PENGAJUAN ANGGARAN

## 9.1 Pengertian Pengajuan Anggaran

**Pengajuan Anggaran** adalah permohonan pencairan dana dari pos anggaran yang sudah disetujui dalam APBS. Setiap pengajuan melewati proses approval multi-tahap sebelum dana cair.

### Status Pengajuan

| Status | Warna | Keterangan |
|--------|-------|------------|
| `DRAFT` | Abu-abu | Belum disubmit |
| `SUBMITTED` | Biru | Sudah diajukan, menunggu approval |
| `REVISION REQUIRED` | Kuning | Dikembalikan untuk diperbaiki |
| `UNDER APPROVAL` | Oranye | Sedang dalam proses approval |
| `APPROVED` | Hijau muda | Disetujui, menunggu pembayaran |
| `DONE` | Hijau | Siap dicairkan oleh Kasir |
| `PAID` | Teal | Sudah dibayarkan |
| `REJECTED` | Merah | Ditolak |

## 9.2 Melihat Daftar Pengajuan

---
> **📸 SCREENSHOT — Daftar Pengajuan**
> - **URL:** `/pengajuan`
> - **Tampilkan:** Tabel daftar pengajuan dengan kolom No. Pengajuan, Perihal, Tanggal, Status, Total, Aksi. Filter status dan tanggal di atas.
---

**Langkah:**
1. Klik menu **Pengajuan** → **Daftar Pengajuan** di sidebar
2. Tampil daftar pengajuan milik Anda
3. Gunakan **filter status** untuk menyaring berdasarkan status
4. Gunakan **kolom pencarian** untuk mencari berdasarkan nomor atau perihal

## 9.3 Membuat Pengajuan Baru

---
> **📸 SCREENSHOT — Form Pengajuan Baru (Langkah 1)**
> - **URL:** `/pengajuan/create`
> - **Tampilkan:** Form header pengajuan: Perihal, Tanggal Kegiatan, Keperluan/Deskripsi
---

**Langkah 1 — Isi Informasi Dasar:**
1. Klik menu **Pengajuan** → **Pengajuan Baru** di sidebar
2. Isi kolom:
   - **Perihal** — Judul/subjek pengajuan
   - **Tanggal Kegiatan** — Tanggal pelaksanaan kegiatan
   - **Keterangan** — Deskripsi detail kebutuhan

---
> **📸 SCREENSHOT — Form Pengajuan Baru (Langkah 2 — Item)**
> - **URL:** `/pengajuan/create`
> - **Tampilkan:** Form item pengajuan: dropdown Mata Anggaran, Sub, Detail, field Uraian, Volume, Satuan, Harga Satuan, Jumlah
---

**Langkah 2 — Tambah Item Pengajuan:**
1. Di bagian **Detail Item**, klik **+ Tambah Item**
2. Untuk setiap item, isi:
   - **Mata Anggaran** — Pilih dari dropdown
   - **Sub Mata Anggaran** — Pilih dari dropdown (menyesuaikan pilihan di atas)
   - **Detail Mata Anggaran** — Pilih rekening COA spesifik
   - **Uraian** — Deskripsi item
   - **Volume** — Jumlah
   - **Satuan** — Satuan (paket, orang, buah, dll.)
   - **Harga Satuan** — Harga per satuan
   - **Jumlah** — Otomatis terhitung (Volume × Harga Satuan)
3. Ulangi untuk setiap item yang dibutuhkan

> **⚠️ PERHATIAN:** Jumlah per item tidak boleh melebihi saldo tersedia pada rekening COA yang dipilih. Saldo tersedia akan ditampilkan saat memilih Detail Mata Anggaran.

**Langkah 3 — Lampiran (Opsional):**
1. Di bagian **Lampiran**, klik **Upload Dokumen**
2. Pilih file pendukung (dokumen kebutuhan, RAB, dll.)
3. File akan terunggah otomatis

**Langkah 4 — Simpan atau Submit:**
- Klik **Simpan Draft** untuk menyimpan tanpa mengajukan
- Klik **Submit Pengajuan** untuk langsung mengajukan

## 9.4 Melakukan Revisi Pengajuan

Jika pengajuan dikembalikan (status `REVISION REQUIRED`):

---
> **📸 SCREENSHOT — Pengajuan Perlu Revisi**
> - **URL:** `/pengajuan/{id}`
> - **Tampilkan:** Badge status kuning "REVISION REQUIRED", catatan dari approver, tombol Edit untuk revisi
---

**Langkah:**
1. Buka detail pengajuan yang perlu direvisi
2. Baca **catatan revisi** dari approver di bagian bawah halaman
3. Klik tombol **Edit / Revisi**
4. Perbaiki sesuai catatan yang diberikan
5. Klik **Submit ulang** setelah selesai merevisi

## 9.5 Melihat Status & Timeline Approval

---
> **📸 SCREENSHOT — Timeline Approval Pengajuan**
> - **URL:** `/pengajuan/{id}`
> - **Tampilkan:** Bagian Timeline Approval dengan langkah-langkah approval, mana yang sudah selesai, mana yang sedang aktif, dan mana yang masih pending
---

Di halaman detail pengajuan, Anda dapat melihat:
- **Posisi saat ini** dalam alur approval
- **Approver di setiap tahap** beserta statusnya
- **Catatan** dari setiap approver
- **Tanggal** setiap aksi

## 9.6 Cetak Voucher (Kasir)

Setelah pengajuan berstatus `DONE`, Kasir dapat mencetak voucher:

---
> **📸 SCREENSHOT — Halaman Voucher**
> - **URL:** `/pengajuan/{id}` atau antrian kasir
> - **Tampilkan:** Tampilan voucher siap cetak dengan nomor voucher, detail pengajuan, tanda tangan
---

**Langkah (Kasir):**
1. Buka antrian **Voucher** di dashboard Kasir
2. Klik pengajuan yang perlu dicetak
3. Klik **Cetak Voucher**
4. Dokumen voucher terbuka di tab baru
5. Cetak menggunakan `Ctrl+P`
6. Tandai sebagai **Siap Bayar** untuk diteruskan ke Payment

## 9.7 Proses Pembayaran (Payment)

---
> **📸 SCREENSHOT — Antrian Pembayaran**
> - **URL:** Antrian Payment
> - **Tampilkan:** Daftar voucher siap bayar dengan informasi penerima, nominal, dan tombol "Tandai Sudah Dibayar"
---

**Langkah (Payment):**
1. Buka antrian **Pembayaran** di dashboard Payment
2. Proses pembayaran melalui **CMS Bank**
3. Kembali ke SIANGGAR dan klik **Tandai Sudah Dibayar**
4. Isi:
   - **Tanggal Bayar**
   - **Keterangan Pembayaran**
5. Klik **Konfirmasi Bayar**
6. Status pengajuan berubah menjadi `PAID`
7. Notifikasi otomatis dikirim ke pengaju

---

# BAB 10 — MODUL APPROVAL PENGAJUAN

## 10.1 Melihat Antrian Approval

---
> **📸 SCREENSHOT — Antrian Approval**
> - **URL:** `/approvals`
> - **Tampilkan:** Daftar pengajuan yang menunggu tindakan approver, dengan info unit, nominal, tanggal, dan tombol Tinjau
---

**Langkah:**
1. Klik menu **Approval** → **Antrian Approval** di sidebar
2. Tampil daftar pengajuan yang menunggu tindakan Anda
3. Klik **Tinjau** untuk membuka detail

## 10.2 Tahap 1 — Staf Direktur / Staf Keuangan

**Staf Direktur** menangani pengajuan dari unit pendidikan.  
**Staf Keuangan** menangani pengajuan dari substansi.

---
> **📸 SCREENSHOT — Approval Tahap 1**
> - **URL:** `/approvals/{id}`
> - **Tampilkan:** Detail pengajuan lengkap, catatan input, tombol Approve / Revisi / Tolak
---

**Aksi yang tersedia:**

| Aksi | Keterangan |
|------|------------|
| **Setujui** | Pengajuan lanjut ke tahap berikutnya |
| **Minta Revisi** | Pengajuan dikembalikan ke pengaju dengan catatan |
| **Tolak** | Pengajuan ditolak permanen, saldo dikembalikan |

**Cara melakukan aksi:**
1. Baca detail pengajuan dengan seksama
2. Pilih aksi yang sesuai
3. Isi **Catatan** (wajib saat Revisi/Tolak)
4. Klik tombol aksi

## 10.3 Tahap 2 — Validasi Staf Keuangan (6 Checklist)

Staf Keuangan melakukan validasi dengan mengisi **6 checklist** kelengkapan:

---
> **📸 SCREENSHOT — Form Validasi Keuangan**
> - **URL:** `/approvals/{id}` (tahap validasi keuangan)
> - **Tampilkan:** Form checklist dengan 6 item centang, dropdown Amount Category, Reference Type, LPJ Requirement
---

| # | Checklist | Keterangan |
|---|-----------|------------|
| 1 | **Dokumen Lengkap** | Semua lampiran pendukung ada |
| 2 | **Perhitungan Benar** | Nominal dan kalkulasi sudah benar |
| 3 | **Kode Anggaran Tepat** | Rekening COA yang dipilih sesuai |
| 4 | **Kewajaran Biaya** | Harga satuan sesuai standar |
| 5 | **Kewajaran Volume** | Jumlah/kuantitas masuk akal |
| 6 | **Pelaksana Tepat** | Pelaksana kegiatan sesuai |

Selain checklist, Staf Keuangan juga menentukan:

| Field | Pilihan |
|-------|---------|
| **Kategori Nominal** | Rendah (< Rp10 juta) / Tinggi (≥ Rp10 juta) |
| **Tipe Referensi** | Pendidikan / SDM & Umum / Sekretariat |
| **Perlu LPJ** | Ya / Tidak |

Berdasarkan input di atas, sistem **otomatis menentukan routing** ke approver berikutnya.

## 10.4 Routing Otomatis Berdasarkan Kategori

```
Kategori TINGGI + Tipe PENDIDIKAN      → Direktur Pendidikan
Kategori TINGGI + Tipe SDM/UMUM        → Kabag SDM & Umum
Kategori TINGGI + Tipe SEKRETARIAT     → Kabag Sekretariat
Kategori RENDAH (semua tipe)           → Keuangan (skip ke tahap 7)
```

## 10.5 Tahap 3-4 — Approval Menengah

Directur / Kabag SDM / Kabag Sekretariat melakukan review dan approval.

---
> **📸 SCREENSHOT — Approval Tahap Direktur/Kabag**
> - **URL:** `/approvals/{id}`
> - **Tampilkan:** Detail pengajuan, hasil validasi keuangan, tombol Setujui/Revisi/Tolak
---

## 10.6 Tahap 5 — Middle Layer (Wakil Ketua / Sekretaris)

- Pengajuan dari **unit pendidikan** → **Wakil Ketua**
- Pengajuan dari **substansi** → **Sekretaris**

## 10.7 Tahap 6 — Ketua Umum + Diskusi

---
> **📸 SCREENSHOT — Approval Ketua Umum**
> - **URL:** `/approvals/{id}`
> - **Tampilkan:** Detail lengkap pengajuan, tombol "Buka Diskusi", tombol Setujui/Revisi/Tolak, riwayat diskusi
---

Ketua Umum memiliki kemampuan khusus:
- **Membuka Diskusi** untuk berkomunikasi dengan semua stakeholder
- Semua approver sebelumnya otomatis diikutsertakan dalam diskusi
- Notifikasi WhatsApp dikirim ke semua peserta

## 10.8 Tahap 7 — Keuangan (Edit Nominal)

Keuangan dapat **mengubah nominal** pengajuan jika diperlukan.

---
> **📸 SCREENSHOT — Edit Nominal oleh Keuangan**
> - **URL:** `/approvals/{id}`
> - **Tampilkan:** Form edit nominal dengan field nominal baru, alasan perubahan, log perubahan sebelumnya
---

> **ℹ️ INFO:** Setiap perubahan nominal dicatat secara audit: siapa yang mengubah, kapan, dari berapa menjadi berapa, dan alasannya.

## 10.9 Tahap 8 — Bendahara

Bendahara melakukan verifikasi final setelah Keuangan menyetujui.

---
> **📸 SCREENSHOT — Approval Bendahara**
> - **URL:** `/approvals/{id}`
> - **Tampilkan:** Detail pengajuan final, log perubahan nominal dari Keuangan, tombol Setujui/Revisi/Tolak
---

Setelah Bendahara menyetujui, status pengajuan menjadi **DONE** dan masuk ke antrian Kasir.

## 10.10 Tahap 9 — Kasir (Voucher)

Kasir mencetak voucher dan meneruskan ke Payment.
(Lihat [BAB 9.6](#96-cetak-voucher-kasir))

## 10.11 Tahap 10 — Payment

Payment melakukan pembayaran via CMS Bank.
(Lihat [BAB 9.7](#97-proses-pembayaran-payment))

---

# BAB 11 — MODUL DISKUSI

## 11.1 Pengertian Diskusi

**Diskusi** adalah fitur kolaborasi yang memungkinkan semua pihak terkait (approver) berkomunikasi mengenai suatu pengajuan. Diskusi hanya bisa dibuka oleh **Ketua Umum**.

## 11.2 Membuka Diskusi

---
> **📸 SCREENSHOT — Membuka Diskusi**
> - **URL:** `/approvals/{id}` (view Ketua Umum)
> - **Tampilkan:** Tombol "Buka Diskusi" di halaman detail pengajuan, form konfirmasi
---

**Langkah (Ketua Umum):**
1. Buka detail pengajuan di halaman Approval
2. Klik tombol **Buka Diskusi**
3. Semua approver yang terlibat otomatis diikutsertakan
4. Notifikasi WhatsApp dikirim ke semua peserta

## 11.3 Mengirim Pesan dalam Diskusi

---
> **📸 SCREENSHOT — Thread Diskusi**
> - **URL:** `/approvals/{id}`
> - **Tampilkan:** Thread percakapan diskusi dengan nama pengirim, waktu, dan isi pesan. Form input pesan di bagian bawah.
---

**Langkah:**
1. Di halaman detail pengajuan yang sedang dalam diskusi, scroll ke bagian **Diskusi**
2. Ketik pesan di kolom input
3. Klik **Kirim**

## 11.4 Menutup Diskusi

---
> **📸 SCREENSHOT — Menutup Diskusi**
> - **URL:** `/approvals/{id}`
> - **Tampilkan:** Tombol "Tutup Diskusi" untuk Ketua Umum, konfirmasi dialog
---

**Langkah (Ketua Umum):**
1. Setelah diskusi selesai, klik **Tutup Diskusi**
2. Konfirmasi dengan klik **Ya, Tutup**
3. Diskusi ditutup dan Ketua Umum dapat melanjutkan untuk Approve/Revisi/Tolak

---

# BAB 12 — MODUL PERUBAHAN ANGGARAN

## 12.1 Pengertian Perubahan Anggaran

**Perubahan Anggaran** (Budget Transfer/Amendment) adalah proses pemindahan dana dari satu pos anggaran ke pos anggaran lain yang membutuhkan persetujuan. Fitur ini digunakan ketika realisasi anggaran tidak sesuai perencanaan awal.

### Status Perubahan Anggaran

```
DRAFT → SUBMITTED → APPROVED (L1) → APPROVED (L2) → APPROVED (L3) → APPROVED (L4) → PROCESSED
                        ↑
                REVISION REQUIRED
                        ↓
                    REJECTED
```

## 12.2 Melihat Daftar Perubahan Anggaran

---
> **📸 SCREENSHOT — Daftar Perubahan Anggaran**
> - **URL:** `/perubahan`
> - **Tampilkan:** Tabel daftar perubahan anggaran dengan No. Perubahan, Perihal, Total Transfer, Status, Tanggal
---

**Langkah:**
1. Klik menu **Pengajuan** → **Perubahan Anggaran** di sidebar
2. Tampil daftar perubahan anggaran

## 12.3 Membuat Perubahan Anggaran

---
> **📸 SCREENSHOT — Form Perubahan Anggaran**
> - **URL:** `/perubahan/create`
> - **Tampilkan:** Form dengan Perihal, Alasan, Tahun, dan tabel item transfer (Sumber → Tujuan → Nominal)
---

**Langkah:**
1. Klik tombol **+ Buat Perubahan Anggaran**
2. Isi **Perihal** dan **Alasan** perubahan
3. Di bagian **Item Transfer**, untuk setiap perubahan:
   - **Sumber** — Pilih rekening yang akan dikurangi anggarannya
   - **Tujuan** — Pilih rekening yang akan ditambah anggarannya
   - **Nominal** — Jumlah yang dipindahkan
   - **Keterangan** — Alasan transfer spesifik
4. Klik **+ Tambah Transfer** untuk menambah item
5. Klik **Simpan Draft** atau **Submit**

> **⚠️ PERHATIAN:** Nominal yang dipindahkan tidak boleh melebihi saldo tersedia pada rekening sumber.

## 12.4 Alur Approval Perubahan Anggaran

| Pengaju | Tahap 1 | Tahap 2 | Tahap 3 | Tahap 4 |
|---------|---------|---------|---------|---------|
| Unit Pendidikan | Direktur | Wakil Ketua | Ketua Umum | Keuangan → Bendahara |
| Substansi | Kabag Sekretariat | Sekretaris | Ketua Umum | Keuangan → Bendahara |

---
> **📸 SCREENSHOT — Detail Perubahan Anggaran**
> - **URL:** `/perubahan/{id}`
> - **Tampilkan:** Detail perubahan dengan tabel transfer (sumber, tujuan, nominal), timeline approval, status
---

## 12.5 Status PROCESSED — Update Saldo Otomatis

Setelah Bendahara menyetujui, sistem secara **otomatis**:
1. Mengurangi saldo rekening sumber
2. Menambah saldo rekening tujuan
3. Mencatat log perubahan dengan detail lengkap (saldo sebelum dan sesudah)

---
> **📸 SCREENSHOT — Log Perubahan Anggaran**
> - **URL:** `/perubahan/{id}`
> - **Tampilkan:** Log eksekusi perubahan: tanggal, rekening, saldo sebelum, saldo sesudah
---

---

# BAB 13 — MODUL LPJ (Laporan Pertanggungjawaban)

## 13.1 Pengertian LPJ

**LPJ (Laporan Pertanggungjawaban)** adalah laporan realisasi penggunaan dana yang wajib dibuat setelah pengajuan anggaran sudah dibayarkan (`PAID`). LPJ membuktikan bahwa dana telah digunakan sesuai peruntukannya.

### Status LPJ

```
DRAFT → SUBMITTED → VALIDATED → APPROVED (MIDDLE) → DONE
           ↑              ↑
     REVISION REQUIRED ──┘
           ↓
        REJECTED
```

## 13.2 Melihat Daftar LPJ

---
> **📸 SCREENSHOT — Daftar LPJ**
> - **URL:** `/lpj`
> - **Tampilkan:** Tabel LPJ dengan No. LPJ, Perihal, Pengajuan Terkait, Status, Tanggal Submit
---

**Langkah:**
1. Klik menu **Laporan** → **LPJ** di sidebar
2. Tampil daftar LPJ milik Anda
3. Filter berdasarkan status jika diperlukan

## 13.3 Membuat LPJ

---
> **📸 SCREENSHOT — Form Buat LPJ**
> - **URL:** `/lpj/create`
> - **Tampilkan:** Form LPJ dengan pilihan Pengajuan terkait, Tanggal Kegiatan, Realisasi Dana, Upload Dokumen
---

**Langkah:**
1. Klik tombol **+ Buat LPJ**
2. Pilih **Pengajuan** yang menjadi dasar LPJ (hanya pengajuan berstatus `PAID`)
3. Isi informasi:
   - **Tanggal Kegiatan** — Tanggal pelaksanaan aktual
   - **Realisasi Dana** — Jumlah yang benar-benar digunakan
   - **Keterangan** — Penjelasan tambahan
4. Upload lampiran:
   - Laporan naratif kegiatan
   - Laporan keuangan
   - Kuitansi / bukti pembayaran
   - Dokumen pendukung lainnya
5. Klik **Simpan Draft** atau **Submit**

> **⚠️ PERHATIAN:** Setiap pengguna memiliki batas maksimal **20 LPJ pending** secara bersamaan. Jika batas tercapai, Anda tidak dapat membuat LPJ baru hingga LPJ sebelumnya selesai.

## 13.4 Submit LPJ

**Langkah:**
1. Buka detail LPJ yang sudah dibuat
2. Pastikan semua lampiran sudah diunggah
3. Klik tombol **Submit LPJ**
4. Konfirmasi dengan klik **Ya, Submit**

## 13.5 Validasi Staf Keuangan (5 Checklist)

---
> **📸 SCREENSHOT — Validasi LPJ oleh Staf Keuangan**
> - **URL:** Halaman approval LPJ (Staf Keuangan)
> - **Tampilkan:** Form validasi dengan 5 checklist, dropdown Reference Type, catatan validator
---

| # | Checklist | Keterangan |
|---|-----------|------------|
| 1 | **Identitas Kegiatan** | Nama kegiatan, tanggal, dan pelaksana jelas |
| 2 | **Surat Pengantar** | Ada surat pengantar dari pimpinan unit |
| 3 | **Laporan Naratif** | Laporan kegiatan ditulis lengkap |
| 4 | **Laporan Keuangan** | Laporan realisasi keuangan tersedia |
| 5 | **Kuitansi / Bukti** | Semua bukti pembayaran terlampir |

Staf Keuangan juga menentukan **Reference Type** untuk routing approval selanjutnya.

## 13.6 Alur Approval LPJ

| Tahap | Approver | Aksi |
|-------|----------|------|
| 1 | Staf Keuangan | Validasi 5 checklist + routing |
| 2 | Direktur / Kabag (sesuai routing) | Approve / Revisi / Tolak |
| 3 | Keuangan | Approve Final / Revisi / Tolak |
| 4 | Status: **DONE** | Terintegrasi ke laporan akuntansi |

---
> **📸 SCREENSHOT — Timeline Approval LPJ**
> - **URL:** `/lpj/{id}`
> - **Tampilkan:** Timeline visual approval LPJ, status setiap tahap, catatan dari approver
---

## 13.7 Setelah LPJ DONE

Setelah LPJ berstatus **DONE**:
- Data realisasi masuk ke **database akuntansi**
- Muncul di **Dashboard Leadership** sebagai laporan realisasi
- Terintegrasi ke **Laporan Akuntansi** dan laporan keuangan

---

# BAB 14 — MODUL LAPORAN

## 14.1 Laporan Pengajuan

---
> **📸 SCREENSHOT — Laporan Pengajuan**
> - **URL:** `/laporan/pengajuan`
> - **Tampilkan:** Tabel ringkasan pengajuan per unit dengan total nominal, filter tahun/unit/status, tombol Export
---

**Laporan Pengajuan** menampilkan rekap semua pengajuan anggaran dengan berbagai filter:

**Filter yang tersedia:**
| Filter | Keterangan |
|--------|------------|
| **Tahun** | Tahun anggaran |
| **Unit** | Pilih unit spesifik atau semua |
| **Status** | Filter berdasarkan status pengajuan |
| **Periode** | Rentang tanggal |

**Kolom laporan:**
- Nomor Pengajuan
- Unit
- Perihal
- Total Diajukan
- Total Disetujui
- Status
- Tanggal

**Export:**
1. Atur filter sesuai kebutuhan
2. Klik tombol **Export Excel** atau **Export PDF**
3. File akan diunduh otomatis

## 14.2 Laporan Semester

---
> **📸 SCREENSHOT — Laporan Semester**
> - **URL:** `/laporan/semester`
> - **Tampilkan:** Laporan ringkasan per semester: total anggaran, realisasi, sisa, persentase penyerapan per unit
---

**Laporan Semester** memberikan gambaran penyerapan anggaran per periode semester:

| Kolom | Keterangan |
|-------|------------|
| **Unit** | Nama unit |
| **Anggaran** | Total APBS |
| **Diajukan** | Total pengajuan yang disubmit |
| **Disetujui** | Total yang sudah approved |
| **Realisasi** | Total yang sudah LPJ |
| **Sisa** | Anggaran − Diajukan |
| **% Serapan** | Realisasi / Anggaran × 100% |

## 14.3 Laporan Akuntansi

---
> **📸 SCREENSHOT — Laporan Akuntansi**
> - **URL:** `/laporan/accounting`
> - **Tampilkan:** Data akuntansi dari LPJ yang sudah DONE, tabel jurnal, filter periode, tombol Export
---

**Laporan Akuntansi** berisi data dari LPJ yang sudah selesai (status DONE), siap digunakan untuk keperluan pembukuan akuntansi.

**Langkah mengakses:**
1. Klik menu **Laporan** → **Laporan Akuntansi**
2. Set filter periode
3. Tinjau data atau klik **Export** untuk diunduh

---

# BAB 15 — MODUL SIPAKAT (Perencanaan)

## 15.1 Pengertian SIPAKAT

**SIPAKAT** adalah modul perencanaan strategis yang menghubungkan:

```
Strategi → Indikator → Proker → Kegiatan → PKT → RAPBS Item → APBS
```

SIPAKAT memastikan setiap pengajuan anggaran berakar dari perencanaan strategis yang terstruktur.

## 15.2 Strategi

---
> **📸 SCREENSHOT — Daftar Strategi**
> - **URL:** `/planning/strategies`
> - **Tampilkan:** Tabel daftar strategi dengan Kode, Nama, Jumlah Indikator, Aksi
---

**Strategi** adalah tujuan strategis tingkat tinggi organisasi.

**Menambah Strategi:**
1. Klik menu **SIPAKAT** → **Strategi**
2. Klik **+ Tambah Strategi**
3. Isi **Kode** dan **Nama** strategi
4. Klik **Simpan**

## 15.3 Indikator

---
> **📸 SCREENSHOT — Daftar Indikator**
> - **URL:** `/planning/indicators`
> - **Tampilkan:** Tabel indikator dengan Kode, Nama, Strategi terkait, Aksi
---

**Indikator** adalah ukuran keberhasilan dari suatu strategi.

**Menambah Indikator:**
1. Klik menu **SIPAKAT** → **Indikator**
2. Klik **+ Tambah Indikator**
3. Isi **Kode**, **Nama**, dan pilih **Strategi** yang terkait
4. Klik **Simpan**

## 15.4 Program Kerja (Proker)

---
> **📸 SCREENSHOT — Daftar Proker**
> - **URL:** `/planning/prokers`
> - **Tampilkan:** Tabel program kerja dengan Kode, Nama, Indikator, Unit, Aksi
---

**Proker** adalah program kerja konkret yang mendukung pencapaian indikator.

**Menambah Proker:**
1. Klik menu **SIPAKAT** → **Proker**
2. Klik **+ Tambah Proker**
3. Isi **Kode**, **Nama**, pilih **Indikator**, pilih **Unit**
4. Klik **Simpan**

## 15.5 Kegiatan

---
> **📸 SCREENSHOT — Daftar Kegiatan**
> - **URL:** `/planning/activities`
> - **Tampilkan:** Tabel kegiatan dengan Nama, Proker terkait, Jenis (Unggulan/Non-Unggulan), Aksi
---

**Kegiatan** adalah aktivitas spesifik dalam suatu proker.

**Menambah Kegiatan:**
1. Klik menu **SIPAKAT** → **Kegiatan**
2. Klik **+ Tambah Kegiatan**
3. Isi:
   - **Nama** kegiatan
   - **Proker** yang terkait
   - **Jenis** — Unggulan / Non-Unggulan
4. Klik **Simpan**

## 15.6 PKT (Program Kerja Tahunan)

---
> **📸 SCREENSHOT — Daftar PKT**
> - **URL:** `/planning/pkt`
> - **Tampilkan:** Tabel PKT dengan Kegiatan, Detail Mata Anggaran, Volume, Satuan, Saldo Anggaran, Aksi
---

**PKT** adalah rencana kerja tahunan yang paling detail, menghubungkan kegiatan dengan alokasi anggaran spesifik.

**Menambah PKT:**
1. Klik menu **SIPAKAT** → **PKT**
2. Klik **+ Tambah PKT**
3. Isi:
   - **Kegiatan** — Pilih dari daftar kegiatan
   - **Detail Mata Anggaran** — Pilih rekening COA yang akan digunakan
   - **Volume** — Jumlah rencana
   - **Satuan** — Satuan ukur
   - **Keterangan** — Catatan tambahan
4. Klik **Simpan**

> **✅ TIPS:** PKT otomatis membuat item RAPBS dan mengalokasikan anggaran ke COA. Pastikan Detail Mata Anggaran yang dipilih sudah memiliki saldo cukup.

---
> **📸 SCREENSHOT — Form Tambah PKT**
> - **URL:** `/planning/pkt/create`
> - **Tampilkan:** Form PKT lengkap dengan dropdown Kegiatan, Detail Mata Anggaran, field Volume, Satuan, Saldo tersedia ditampilkan
---

## 15.7 Hubungan PKT → RAPBS → APBS

Alur otomatis setelah PKT dibuat:

```
PKT dibuat
    ↓
RAPBS Item otomatis terbuat
    ↓
RAPBS di-submit dan disetujui
    ↓
APBS dibuat (anggaran resmi)
    ↓
Unit bisa mulai pengajuan anggaran
    menggunakan saldo COA dari APBS
```

---

# BAB 16 — MODUL SURAT INTERNAL

## 16.1 Pengertian Surat Internal

**Surat Internal** adalah modul komunikasi dalam aplikasi yang memungkinkan pengguna mengirim surat/notifikasi antar pengguna atau antar unit di dalam organisasi.

### Status Surat

| Status | Keterangan |
|--------|------------|
| `DRAFT` | Surat belum dikirim |
| `SENT` | Surat sudah dikirim |
| `IN PROCESS` | Surat sedang ditindaklanjuti |
| `APPROVED` | Surat sudah disetujui/ditindaklanjuti |
| `ARCHIVED` | Surat sudah diarsipkan |

## 16.2 Melihat Daftar Surat

---
> **📸 SCREENSHOT — Daftar Surat Internal**
> - **URL:** `/emails`
> - **Tampilkan:** Tab Masuk/Keluar, tabel surat dengan Perihal, Pengirim/Penerima, Tanggal, Status, Aksi
---

**Langkah:**
1. Klik menu **Komunikasi** → **Surat Internal**
2. Gunakan tab **Surat Masuk** dan **Surat Keluar** untuk navigasi
3. Klik judul surat untuk membaca isi lengkap

## 16.3 Membuat Surat Baru

---
> **📸 SCREENSHOT — Form Surat Baru**
> - **URL:** `/emails/create`
> - **Tampilkan:** Form surat dengan field: Perihal, Penerima (multi-select), Isi Surat, Lampiran
---

**Langkah:**
1. Klik tombol **+ Buat Surat**
2. Isi:
   - **Perihal** — Judul surat
   - **Penerima** — Pilih pengguna atau grup role penerima
   - **Isi Surat** — Konten lengkap surat
   - **Lampiran** — Upload file pendukung (opsional)
3. Klik **Simpan Draft** atau **Kirim**

## 16.4 Membalas Surat

---
> **📸 SCREENSHOT — Detail Surat dengan Balasan**
> - **URL:** `/emails/{id}`
> - **Tampilkan:** Isi surat asli, thread balasan di bawah, form input balasan
---

**Langkah:**
1. Buka surat yang ingin dibalas
2. Scroll ke bawah ke bagian **Balas**
3. Ketik isi balasan
4. Klik **Kirim Balasan**

## 16.5 Mengarsipkan Surat

**Langkah:**
1. Buka detail surat
2. Klik tombol **Arsipkan**
3. Surat berpindah ke tab **Arsip**

---

# BAB 17 — MODUL ADMIN

> **⚠️ PERHATIAN:** Modul Admin hanya dapat diakses oleh pengguna dengan role **Admin**.

## 17.1 Kelola User

---
> **📸 SCREENSHOT — Daftar User**
> - **URL:** `/admin/users`
> - **Tampilkan:** Tabel daftar pengguna dengan Nama, Email, Role, Unit, Status, Aksi
---

### Melihat Daftar User
1. Klik menu **Admin** → **Kelola User**
2. Tampil daftar semua pengguna

### Menambah User Baru

---
> **📸 SCREENSHOT — Form Tambah User**
> - **URL:** `/admin/users/create`
> - **Tampilkan:** Form: Nama, Email, Password, Role, Unit (opsional)
---

1. Klik **+ Tambah User**
2. Isi:
   - **Nama** — Nama lengkap
   - **Email** — Alamat email (untuk login)
   - **Password** — Password awal
   - **Role** — Pilih role yang sesuai
   - **Unit** — Pilih unit (wajib untuk role unit/substansi)
3. Klik **Simpan**

### Mengubah User
1. Klik ikon **pensil** di baris user yang ingin diubah
2. Ubah data yang diperlukan (role, unit, dll.)
3. Klik **Simpan**

### Menonaktifkan / Menghapus User
- Klik ikon **nonaktifkan** untuk menonaktifkan akun (user tidak bisa login)
- Klik ikon **hapus** untuk menghapus permanen

> **⚠️ PERHATIAN:** Hapus user hanya jika benar-benar tidak diperlukan. Data terkait user tidak akan terhapus, tetapi atribusi akan kehilangan referensi.

### Reset Password User
1. Buka detail user
2. Klik **Reset Password**
3. Password akan direset ke nilai default atau Anda dapat mengisi password baru

## 17.2 Kelola Unit

---
> **📸 SCREENSHOT — Daftar Unit**
> - **URL:** `/admin/units`
> - **Tampilkan:** Tabel unit dengan Kode, Nama, Jumlah User, Aksi
---

**Unit** adalah satuan kerja atau departemen dalam organisasi.

### Menambah Unit
1. Klik menu **Admin** → **Kelola Unit**
2. Klik **+ Tambah Unit**
3. Isi **Kode** dan **Nama** unit
4. Klik **Simpan**

### Mengubah / Menghapus Unit
- Klik ikon **pensil** untuk edit
- Klik ikon **hapus** (hanya jika tidak ada user/data terkait)

## 17.3 Role & Permission Management

---
> **📸 SCREENSHOT — Manajemen Role**
> - **URL:** `/admin/roles`
> - **Tampilkan:** Daftar role dengan permission yang dimiliki masing-masing role, tombol edit permission
---

Admin dapat melihat dan mengelola:
- **Daftar Role** — Semua role yang tersedia di sistem
- **Permission per Role** — Hak akses yang dimiliki setiap role
- **Assign Permission** — Menambah atau menghapus permission dari role

---

# BAB 18 — ALUR KERJA LENGKAP

## 18.1 Alur Pengajuan Anggaran (End-to-End)

```
╔══════════════════════════════════════════╗
║          UNIT / SUBSTANSI                ║
╠══════════════════════════════════════════╣
║  1. Buat Pengajuan (Draft)               ║
║  2. Submit → Status: SUBMITTED           ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║   STAF DIREKTUR (Unit) /                 ║
║   STAF KEUANGAN (Substansi)   [Tahap 1]  ║
╠══════════════════════════════════════════╣
║  ● Approve → Lanjut ke Staf Keuangan    ║
║  ● Revisi  → Kembali ke Pengaju         ║
║  ● Tolak   → Selesai (Saldo kembali)    ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║        STAF KEUANGAN            [Tahap 2]║
╠══════════════════════════════════════════╣
║  ● Validasi 6 Checklist                 ║
║  ● Tentukan: Kategori, Tipe, LPJ        ║
║  ● Routing Otomatis:                    ║
║    - TINGGI+Pendidikan → Direktur       ║
║    - TINGGI+SDM        → Kabag SDM      ║
║    - TINGGI+Sekretariat→ Kabag Sekr.    ║
║    - RENDAH            → Keuangan       ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║  DIREKTUR / KABAG SDM / KABAG SEKR.     ║
║                                 [Tahap 3]║
╠══════════════════════════════════════════╣
║  ● Approve / Revisi / Tolak             ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║  WAKIL KETUA (Unit) / SEKRETARIS        ║
║  (Substansi)                    [Tahap 4]║
╠══════════════════════════════════════════╣
║  ● Approve / Revisi / Tolak             ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║           KETUA UMUM            [Tahap 5]║
╠══════════════════════════════════════════╣
║  ● Buka Diskusi (opsional)              ║
║  ● Approve / Revisi / Tolak             ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║             KEUANGAN            [Tahap 6]║
╠══════════════════════════════════════════╣
║  ● Edit Nominal (jika perlu)            ║
║  ● Approve / Revisi / Tolak             ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║            BENDAHARA            [Tahap 7]║
╠══════════════════════════════════════════╣
║  ● Approve → Status: DONE               ║
║  ● Revisi / Tolak                       ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║               KASIR             [Tahap 8]║
╠══════════════════════════════════════════╣
║  ● Cetak Voucher                        ║
║  ● Teruskan ke Payment                  ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║             PAYMENT             [Tahap 9]║
╠══════════════════════════════════════════╣
║  ● Bayar via CMS Bank                   ║
║  ● Tandai Sudah Dibayar                 ║
║  ● Status: PAID                         ║
║  ● Notifikasi ke Pengaju                ║
╚══════════════════════════════════════════╝
```

## 18.2 Alur LPJ (End-to-End)

```
╔══════════════════════════════════════════╗
║   UNIT (Pengajuan sudah PAID)            ║
╠══════════════════════════════════════════╣
║  1. Buat LPJ (Draft)                    ║
║  2. Upload Lampiran                     ║
║  3. Submit                              ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║        STAF KEUANGAN            [Tahap 1]║
╠══════════════════════════════════════════╣
║  ● Validasi 5 Checklist                 ║
║  ● Tentukan Reference Type              ║
║  ● Approve / Revisi / Tolak             ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║  DIREKTUR / KABAG (sesuai routing)      ║
║                                 [Tahap 2]║
╠══════════════════════════════════════════╣
║  ● Approve / Revisi / Tolak             ║
╚══════════════════╦═══════════════════════╝
                   ↓
╔══════════════════╩═══════════════════════╗
║            KEUANGAN             [Tahap 3]║
╠══════════════════════════════════════════╣
║  ● Approve Final                        ║
║  ● Status: DONE                         ║
║  ● Data masuk Akuntansi                 ║
╚══════════════════════════════════════════╝
```

## 18.3 Alur Perubahan Anggaran (End-to-End)

```
UNIT           → Direktur      → Wakil Ketua → Ketua Umum → Keuangan → Bendahara → PROCESSED
SUBSTANSI      → Kabag Sekr.  → Sekretaris  → Ketua Umum → Keuangan → Bendahara → PROCESSED
```

## 18.4 Alur SIPAKAT → RAPBS → APBS

```
UNIT membuat:
  Strategi → Indikator → Proker → Kegiatan → PKT
                                               ↓
                                    (Otomatis) RAPBS Item terbuat
                                               ↓
                         RAPBS di-submit dan disetujui (7 tahap approval)
                                               ↓
                         APBS dibuat (anggaran resmi tahun berjalan)
                                               ↓
                         Unit dapat membuat Pengajuan Anggaran
                           menggunakan saldo COA dari APBS
```

---

# BAB 19 — PANDUAN PER ROLE

## 19.1 Panduan untuk Unit / Substansi

Anda adalah **pengaju anggaran**. Tugas utama Anda:

1. **Perencanaan (SIPAKAT)**
   - Buat Strategi, Indikator, Proker, Kegiatan
   - Buat PKT untuk setiap rencana kegiatan

2. **Anggaran Tahunan (RAPBS)**
   - Buat RAPBS dari data PKT
   - Submit RAPBS untuk disetujui

3. **Pengajuan Anggaran**
   - Buat pengajuan sesuai kebutuhan
   - Pantau status pengajuan
   - Lakukan revisi jika diminta

4. **Laporan (LPJ)**
   - Buat LPJ setelah pengajuan dibayar
   - Upload semua bukti kegiatan

**Menu yang paling sering digunakan:**
- Dashboard
- Pengajuan → Pengajuan Baru
- Pengajuan → Daftar Pengajuan
- Laporan → LPJ
- SIPAKAT → PKT

## 19.2 Panduan untuk Approver (Direktur, Kabag, Wakil Ketua, Sekretaris, Ketum)

Anda adalah **penyetuju anggaran**. Tugas utama Anda:

1. **Periksa Antrian** — Cek dashboard dan menu Approval secara berkala
2. **Tinjau Detail** — Baca seluruh detail pengajuan sebelum mengambil keputusan
3. **Berikan Keputusan** — Setujui, minta revisi, atau tolak dengan catatan jelas

**Tips untuk Approver:**
> **✅ TIPS:** Selalu isi **catatan** saat meminta revisi atau menolak, agar pengaju mengerti apa yang perlu diperbaiki.

> **✅ TIPS:** Cek notifikasi di dashboard secara rutin. Pengajuan yang terlambat ditindaklanjuti dapat menghambat kegiatan unit.

**Menu yang paling sering digunakan:**
- Dashboard (widget antrian approval)
- Approval → Antrian Approval

## 19.3 Panduan untuk Staf Keuangan

Anda adalah **validator dan router** pengajuan. Tugas utama Anda:

1. **Validasi Kelengkapan** — Periksa 6 checklist dengan teliti
2. **Tentukan Routing** — Pilih kategori dan tipe yang tepat agar pengajuan diarahkan ke approver yang benar
3. **Approval RAPBS** — Verifikasi RAPBS sebelum masuk ke approval pimpinan

> **⚠️ PERHATIAN:** Kesalahan penentuan routing akan menyebabkan pengajuan sampai ke approver yang salah. Periksa dengan teliti sebelum menyetujui.

## 19.4 Panduan untuk Keuangan & Bendahara

Anda adalah **verifikator keuangan akhir**. Tugas utama Anda:

1. **Tinjau Detail Keuangan** — Pastikan nominal sesuai anggaran dan wajar
2. **Edit Nominal (Keuangan)** — Jika diperlukan penyesuaian, catat alasannya
3. **Approval Final (Bendahara)** — Pastikan semua tahap sebelumnya sudah benar

> **⚠️ PERHATIAN:** Setiap edit nominal yang dilakukan Keuangan dicatat secara audit dan dapat dilihat oleh Bendahara. Selalu isi alasan perubahan.

## 19.5 Panduan untuk Kasir

Anda bertugas **mencetak voucher** dan meneruskan ke Payment.

1. Pantau antrian di **Dashboard Kasir**
2. Cetak voucher untuk setiap pengajuan yang masuk
3. Tandai sebagai siap bayar

**Menu yang paling sering digunakan:**
- Dashboard (widget voucher)
- Pengajuan (antrian kasir)

## 19.6 Panduan untuk Payment

Anda bertugas **memproses pembayaran** melalui CMS Bank.

1. Pantau antrian pembayaran di dashboard
2. Proses pembayaran di CMS Bank eksternal
3. Kembali ke SIANGGAR dan tandai sudah dibayar

> **✅ TIPS:** Selalu proses pembayaran secara berurutan sesuai tanggal masuk untuk menghindari antrean menumpuk.

## 19.7 Panduan untuk Admin

Anda memiliki **akses penuh** ke semua modul. Tanggung jawab utama:

1. **Kelola Pengguna** — Tambah, ubah, nonaktifkan, reset password user
2. **Kelola Unit** — Tambah dan perbarui data unit
3. **Kelola Role** — Atur permission setiap role
4. **Monitor Sistem** — Pantau aktivitas global dari dashboard admin

> **⚠️ PERHATIAN:** Dengan akses penuh, setiap tindakan Admin berdampak pada seluruh sistem. Lakukan perubahan dengan hati-hati, terutama penghapusan data.

---

# BAB 20 — NOTIFIKASI & KOMUNIKASI

## 20.1 Notifikasi dalam Aplikasi

---
> **📸 SCREENSHOT — Notifikasi dalam Aplikasi**
> - **URL:** `/dashboard` atau ikon notifikasi di Navbar
> - **Tampilkan:** Panel notifikasi dengan daftar notifikasi terbaru (approval, revisi, pembayaran)
---

SIANGGAR mengirim notifikasi dalam aplikasi untuk kejadian berikut:

| Kejadian | Penerima |
|----------|----------|
| Pengajuan disubmit | Approver pertama |
| Pengajuan disetujui di suatu tahap | Approver berikutnya |
| Pengajuan diminta revisi | Pengaju |
| Pengajuan ditolak | Pengaju |
| Pengajuan sudah dibayar | Pengaju |
| Diskusi dibuka | Semua peserta |
| Pesan diskusi baru | Semua peserta |
| LPJ perlu disubmit | Pengaju (reminder) |

## 20.2 Notifikasi WhatsApp

Notifikasi WhatsApp otomatis dikirim untuk kejadian penting:
- Diskusi dibuka oleh Ketua Umum
- Keputusan final Ketua Umum (Approve/Tolak)
- Pengajuan sudah dibayarkan (ke pengaju)

> **ℹ️ INFO:** Nomor WhatsApp harus terdaftar di profil pengguna agar notifikasi WhatsApp dapat diterima.

## 20.3 Surat Internal

Untuk komunikasi formal antar unit atau antar pengguna, gunakan fitur **Surat Internal** (lihat [BAB 16](#bab-16--modul-surat-internal)).

---

# BAB 21 — TIPS & TROUBLESHOOTING

## 21.1 Pertanyaan Umum (FAQ)

**Q: Kenapa saya tidak bisa membuat pengajuan baru?**
> A: Periksa apakah saldo COA yang ingin digunakan masih mencukupi. Jika saldo habis, ajukan Perubahan Anggaran terlebih dahulu.

**Q: Kenapa pengajuan saya tidak muncul di antrian approver?**
> A: Pastikan pengajuan sudah berstatus `SUBMITTED`, bukan `DRAFT`. Klik tombol Submit jika masih berupa draft.

**Q: Saya tidak bisa membuat LPJ baru. Muncul pesan batas terlampaui.**
> A: Anda telah mencapai batas maksimal 20 LPJ pending secara bersamaan. Selesaikan (pastikan disetujui) beberapa LPJ yang ada sebelum membuat yang baru.

**Q: Nominal pengajuan saya berubah. Siapa yang mengubah?**
> A: Keuangan atau Bendahara berwenang mengubah nominal. Anda dapat melihat log perubahan di bagian **Riwayat Perubahan Nominal** di halaman detail pengajuan.

**Q: Saya tidak menemukan rekening COA yang ingin saya gunakan.**
> A: Pastikan Mata Anggaran dan Sub Mata Anggaran sudah dibuat. Jika belum ada, hubungi Admin untuk membuatkan data master anggaran.

**Q: Bagaimana cara mengetahui siapa approver berikutnya?**
> A: Lihat bagian **Timeline Approval** di halaman detail pengajuan. Tahap aktif dan approver yang bertugas ditampilkan di sana.

**Q: Pengajuan saya sudah lama tidak ada kabar. Ke mana saya harus menghubungi?**
> A: Cek halaman detail pengajuan untuk melihat di tahap mana pengajuan sedang menunggu, lalu hubungi approver yang bertugas di tahap tersebut.

## 21.2 Kendala Umum & Solusi

| Kendala | Kemungkinan Penyebab | Solusi |
|---------|----------------------|--------|
| Tidak bisa login | Email/password salah | Periksa email dan password. Hubungi Admin untuk reset password. |
| Halaman tidak memuat | Koneksi internet bermasalah | Periksa koneksi internet, coba refresh halaman (F5). |
| Data tidak tersimpan | Validasi form gagal | Periksa pesan error merah di bawah field yang bermasalah. |
| Tidak bisa upload lampiran | File terlalu besar / format tidak didukung | Gunakan file PDF, DOC, atau gambar berukuran maks. 10 MB. |
| Antrian approval kosong | Tidak ada pengajuan menunggu | Tidak ada yang perlu dilakukan. Akan muncul saat ada pengajuan baru. |
| Tidak bisa hapus mata anggaran | Ada data terkait | Hapus terlebih dahulu pengajuan / PKT yang merujuk ke mata anggaran tersebut. |

## 21.3 Kontak Bantuan

Jika mengalami kendala yang tidak tercantum di atas, hubungi:

- **Tim IT / Admin Sistem** — Masalah teknis, akses, dan reset password
- **Bagian Keuangan** — Pertanyaan terkait anggaran dan approval
- **Atasan Langsung** — Masalah terkait proses approval

---

# LAMPIRAN

## A. Daftar Singkatan

| Singkatan | Kepanjangan |
|-----------|-------------|
| SIANGGAR | Sistem Informasi Anggaran |
| RAPBS | Rencana Anggaran Pendapatan dan Belanja Sekolah |
| APBS | Anggaran Pendapatan dan Belanja Sekolah |
| COA | Chart of Account |
| LPJ | Laporan Pertanggungjawaban |
| PKT | Program Kerja Tahunan |
| SIPAKAT | Sistem Perencanaan dan Kegiatan Tahunan |
| TA | Tahun Anggaran |
| CMS | Cash Management System |
| RBAC | Role-Based Access Control |
| CRUD | Create, Read, Update, Delete |
| RAB | Rencana Anggaran Biaya |
| SDM | Sumber Daya Manusia |

## B. Referensi Status Lengkap

### Status Pengajuan Anggaran
| Status | Kode Warna | Keterangan |
|--------|------------|------------|
| `DRAFT` | Abu-abu | Belum disubmit |
| `SUBMITTED` | Biru | Menunggu approval tahap 1 |
| `REVISION REQUIRED` | Kuning | Dikembalikan untuk revisi |
| `UNDER APPROVAL` | Oranye | Sedang dalam proses approval |
| `APPROVED` | Hijau muda | Disetujui Bendahara |
| `DONE` | Hijau | Siap cetak voucher (Kasir) |
| `PAID` | Teal | Sudah dibayarkan |
| `REJECTED` | Merah | Ditolak permanen |

### Status RAPBS
| Status | Keterangan |
|--------|------------|
| `DRAFT` | Belum disubmit |
| `SUBMITTED` | Menunggu verifikasi Direktur |
| `VERIFIED` | Sudah diverifikasi Keuangan |
| `IN REVIEW` | Sedang direview pimpinan |
| `APPROVED` | Disetujui Ketua Umum |
| `APBS GENERATED` | APBS sudah dibuat |
| `ACTIVE` | Anggaran aktif |
| `REVISION REQUIRED` | Perlu revisi |
| `REJECTED` | Ditolak |

### Status LPJ
| Status | Keterangan |
|--------|------------|
| `DRAFT` | Belum disubmit |
| `SUBMITTED` | Menunggu validasi Staf Keuangan |
| `VALIDATED` | Sudah divalidasi Staf Keuangan |
| `APPROVED` | Disetujui Direktur/Kabag |
| `DONE` | Selesai, masuk sistem akuntansi |
| `REVISION REQUIRED` | Perlu revisi |
| `REJECTED` | Ditolak |

### Status Perubahan Anggaran
| Status | Keterangan |
|--------|------------|
| `DRAFT` | Belum disubmit |
| `SUBMITTED` | Menunggu approval |
| `REVISION REQUIRED` | Perlu revisi |
| `APPROVED (L1-L4)` | Disetujui pada level tertentu |
| `PROCESSED` | Selesai, saldo sudah dipindahkan |
| `REJECTED` | Ditolak |

### Status Surat Internal
| Status | Keterangan |
|--------|------------|
| `DRAFT` | Belum dikirim |
| `SENT` | Sudah dikirim ke penerima |
| `IN PROCESS` | Sedang ditindaklanjuti |
| `APPROVED` | Sudah disetujui/selesai |
| `ARCHIVED` | Diarsipkan |

## C. Changelog Manual Book

| Versi | Tanggal | Perubahan |
|-------|---------|-----------|
| 1.0.0 | April 2026 | Versi pertama — mencakup semua modul |

---

*Manual Book ini dibuat untuk aplikasi SIANGGAR versi 1.0.0*  
*Hak Cipta © 2026 Yayasan Al Azhar — Tim Pengembang SIANGGAR*
