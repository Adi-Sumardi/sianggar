# Flow Pengajuan & Approval (Versi Teknis / Developer)

Dokumen ini mendeskripsikan **alur sistem (system flow)** pengajuan dan approval anggaran dalam perspektif teknis untuk kebutuhan pengembangan aplikasi (backend, frontend, dan workflow engine).

---

## 1. Aktor & Role Sistem

### 1.1 Role Unit
- RA Sakinah  
- Playgroup Sakinah  
- TKIA Al Azhar 13  
- SDIA Al Azhar 13  
- SMPIA Al Azhar 12  
- SMPIA Al Azhar 55  
- SMAIA Al Azhar 33  

### 1.2 Role Substansi
- Asrama  
- Laz  
- Litbang  
- STEBank  
- Staf Direktur  
- Staf Sekretariat  
- SDM  
- Umum  

### 1.3 Role Approval & Eksekusi
- Staf Direktur  
- Staf Keuangan  
- Direktur Pendidikan  
- Kabag SDM & Umum  
- Kabag Sekretariat  
- Wakil Ketua  
- Sekretaris  
- Ketua Umum  
- Bendahara  
- Kasir  
- Payment  

---

## 2. Status Pengajuan (State Machine)

Pengajuan memiliki status utama berikut:

- `DRAFT`
- `SUBMITTED`
- `REVISION_REQUIRED`
- `REVISED`
- `REJECTED`
- `APPROVED_LEVEL_1`
- `APPROVED_LEVEL_2`
- `APPROVED_LEVEL_3`
- `FINAL_APPROVED`
- `DONE`
- `PAID`

---

## 3. Tahap 1 – Submit Pengajuan

### 3.1 Unit
- Actor: `Unit`
- Action: `CREATE_PENGAJUAN`
- Initial Status: `SUBMITTED`
- Next Approver: `Staf Direktur`

**Decision oleh Staf Direktur:**
- `APPROVE` → status `APPROVED_LEVEL_1`, route ke `Staf Keuangan`
- `REVISION` → status `REVISION_REQUIRED`, kirim notifikasi + catatan
- `REJECT` → status `REJECTED`, saldo dikembalikan

Jika Unit submit ulang:
- Action: `REVISED`
- Status kembali ke `SUBMITTED`

---

### 3.2 Substansi
- Actor: `Substansi`
- Next Approver: `Staf Keuangan`
- Decision logic sama seperti di atas (Approve / Revisi / Tolak)

---

## 4. Tahap 2 – Validasi Staf Keuangan

### 4.1 Checklist Validasi (Boolean Flags)
- `valid_document`
- `valid_calculation`
- `valid_budget_code`
- `reasonable_cost`
- `reasonable_volume`
- `reasonable_executor`

### 4.2 Parameter Routing
- `amount_category`:
  - `LOW` (< 10.000.000)
  - `HIGH` (≥ 10.000.000)
- `reference_type`:
  - `EDUCATION`
  - `HR_GENERAL`
  - `SECRETARIAT`
- `need_lpj`: `true | false`

---

## 5. Tahap 3 – Routing Otomatis

### Routing Matrix
| Amount | Reference | Next Role |
|------|----------|-----------|
| HIGH | EDUCATION | Direktur Pendidikan |
| HIGH | HR_GENERAL | Kabag SDM & Umum |
| HIGH | SECRETARIAT | Kabag Sekretariat |
| LOW | EDUCATION | Direktur Pendidikan |
| LOW | HR_GENERAL | Kabag SDM & Umum |
| LOW | SECRETARIAT | Kabag Sekretariat |

---

## 6. Tahap 4 – Approval Menengah

**Action tersedia:**
- `APPROVE`
- `REVISION`
- `REJECT`

### Next Routing:
- HIGH + EDUCATION → Wakil Ketua
- HIGH + HR_GENERAL → Sekretaris
- HIGH + SECRETARIAT → Sekretaris
- LOW (semua referensi) → Keuangan

---

## 7. Tahap 5 – Wakil Ketua / Sekretaris

- Decision:
  - `APPROVE` → Ketua Umum
  - `REVISION` / `REJECT` → sesuai state machine

---

## 8. Tahap 6 – Ketua Umum (Final Policy Decision)

### Available Actions
- `OPEN_DISCUSSION`
- `CLOSE_DISCUSSION`
- `APPROVE`
- `REVISION`
- `REJECT`

### Discussion Engine
- Participants auto-subscribed:
  - Direktur Pendidikan
  - Kabag SDM & Umum
  - Kabag Sekretariat
  - Sekretaris
  - Wakil Ketua
  - Bendahara
- Event:
  - `DISCUSSION_CREATED`
  - `DISCUSSION_MESSAGE`
  - `DISCUSSION_CLOSED`
- Notification Channel:
  - Dashboard
  - WhatsApp Gateway

Jika `APPROVE` → route ke `Keuangan`

---

## 9. Tahap 7 – Keuangan Final Adjustment

### Actions
- `VIEW_DISCUSSION_LOG`
- `EDIT_AMOUNT` (audit logged)
- `REVISION`
- `APPROVE` → Bendahara

---

## 10. Tahap 8 – Bendahara

### Actions
- `VIEW_DISCUSSION_LOG`
- `VIEW_EDIT_LOG`
- `EDIT_AMOUNT`
- `APPROVE`

Jika approve:
- Status → `DONE`
- Route → Kasir

---

## 11. Tahap 9 – Kasir

- Action:
  - `PRINT_VOUCHER`
- Status:
  - Voucher printed → route ke Payment

---

## 12. Tahap 10 – Payment

- Action:
  - `PROCESS_CMS_BANK`
  - `MARK_AS_PAID`
- Final Status:
  - `PAID`
- System Event:
  - `NOTIFY_APPLICANT`

---

## 13. Catatan Teknis Implementasi

- Semua perubahan status **wajib audit log**
- Revisi **tidak membuat record baru**
- Reject **mengakhiri workflow**
- Edit nominal hanya diizinkan untuk:
  - Keuangan
  - Bendahara
- Routing bersifat **deterministic (rule-based)**

