# Flow SIPAKAT (Integrasi Anggaran & Approval RAPBS → APBS)

Dokumen ini menjelaskan alur sistem pada **Menu SIPAKAT** yang terintegrasi langsung dengan **Menu Anggaran**. Flow ini mencakup pembuatan struktur anggaran hingga approval RAPBS dan pembentukan APBS.

---

## 1. Konsep Integrasi SIPAKAT ↔ Anggaran

Ketika **Unit (user_id)** membuat data PKT:
- Data otomatis generate **COA Anggaran Tahun Aktif**
- Data PKT otomatis menjadi **Data Pengajuan Anggaran**
- Data otomatis tersimpan juga ke menu **RAPBS**

Jika RAPBS disetujui penuh → Data masuk ke **APBS** → Bisa digunakan untuk **Pengajuan Anggaran Baru**

Semua aktivitas:
- Komentar
- Diskusi
- Approval History
- Edit History  
Wajib tersimpan di database (audit trail).

---

## 2. Tahap Pembuatan Data (Master Data Setup)

### Tahap 1 – Mata Anggaran
Actor: Unit (user_id)  
Action:
- Create Mata Anggaran

Output:
- Master Mata Anggaran tersimpan

---

### Tahap 2 – COA Setup
Actor: Unit (user_id)  

Action:
- Create Sub Mata Anggaran  
- Create Detail Mata Anggaran  

Output:
- Struktur COA lengkap

---

### Tahap 3 – Perencanaan Program
Actor:
- Unit → Create Proker
- Admin → Menyediakan data Strategi & Indikator

Output:
- Proker siap digunakan untuk mapping kegiatan

---

### Tahap 4 – Kegiatan
Actor: Unit (user_id)  

Action:
- Create Kegiatan
- Relasi ke Proker

Output:
- Master kegiatan siap digunakan PKT

---

### Tahap 5 – PKT (Program Kerja Tahunan)
Actor: Unit (user_id)

Action:
- Create PKT
- Relasi:
  - Kegiatan
  - Detail Mata Anggaran

System Auto Process:
- Generate COA Anggaran Tahun Aktif
- Simpan ke RAPBS
- Generate Data Pengajuan Anggaran

---

## 3. Tahap Approval RAPBS

### 3.1 Jika Pengaju = Role Unit
Approval Flow:
1. Direktur Pendidikan  
2. Keuangan  
3. Sekretaris  
4. Wakil Ketua  
5. Ketua Umum  
6. Bendahara  

Jika Bendahara Approve:
- Data masuk ke APBS
- Anggaran siap dipakai untuk Pengajuan Baru

---

### 3.2 Jika Pengaju = Role Substansi
Approval Flow:
1. Sekretariat  
2. Keuangan  
3. Sekretaris  
4. Wakil Ketua  
5. Ketua Umum  
6. Bendahara  

Jika Bendahara Approve:
- Data masuk ke APBS
- Anggaran siap dipakai untuk Pengajuan Baru

---

## 4. Penyimpanan Data Sistem

Database wajib menyimpan:
- Approval History
- Komentar
- Diskusi
- Edit Log
- Timestamp Perubahan
- User Action Tracking

---

## 5. Menu APBS – Halaman Pengesahan

### Fitur Halaman Pengesahan APBS
- Tampilan data APBS final
- Format siap print
- Area tanda tangan:
  - Kepala Sekolah
  - Bendahara
  - Ketua Umum

Format output:
- PDF Printable Layout
- Nomor Dokumen APBS
- Tahun Anggaran

---

## 6. Dashboard Approval Enhancement

Tambahkan Tab Baru:
### Tab: Approval RAPBS
Posisi:
- Sebelah Tab **Geser Anggaran**
- Pada Menu **Antrian Approval Dashboard**

### Role yang memiliki akses Tab Approval RAPBS:
- Direktur Pendidikan
- Sekretariat
- Keuangan
- Sekretaris
- Wakil Ketua
- Ketua Umum
- Bendahara

---

## 7. Catatan Teknis Implementasi

### Workflow Rules
- Approval bersifat sequential
- Tidak bisa skip role
- Semua action harus audit logged

### Data Consistency
- PKT → RAPBS → APBS harus memiliki relasi ID
- COA auto-generate berdasarkan tahun anggaran aktif

### Notification
- Dashboard Notification
- WhatsApp Notification (optional integration)

---

## 8. Status Workflow (Recommended)

- DRAFT
- SUBMITTED
- VERIFIED
- APPROVED_LEVEL_X
- RAPBS_APPROVED
- APBS_GENERATED
- ACTIVE_BUDGET
