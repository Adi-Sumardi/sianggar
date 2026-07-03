// Helper tampilan persentase pemakaian anggaran (dipakai di tabel detail item
// pengajuan & approval).

/** Format persen: 79.9 -> "79,9%". */
export function formatPct(pct: number): string {
    return `${pct.toFixed(1).replace('.', ',')}%`;
}

/** Kelas warna Tailwind untuk % pemakaian: hijau <70, amber 70–90, merah >90. */
export function usagePctClass(pct: number | null | undefined): string {
    if (pct == null) return 'text-slate-400';
    if (pct > 90) return 'text-red-600';
    if (pct >= 70) return 'text-amber-600';
    return 'text-emerald-600';
}
