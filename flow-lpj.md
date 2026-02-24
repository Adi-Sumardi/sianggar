# Flow LPJ (Laporan Pertanggungjawaban)

Dokumen ini menjelaskan alur lengkap proses **LPJ (Laporan Pertanggungjawaban)** dari Unit/Substansi hingga tercatat di sistem Akuntansi dan Dashboard Leadership.

---

## Tahap Pertama – Pembuatan & Review Awal LPJ

### A. Role Unit
Unit yang dapat membuat LPJ:
- RA Sakinah  
- Playgroup Sakinah  
- TKIA Al Azhar 13  
- SDIA Al Azhar 13  
- SMPIA Al Azhar 12  
- SMPIA Al Azhar 55  
- SMAIA Al Azhar 33  

### B. Role Substansi
- Asrama  
- Laz  
- Litbang  
- STEBank  
- Staf Direktur  
- Staf Sekretariat  
- SDM  
- Umum  

### Alur:
1. Unit/Substansi membuat LPJ.
2. LPJ masuk ke dashboard **Staf Keuangan** untuk pemeriksaan tahap awal.
3. Keputusan Staf Keuangan:
   - **Approve** → lanjut ke Tahap Kedua.
   - **Revisi** → LPJ dikembalikan dengan catatan revisi + notifikasi.  
     Pengaju melakukan perbaikan dan klik **Revised** untuk mengirim ulang LPJ.
   - **Tolak** → proses LPJ berhenti, notifikasi penolakan dikirim.  
     Pengaju harus membuat LPJ baru.

---

## Tahap Kedua – Pemeriksaan Kelengkapan LPJ (Staf Keuangan)

### 1. Checklist Kelengkapan LPJ
(Staf Keuangan wajib melakukan checklist)
- Identitas kegiatan
- Surat pengantar LPJ (ditandatangani Kepala Unit/Kepsek)
- Laporan naratif capaian kegiatan
- Laporan keuangan
- Kuitansi atau bukti-bukti pengeluaran

### 2. Rujukan LPJ
(Staf Keuangan memilih salah satu)
- Bidang Pendidikan
- Bidang SDM dan Umum
- Bidang Internal Sekretariat

---

## Tahap Ketiga – Distribusi Berdasarkan Rujukan LPJ

- LPJ Bidang Pendidikan → Dashboard **Direktur Pendidikan**
- LPJ Bidang SDM dan Umum → Dashboard **Kabag SDM dan Umum**
- LPJ Bidang Internal Sekretariat → Dashboard **Kabag Sekretariat**

---

## Tahap Keempat – Approval Bidang

(Setiap dashboard memiliki tombol **Revisi**, **Tolak**, dan **Approve**)

- Pendidikan  
  - Direktur Pendidikan → (Approve) → Keuangan
- SDM & Umum  
  - Kabag SDM & Umum → (Approve) → Keuangan
- Internal Sekretariat  
  - Kabag Sekretariat → (Approve) → Keuangan

Logika **Revisi** dan **Tolak** sama seperti tahap sebelumnya:
- Revisi → kembali ke pengaju dengan catatan + notifikasi
- Tolak → proses LPJ berhenti

---

## Tahap Kelima – Finalisasi Keuangan

Pada Dashboard **Keuangan** tersedia tombol:
- Revisi
- Tolak
- Approve

Jika **Approve**:
1. Data LPJ disimpan ke **Database LPJ**.
2. Data LPJ otomatis muncul di:
   - Dashboard **Akuntansi**
   - Dashboard **Role Leadership**

Status LPJ dinyatakan **Selesai**.

---

## Catatan Sistem
- Setiap revisi dan penolakan wajib menyimpan catatan (audit trail).
- LPJ yang ditolak tidak dapat dilanjutkan dan harus dibuat ulang.
- LPJ yang sudah disetujui Keuangan bersifat final dan menjadi arsip akuntansi.
