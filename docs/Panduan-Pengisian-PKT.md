# BUKU PANDUAN PENGISIAN PROGRAM KERJA TAHUNAN (PKT)

## Sistem Informasi Anggaran (SIANGGAR)

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Alur Pengisian Data](#2-alur-pengisian-data)
3. [Tahap 1 — Mengisi Mata Anggaran](#3-tahap-1--mengisi-mata-anggaran)
4. [Tahap 2 — Mengisi Sub Mata Anggaran](#4-tahap-2--mengisi-sub-mata-anggaran)
5. [Tahap 3 — Mengisi Program Kerja](#5-tahap-3--mengisi-program-kerja)
6. [Tahap 4 — Mengisi Kegiatan](#6-tahap-4--mengisi-kegiatan)
7. [Tahap 5 — Mengisi PKT](#7-tahap-5--mengisi-pkt)
8. [Catatan Penting](#8-catatan-penting)

---

## 1. Pendahuluan

Buku panduan ini disusun untuk membantu pengguna dalam mengisi **Program Kerja Tahunan (PKT)** pada aplikasi SIANGGAR secara lengkap dan benar. PKT merupakan dokumen perencanaan yang menghubungkan kegiatan unit dengan mata anggaran yang tersedia.

Sebelum mengisi PKT, terdapat beberapa data master yang harus diisi terlebih dahulu secara berurutan. Pastikan setiap tahapan telah selesai sebelum melanjutkan ke tahapan berikutnya.

### Persyaratan Umum

- Pengguna sudah memiliki akun dan login ke sistem SIANGGAR.
- Pengguna terdaftar pada unit kerja yang sesuai.
- Tahun Anggaran yang akan digunakan sudah tersedia di sistem.
- Status RAPBS unit masih **Draft** atau **Ditolak** (jika RAPBS sudah diajukan atau disetujui, pengisian PKT akan ditutup secara otomatis).

---

## 2. Alur Pengisian Data

Pengisian data harus dilakukan secara **berurutan** sesuai tahapan berikut:

```
┌──────────────────┐
│  1. Mata Anggaran │
└────────┬─────────┘
         ▼
┌──────────────────────┐
│  2. Sub Mata Anggaran │
└────────┬─────────────┘
         ▼
┌──────────────────┐
│  3. Program Kerja │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  4. Kegiatan      │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  5. PKT           │
└──────────────────┘
```

> **Penting:** Data pada tahap sebelumnya harus sudah terisi karena akan menjadi pilihan (dropdown) pada tahap selanjutnya. Misalnya, Mata Anggaran harus sudah ada sebelum mengisi PKT.

---

## 3. Tahap 1 — Mengisi Mata Anggaran

### Navigasi

Dari menu sidebar, pilih **Anggaran** → **Mata Anggaran** → klik tombol **Tambah Mata Anggaran**.

### Halaman Daftar Mata Anggaran

Halaman ini menampilkan seluruh data mata anggaran yang telah dibuat. Pengguna dapat melakukan pencarian berdasarkan kode atau nama, serta memfilter berdasarkan tahun anggaran. Setiap baris dapat diperluas untuk melihat daftar sub mata anggaran yang terkait.

*(Screenshot: Halaman Daftar Mata Anggaran)*

### Halaman Tambah Mata Anggaran

Halaman ini digunakan untuk membuat mata anggaran baru beserta sub mata anggaran di dalamnya.

*(Screenshot: Halaman Form Tambah Mata Anggaran)*

### Field yang Wajib Diisi

#### a. Unit (Otomatis)

- **Tipe:** Teks (tidak dapat diubah)
- **Keterangan:** Unit kerja Anda akan terisi secara otomatis berdasarkan akun yang sedang login. Field ini tidak perlu dan tidak dapat diubah oleh pengguna.

#### b. Tahun Anggaran *

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih tahun anggaran yang sesuai, misalnya **TA 2026/2027**. Tahun anggaran menentukan periode berlakunya mata anggaran ini. Pastikan memilih tahun anggaran yang benar karena data PKT nantinya akan mengacu pada tahun yang sama.
- **Wajib diisi.**

#### c. Kode *

- **Tipe:** Input teks
- **Contoh:** `5.1.01`
- **Keterangan:** Masukkan kode mata anggaran sesuai dengan ketentuan kode anggaran yang berlaku di lembaga Anda. Kode ini bersifat unik dan digunakan sebagai identitas mata anggaran.
- **Wajib diisi.**

#### d. Jenis

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih jenis/kategori mata anggaran (misalnya: Belanja Operasional, Belanja Modal, dll). Jika jenis yang diinginkan belum tersedia, klik tombol **Tambah Jenis** untuk membuat jenis baru langsung dari halaman ini.
- **Opsional.**

#### e. Nama *

- **Tipe:** Input teks
- **Keterangan:** Masukkan nama lengkap mata anggaran. Nama ini akan tampil di seluruh laporan dan formulir terkait. Gunakan penamaan yang jelas dan deskriptif.
- **Wajib diisi.**

#### f. Keterangan

- **Tipe:** Textarea (area teks panjang)
- **Keterangan:** Tambahkan keterangan atau catatan tambahan mengenai mata anggaran ini jika diperlukan.
- **Opsional.**

### Cara Menyimpan

Setelah semua field wajib terisi dengan benar, klik tombol **Simpan Mata Anggaran**. Sistem akan menyimpan data dan mengarahkan Anda kembali ke halaman daftar mata anggaran.

---

## 4. Tahap 2 — Mengisi Sub Mata Anggaran

### Navigasi

Sub Mata Anggaran dibuat **bersamaan** pada saat membuat atau mengedit Mata Anggaran. Tidak ada halaman terpisah untuk membuat Sub Mata Anggaran.

Dari halaman **Tambah Mata Anggaran** atau **Edit Mata Anggaran**, scroll ke bagian bawah form untuk menemukan section **Sub Mata Anggaran**.

*(Screenshot: Bagian Sub Mata Anggaran pada form Mata Anggaran)*

### Cara Menambah Sub Mata Anggaran

Pada bagian **Sub Mata Anggaran**, klik tombol **Tambah Sub** untuk menambahkan baris baru. Setiap sub mata anggaran memiliki dua field:

#### a. Kode

- **Tipe:** Input teks
- **Contoh:** `01`, `02`, `03`
- **Keterangan:** Masukkan kode sub mata anggaran. Kode ini biasanya berupa nomor urut atau kode turunan dari mata anggaran induknya.

#### b. Nama

- **Tipe:** Input teks
- **Keterangan:** Masukkan nama sub mata anggaran. Nama ini akan muncul sebagai pilihan pada saat pengisian PKT.

### Catatan

- Anda dapat menambahkan **lebih dari satu** sub mata anggaran sekaligus dalam satu mata anggaran.
- Untuk menghapus sub mata anggaran yang tidak diperlukan, klik ikon **hapus** (ikon tempat sampah) pada baris yang bersangkutan.
- Sub mata anggaran yang kode dan namanya dikosongkan akan **diabaikan** dan tidak disimpan.
- Sub Mata Anggaran bersifat **wajib** pada saat pengisian PKT, sehingga pastikan setiap Mata Anggaran memiliki minimal satu Sub Mata Anggaran.

---

## 5. Tahap 3 — Mengisi Program Kerja

### Navigasi

Dari menu sidebar, pilih **SIPAKAT** → **Proker** (Program Kerja).

### Halaman Daftar Program Kerja

Halaman ini menampilkan seluruh program kerja yang telah dibuat. Pengguna dapat melakukan pencarian berdasarkan kode atau nama program kerja.

*(Screenshot: Halaman Daftar Program Kerja)*

### Cara Menambah Program Kerja

Klik tombol **Tambah Proker**. Sebuah dialog/form akan muncul dengan field-field berikut:

*(Screenshot: Dialog Tambah Program Kerja)*

### Field yang Wajib Diisi

#### a. Sasaran Strategis *

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih sasaran strategis yang menjadi induk dari program kerja ini. Sasaran strategis harus sudah dibuat sebelumnya pada menu **Strategi**. Data yang ditampilkan berupa kode dan nama strategi.
- **Wajib diisi.**

#### b. Indikator *

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih indikator kinerja yang terkait. Dropdown ini **baru aktif** setelah Sasaran Strategis dipilih, karena daftar indikator difilter berdasarkan strategi yang dipilih. Jika strategi diubah, pilihan indikator akan di-reset.
- **Wajib diisi.**

#### c. Kode *

- **Tipe:** Input teks
- **Contoh:** `1.2.3`
- **Keterangan:** Masukkan kode program kerja sesuai dengan sistem penomoran yang berlaku.
- **Wajib diisi.**

#### d. Nama Program Kerja *

- **Tipe:** Input teks
- **Keterangan:** Masukkan nama program kerja secara jelas dan deskriptif. Nama ini akan tampil sebagai pilihan pada saat pembuatan Kegiatan.
- **Wajib diisi.**

### Cara Menyimpan

Klik tombol **Simpan** pada dialog. Data akan tersimpan dan muncul pada tabel daftar program kerja.

### Import Data

Jika Anda memiliki data program kerja dalam jumlah banyak, Anda dapat menggunakan fitur **Import** untuk mengunggah data secara massal melalui file yang telah disiapkan.

---

## 6. Tahap 4 — Mengisi Kegiatan

### Navigasi

Dari menu sidebar, pilih **SIPAKAT** → **Kegiatan**.

### Halaman Daftar Kegiatan

Halaman ini menampilkan seluruh kegiatan yang telah dibuat. Pengguna dapat memfilter berdasarkan jenis kegiatan (Semua, Unggulan, atau Prestasi).

*(Screenshot: Halaman Daftar Kegiatan)*

### Cara Menambah Kegiatan

Klik tombol **Tambah Kegiatan**. Sebuah dialog/form akan muncul dengan field-field berikut:

*(Screenshot: Dialog Tambah Kegiatan)*

### Field yang Wajib Diisi

#### a. Sasaran Strategis *

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih sasaran strategis yang menjadi acuan kegiatan ini. Pemilihan strategi akan menentukan daftar indikator dan program kerja yang tersedia pada field selanjutnya.
- **Wajib diisi.**

#### b. Indikator *

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih indikator yang sesuai. Field ini **baru aktif** setelah Sasaran Strategis dipilih. Daftar indikator difilter berdasarkan strategi yang telah dipilih.
- **Wajib diisi.**

#### c. Program Kerja *

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih program kerja tempat kegiatan ini berada. Field ini **baru aktif** setelah Indikator dipilih. Daftar program kerja difilter berdasarkan indikator yang telah dipilih.
- **Wajib diisi.**

#### d. Kode

- **Tipe:** Input teks
- **Contoh:** `1.2.3.4`
- **Keterangan:** Masukkan kode kegiatan sesuai dengan sistem penomoran yang berlaku. Kode ini merupakan turunan dari kode program kerja.
- **Opsional, namun disarankan untuk diisi.**

#### e. Nama Kegiatan

- **Tipe:** Input teks
- **Keterangan:** Masukkan nama kegiatan secara lengkap dan deskriptif. Nama ini akan muncul pada daftar pilihan di formulir PKT.
- **Opsional, namun disarankan untuk diisi.**

#### f. Jenis Kegiatan

- **Tipe:** Dropdown pilihan
- **Pilihan:** **Prestasi** (non-unggulan) atau **Unggulan**
- **Default:** Prestasi
- **Keterangan:** Tentukan apakah kegiatan ini termasuk kegiatan unggulan atau kegiatan prestasi biasa. Kegiatan unggulan akan ditandai dengan label khusus pada daftar kegiatan.

### Cara Menyimpan

Klik tombol **Simpan** pada dialog. Data akan tersimpan dan muncul pada tabel daftar kegiatan.

### Hierarki Perencanaan

Perlu dipahami bahwa setiap kegiatan memiliki hierarki sebagai berikut:

```
Sasaran Strategis
  └── Indikator
        └── Program Kerja
              └── Kegiatan ← Anda di sini
```

Hierarki ini akan ditampilkan secara otomatis pada saat pengisian PKT.

### Import Data

Sama seperti Program Kerja, Anda dapat menggunakan fitur **Import** untuk mengunggah data kegiatan secara massal.

---

## 7. Tahap 5 — Mengisi PKT

### Navigasi

Dari menu sidebar, pilih **SIPAKAT** → **PKT**.

### Halaman Daftar PKT

Halaman ini menampilkan seluruh PKT yang telah dibuat oleh unit Anda. Informasi yang ditampilkan meliputi tahun anggaran, kegiatan, mata anggaran, dan nilai anggaran awal yang diajukan.

Di bagian bawah tabel terdapat **ringkasan** yang menampilkan:
- **Total PKT:** jumlah seluruh item PKT
- **Total Nilai Anggaran Awal:** akumulasi dari seluruh nilai anggaran awal yang diajukan

*(Screenshot: Halaman Daftar PKT)*

### Syarat Pengisian

- Status RAPBS unit harus **Draft** atau **Ditolak**. Jika RAPBS sudah diajukan atau disetujui, tombol **Tambah PKT** akan dinonaktifkan dan sistem akan menampilkan peringatan.
- Data Mata Anggaran, Sub Mata Anggaran, Program Kerja, dan Kegiatan harus sudah tersedia di sistem.

### Cara Menambah PKT

Klik tombol **Tambah PKT**. Anda akan diarahkan ke halaman formulir pengisian PKT.

*(Screenshot: Halaman Form Tambah PKT)*

### Field yang Wajib Diisi

---

#### a. Unit (Otomatis)

- **Tipe:** Teks (tidak dapat diubah)
- **Keterangan:** Unit kerja Anda terisi secara otomatis berdasarkan akun yang sedang login. Tidak perlu dan tidak dapat diubah.

---

#### b. Tahun Anggaran *

- **Tipe:** Dropdown pilihan
- **Keterangan:** Pilih tahun anggaran yang sesuai dengan periode perencanaan. Tahun anggaran ini harus sama dengan tahun anggaran pada Mata Anggaran yang akan dipilih. Jika tahun anggaran diubah, pilihan Mata Anggaran dan Sub Mata Anggaran akan di-reset secara otomatis.
- **Wajib diisi.**

---

#### c. Kegiatan *

- **Tipe:** Dropdown pilihan dengan fitur pencarian
- **Keterangan:** Pilih kegiatan yang akan dijadikan PKT. Anda dapat mencari kegiatan berdasarkan **kode** atau **nama kegiatan**. Setiap pilihan menampilkan kode kegiatan beserta nama program kerja dan strategi terkait untuk memudahkan identifikasi.
- **Wajib diisi.**

> **Catatan:** Setelah kegiatan dipilih, sistem akan **otomatis mengisi** data berikut pada panel informasi berwarna biru:
> - **Sasaran Strategis** — dari data strategi yang terkait dengan kegiatan
> - **Indikator** — dari data indikator yang terkait
> - **Program Kerja** — dari data proker yang terkait
>
> Data ini bersifat **read-only** (hanya baca) dan tidak dapat diubah secara langsung. Jika ingin mengubah data tersebut, pilih kegiatan yang berbeda.

*(Screenshot: Panel Hierarki Perencanaan setelah kegiatan dipilih)*

---

#### d. Mata Anggaran *

- **Tipe:** Dropdown pilihan dengan fitur pencarian
- **Keterangan:** Pilih mata anggaran yang sesuai untuk kegiatan ini. Daftar mata anggaran yang tampil sudah difilter berdasarkan **unit** dan **tahun anggaran** yang dipilih. Setiap pilihan menampilkan kode dan nama mata anggaran.
- **Wajib diisi.**

> **Catatan:** Pastikan Mata Anggaran sudah dibuat pada **Tahap 1** dengan tahun anggaran yang sama. Jika tidak ada pilihan yang muncul, periksa apakah Mata Anggaran sudah tersedia untuk tahun dan unit yang bersangkutan.

---

#### e. Sub Mata Anggaran *

- **Tipe:** Dropdown pilihan dengan fitur pencarian
- **Keterangan:** Pilih sub mata anggaran di bawah mata anggaran yang telah dipilih. Field ini **baru aktif** setelah Mata Anggaran dipilih. Jika Mata Anggaran diubah, pilihan Sub Mata Anggaran akan di-reset.
- **Wajib diisi.**

> **Catatan:** Pastikan Sub Mata Anggaran sudah dibuat pada **Tahap 2**. Minimal satu sub mata anggaran harus tersedia untuk setiap mata anggaran yang akan digunakan pada PKT.

---

#### f. Deskripsi Kegiatan

- **Tipe:** Textarea (area teks panjang)
- **Keterangan:** Jelaskan secara ringkas mengenai isi atau rincian kegiatan yang akan dilaksanakan. Deskripsi ini membantu pihak pemberi persetujuan (approver) memahami substansi kegiatan.
- **Opsional, namun disarankan untuk diisi.**

---

#### g. Tujuan Kegiatan

- **Tipe:** Textarea (area teks panjang)
- **Keterangan:** Jelaskan tujuan atau hasil yang diharapkan dari pelaksanaan kegiatan ini. Informasi ini berguna untuk evaluasi dan pelaporan.
- **Opsional, namun disarankan untuk diisi.**

---

#### h. Nilai Anggaran Awal yang Diajukan *

- **Tipe:** Input mata uang (format Rupiah)
- **Keterangan:** Masukkan besaran anggaran yang diajukan untuk kegiatan ini. Nilai akan otomatis diformat dengan pemisah ribuan (titik). Nilai harus **lebih besar dari 0** (nol). Field ini menjadi dasar perhitungan RAPBS unit Anda.
- **Wajib diisi.**
- **Validasi:** Nilai harus lebih besar dari Rp 0.

> **Contoh pengisian:** Ketik `5000000` dan sistem akan menampilkan `5.000.000` (lima juta rupiah).

---

#### i. Volume

- **Tipe:** Input angka
- **Default:** 1
- **Keterangan:** Masukkan jumlah atau kuantitas kegiatan yang akan dilaksanakan. Misalnya, jika kegiatan dilaksanakan 2 kali dalam setahun, isi dengan angka `2`.
- **Opsional** (default: 1).

---

#### j. Satuan

- **Tipe:** Input teks
- **Default:** paket
- **Contoh:** paket, unit, kegiatan, orang, kali, bulan
- **Keterangan:** Masukkan satuan pengukuran untuk volume kegiatan. Satuan ini akan tampil pada laporan bersama dengan angka volume.
- **Opsional** (default: paket).

---

### Cara Menyimpan PKT

1. Pastikan semua field bertanda bintang merah (*) sudah terisi dengan benar.
2. Tombol **Simpan PKT** akan aktif (berwarna biru) jika semua data wajib sudah terisi.
3. Klik tombol **Simpan PKT** untuk menyimpan data.
4. Jika berhasil, sistem akan menampilkan notifikasi **"PKT berhasil dibuat"** dan mengarahkan Anda kembali ke halaman daftar PKT.
5. Jika terdapat kesalahan, sistem akan menampilkan pesan error yang menjelaskan field mana yang perlu diperbaiki.

*(Screenshot: Tombol Simpan PKT aktif)*

---

### Mengedit PKT

Untuk mengedit PKT yang sudah dibuat, klik ikon **Edit** pada baris PKT di halaman daftar. Pada halaman edit, Anda dapat mengubah:

- Deskripsi Kegiatan
- Tujuan Kegiatan
- Nilai Anggaran Awal yang Diajukan
- Volume
- Satuan

> **Catatan:** Data Kegiatan, Mata Anggaran, Sub Mata Anggaran, dan hierarki perencanaan **tidak dapat diubah** setelah PKT dibuat. Jika perlu mengubah data tersebut, hapus PKT yang ada dan buat PKT baru.

*(Screenshot: Halaman Edit PKT)*

---

### Menghapus PKT

Untuk menghapus PKT, klik ikon **Hapus** pada baris PKT di halaman daftar. Sistem akan menampilkan dialog konfirmasi. Klik **Hapus** untuk mengonfirmasi penghapusan.

> **Peringatan:** PKT yang sudah dihapus tidak dapat dikembalikan. Pastikan Anda yakin sebelum menghapus.

---

## 8. Catatan Penting

### Status RAPBS dan Pengisian PKT

| Status RAPBS | Dapat Mengisi PKT? | Keterangan |
|---|---|---|
| **Draft** | Ya | PKT dapat ditambah, diedit, dan dihapus |
| **Ditolak** | Ya | PKT dapat ditambah, diedit, dan dihapus |
| **Diajukan** | Tidak | PKT terkunci selama proses review |
| **Disetujui** | Tidak | Pengisian PKT ditutup |
| **APBS Generated** | Tidak | Pengisian PKT ditutup |
| **Aktif** | Tidak | Pengisian PKT ditutup |

### Urutan Pengisian yang Benar

Selalu ikuti urutan pengisian data berikut untuk menghindari kendala:

1. **Mata Anggaran** — buat terlebih dahulu di menu Anggaran → Mata Anggaran
2. **Sub Mata Anggaran** — buat bersamaan saat membuat/mengedit Mata Anggaran
3. **Sasaran Strategis** — buat di menu SIPAKAT → Strategi (jika belum ada)
4. **Indikator** — buat di menu SIPAKAT → Indikator (jika belum ada)
5. **Program Kerja** — buat di menu SIPAKAT → Proker
6. **Kegiatan** — buat di menu SIPAKAT → Kegiatan
7. **PKT** — buat di menu SIPAKAT → PKT

### Tips Pengisian

- **Gunakan fitur pencarian** pada setiap dropdown untuk menemukan data dengan cepat, terutama jika jumlah data cukup banyak.
- **Perhatikan tahun anggaran** — pastikan tahun anggaran pada Mata Anggaran dan PKT sama agar data mata anggaran muncul pada pilihan dropdown.
- **Isi deskripsi dan tujuan kegiatan** meskipun bersifat opsional, karena informasi ini sangat membantu proses persetujuan (approval).
- **Periksa ringkasan total** di bagian bawah halaman daftar PKT untuk memastikan akumulasi anggaran sesuai dengan perencanaan unit Anda.
- **Gunakan fitur Import** pada Program Kerja dan Kegiatan jika Anda memiliki data dalam jumlah banyak untuk mempercepat proses pengisian.

### Bantuan

Jika Anda mengalami kendala dalam pengisian PKT atau memiliki pertanyaan, silakan hubungi Administrator sistem atau Tim IT lembaga Anda.

---

*Dokumen ini dibuat untuk Sistem Informasi Anggaran (SIANGGAR).*
*Terakhir diperbarui: Februari 2026.*
