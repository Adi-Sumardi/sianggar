# Flow Pengajuan & Approval

Dokumen ini menjelaskan alur lengkap (end-to-end) proses **pengajuan dan approval anggaran** dari Unit/Substansi hingga Payment.

---

## Tahap Pertama – Pengajuan Awal

### A. Role Unit
Unit berikut membuat pengajuan:
- RA Sakinah  
- Playgroup Sakinah  
- TKIA Al Azhar 13  
- SDIA Al Azhar 13  
- SMPIA Al Azhar 12  
- SMPIA Al Azhar 55  
- SMAIA Al Azhar 33  

**Alur:**
1. Unit membuat pengajuan.
2. Pengajuan diperiksa oleh **Staf Direktur**.
3. Keputusan Staf Direktur:
   - **Approve** → diteruskan ke **Staf Keuangan**.
   - **Revisi** → pengajuan dikembalikan ke Unit dengan catatan revisi + notifikasi.  
     Unit melakukan perbaikan lalu klik **Revised** untuk mengajukan kembali.
   - **Tolak** → proses berhenti, notifikasi penolakan dikirim, saldo pengajuan dikembalikan.  
     Unit harus membuat pengajuan baru.

---

### B. Role Substansi
Substansi berikut membuat pengajuan:
- Asrama  
- Laz  
- Litbang  
- STEBank  
- Staf Direktur  
- Staf Sekretariat  
- SDM  
- Umum  

**Alur:**
1. Substansi membuat pengajuan.
2. Tahap pertama diperiksa oleh **Staf Keuangan**.
3. Keputusan Staf Keuangan:
   - **Approve** → lanjut ke Tahap Kedua.
   - **Revisi** → dikembalikan dengan catatan revisi + notifikasi, pengaju klik **Revised**.
   - **Tolak** → proses berhenti, saldo dikembalikan, harus membuat pengajuan baru.

---

## Tahap Kedua – Pemeriksaan Staf Keuangan (Unit)

Staf Keuangan melakukan pemeriksaan dengan checklist berikut:

### 1. Cek Kelengkapan Pengajuan
- Keabsahan dokumen (sesuai APBS, surat, proposal lengkap)
- Bebas kesalahan input/hitung/data
- Kesesuaian kode kegiatan & mata anggaran
- Kelayakan dan kewajaran volume, harga, serta personal pelaksana

### 2. Jumlah Pengajuan Anggaran
- < 10 Juta → diteruskan sesuai rujukan
- ≥ 10 Juta → diteruskan sesuai rujukan (jalur pimpinan)

### 3. Rujukan Pengajuan
- Bidang Pendidikan
- Bidang SDM dan Umum
- Bidang Internal Sekretariat

### 4. Kebutuhan LPJ
- Ya
- Tidak

---

## Tahap Ketiga – Distribusi Berdasarkan Nilai & Rujukan

- ≥ 10 Juta + Pendidikan → Direktur Pendidikan  
- ≥ 10 Juta + SDM & Umum → Kabag SDM & Umum  
- ≥ 10 Juta + Internal Sekretariat → Kabag Sekretariat  
- < 10 Juta + Pendidikan → Direktur Pendidikan  
- < 10 Juta + SDM & Umum → Kabag SDM & Umum  
- < 10 Juta + Internal Sekretariat → Kabag Sekretariat  

---

## Tahap Keempat – Approval Menengah

(Setiap dashboard memiliki tombol **Revisi**, **Tolak**, **Approve**)

- ≥ 10 Juta + Pendidikan  
  - Direktur Pendidikan → (Approve) → Wakil Ketua
- ≥ 10 Juta + SDM & Umum  
  - Kabag SDM & Umum → (Approve) → Sekretaris
- ≥ 10 Juta + Internal Sekretariat  
  - Kabag Sekretariat → (Approve) → Sekretaris
- < 10 Juta (semua bidang)  
  - Kabag/Direktur terkait → (Approve) → Keuangan

---

## Tahap Kelima – Wakil Ketua / Sekretaris

- **Wakil Ketua**: Revisi, Tolak, Approve → (Approve) → Ketua Umum  
- **Sekretaris**: Revisi, Tolak, Approve → (Approve) → Ketua Umum  

---

## Tahap Keenam – Ketua Umum

Fitur:
- Diskusi
- Revisi
- Tolak
- Approve

**Diskusi:**
- Dialog muncul di dashboard terkait (Kabag, Direktur, Sekretaris, Wakil Ketua, Bendahara)
- Notifikasi diskusi dikirim via WA
- Dialog dicatat sistem dan dapat ditutup oleh Ketua Umum

**Approve** → diteruskan ke **Keuangan**

---

## Tahap Ketujuh – Keuangan Final

Tombol:
- Dialog (riwayat)
- Revisi
- Edit (ubah nominal, tercatat sistem)
- Approve → Bendahara

---

## Tahap Kedelapan – Bendahara

Tombol:
- Dialog (riwayat)
- Revisi
- Edit (riwayat edit dari Keuangan)
- Approve → status **Done**, diteruskan ke Kasir

---

## Tahap Kesembilan – Kasir

- Menampilkan pengajuan **Done**
- Cetak Voucher
- Setelah dicetak → Payment

---

## Tahap Kesepuluh – Payment

- Data voucher siap bayar
- Proses pembayaran via CMS Bank
- Klik **Selesai**
- Notifikasi ke pengaju bahwa dana telah ditransfer
