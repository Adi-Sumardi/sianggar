// ---------------------------------------------------------------------------
// Kebijakan edit anggaran per unit
// ---------------------------------------------------------------------------
// Saat ini hanya unit Bagian Umum, STEBANK, dan Sekretariat yang masih
// diperbolehkan mengubah/menghapus data anggaran (PKT, RAPBS, Mata Anggaran).

const EDITABLE_UNIT_KEYWORDS = ['bagian umum', 'stebank', 'sekretariat'];

/**
 * Cek apakah unit (berdasarkan nama/kode) masih boleh mengedit data anggaran.
 * Menerima beberapa identifier (nama, kode, field legacy) — cukup salah satu
 * yang cocok dengan daftar unit yang diizinkan.
 */
export function canUnitEditBudget(...identifiers: Array<string | null | undefined>): boolean {
    const text = identifiers.filter(Boolean).join(' ').toLowerCase();
    return EDITABLE_UNIT_KEYWORDS.some((keyword) => text.includes(keyword));
}

export const UNIT_EDIT_DISABLED_MESSAGE =
    'Hanya unit Bagian Umum, STEBANK, dan Sekretariat yang dapat mengubah data';
