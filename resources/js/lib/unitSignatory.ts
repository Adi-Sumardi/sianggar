// ---------------------------------------------------------------------------
// Klasifikasi penandatangan dokumen anggaran per unit
// ---------------------------------------------------------------------------
// Sebagian unit (Direktur Pendidikan, YAPI Sekertariat, LAZ, Asrama, Litbang)
// memakai blok tanda tangan 3-penandatangan:
//   Kabag Keuangan | Kabag SDM dan Umum | Kepala Bagian / Direktur Pendidikan
// sedangkan blok "Mengetahui" (Ketua Umum & Bendahara) tetap sama.
//
// 'sekertariat' mengikuti ejaan nama unit di database; ejaan baku 'sekretariat'
// disertakan untuk jaga-jaga jika nama unit diperbaiki.

const THREE_SIGNER_KEYWORDS = ['sekertariat', 'sekretariat', 'laz', 'asrama', 'litbang', 'direktur pendidikan'];

/** Nama Direktur Pendidikan yang tercantum sebagai penandatangan. */
export const DIREKTUR_PENDIDIKAN_NAMA = 'Drs. Nasjudi, M.Pd';

/**
 * Cek apakah unit memakai blok tanda tangan 3-penandatangan
 * (Kabag Keuangan, Kabag SDM dan Umum, dan kepala unit/Direktur Pendidikan).
 */
export function isThreeSignerUnit(unitNama?: string | null): boolean {
    if (!unitNama) return false;
    const lower = unitNama.toLowerCase();
    return THREE_SIGNER_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Cek apakah unit adalah Direktur Pendidikan (kolom pertama pakai jabatan khusus). */
export function isDirekturPendidikanUnit(unitNama?: string | null): boolean {
    if (!unitNama) return false;
    return unitNama.toLowerCase().includes('direktur pendidikan');
}
