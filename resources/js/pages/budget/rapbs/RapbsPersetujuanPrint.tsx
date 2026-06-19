import { Fragment } from 'react';

import { formatRupiah } from '@/lib/currency';
import { isThreeSignerUnit, isDirekturPendidikanUnit, DIREKTUR_PENDIDIKAN_NAMA } from '@/lib/unitSignatory';
import { getSubMataAnggarans, getDetailMataAnggarans } from '@/services/budgetService';
import type { RapbsUnitData } from '@/services/budgetService';
import type { Rapbs } from '@/types/models';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIREKTUR_NAMA = 'Drs. Nasjudi, M.Pd';
const KETUA_UMUM_NAMA = 'H. Kunrat Wirasubrata, MBA';
const BENDAHARA_NAMA = 'M. Sholihul Anwar SAP, M.Ak';

const TANGGAL_PERSETUJUAN_PEMBINA = '03 Juni 2026';
const TANGGAL_DITERIMA = '19 Juni 2026';

// Unit names classified as schools (Kepala Sekolah) vs non-school (Kepala Bagian)
const SCHOOL_UNIT_KEYWORDS = ['ra ', 'ra sakinah', 'playgroup', 'tk ', 'sd ', 'smp', 'sma', 'smk', 'tsanawiyah', 'aliyah', 'ibtidaiyah', 'raudhatul'];

function isSchoolUnit(unitNama?: string | null): boolean {
    if (!unitNama) return false;
    const lower = unitNama.toLowerCase();
    return SCHOOL_UNIT_KEYWORDS.some((kw) => lower.includes(kw));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersetujuanDetail {
    uraian: string;
    jumlah: number;
}

interface PersetujuanSub {
    kode: string;
    nama: string;
    details: PersetujuanDetail[];
}

export interface PersetujuanMataAnggaran {
    kode: string;
    nama: string;
    total: number;
    subs: PersetujuanSub[];
    /** Detail langsung di bawah mata anggaran (jika tidak punya sub). */
    details: PersetujuanDetail[];
}

export interface ProgramPrioritas {
    kode: string | null;
    nama: string;
    deskripsi: string | null;
}

/**
 * Urutkan program prioritas berdasarkan kode mata anggaran (menaik, natural sort).
 * Item tanpa kode diletakkan di akhir. Mengembalikan array baru.
 */
export function sortProgramPrioritas(list: ProgramPrioritas[]): ProgramPrioritas[] {
    return [...list].sort((a, b) => {
        if (!a.kode) return 1;
        if (!b.kode) return -1;
        return a.kode.localeCompare(b.kode, undefined, { numeric: true });
    });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function n(v: unknown): number {
    const num = Number(v);
    return isNaN(num) ? 0 : num;
}

function fmtVolume(v: unknown): string {
    const num = n(v);
    return Number.isInteger(num) ? String(num) : new Intl.NumberFormat('id-ID').format(num);
}

function toUraian(d: { nama: string; volume: unknown; satuan: string; harga_satuan: unknown }): string {
    return `${d.nama}  (${fmtVolume(d.volume)} ${d.satuan} × Rp ${n(d.harga_satuan).toLocaleString('id-ID')})`;
}

function formatAcademicYear(year: string): string {
    if (year.includes('/')) return year;
    const yearNum = parseInt(year, 10) || new Date().getFullYear();
    return `${yearNum}/${yearNum + 1}`;
}

function formatTanggal(value?: string | null): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// ---------------------------------------------------------------------------
// Data builder (mirrors buildUnitSheet in exportRapbsExcel.ts)
// ---------------------------------------------------------------------------

/**
 * Susun data rincian untuk dokumen persetujuan.
 */
export async function buildPersetujuanData(unit: RapbsUnitData): Promise<PersetujuanMataAnggaran[]> {
    const result: PersetujuanMataAnggaran[] = [];

    for (const ma of unit.mata_anggarans) {
        const entry: PersetujuanMataAnggaran = {
            kode: ma.kode,
            nama: ma.nama,
            total: n(ma.total),
            subs: [],
            details: [],
        };

        const subsResp = await getSubMataAnggarans(ma.id, { per_page: 500 });
        const subs = subsResp.data || [];

        if (subs.length === 0) {
            const detailsResp = await getDetailMataAnggarans({ mata_anggaran_id: ma.id, per_page: 500 });
            entry.details = (detailsResp.data || []).map((d) => ({
                uraian: toUraian(d),
                jumlah: n(d.jumlah),
            }));
        } else {
            for (const sub of subs) {
                const detailsResp = await getDetailMataAnggarans({
                    mata_anggaran_id: ma.id,
                    sub_mata_anggaran_id: sub.id,
                    per_page: 500,
                });
                entry.subs.push({
                    kode: sub.kode,
                    nama: sub.nama,
                    details: (detailsResp.data || []).map((d) => ({
                        uraian: toUraian(d),
                        jumlah: n(d.jumlah),
                    })),
                });
            }
        }

        result.push(entry);
    }

    return result;
}

// ---------------------------------------------------------------------------
// Tabel Rincian Anggaran (hierarkis: mata anggaran → sub → detail)
// Dipakai bersama oleh cetak RAPBS & halaman pengesahan APBS.
// ---------------------------------------------------------------------------

export function RincianAnggaranTable({
    mataAnggarans,
    totalAnggaran,
}: {
    mataAnggarans: PersetujuanMataAnggaran[];
    totalAnggaran: number;
}) {
    return (
        <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
                <tr className="bg-blue-600 text-white">
                    <th className="border border-slate-300 px-2 py-1 text-center w-8">No.</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Mata Anggaran</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Sub Mata Anggaran</th>
                    <th className="border border-slate-300 px-2 py-1 text-left">Detail Anggaran</th>
                    <th className="border border-slate-300 px-2 py-1 text-right">Anggaran</th>
                </tr>
            </thead>
            <tbody>
                {mataAnggarans.map((ma, maIdx) => (
                    <Fragment key={`${ma.kode}-${maIdx}`}>
                        {/* Baris Mata Anggaran */}
                        <tr className="bg-blue-50 font-semibold">
                            <td className="border border-slate-300 px-2 py-1 text-center">{maIdx + 1}.</td>
                            <td className="border border-slate-300 px-2 py-1" colSpan={3}>
                                {ma.kode}&nbsp;&nbsp;{ma.nama}
                            </td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(ma.total)}</td>
                        </tr>

                        {/* Detail langsung (mata anggaran tanpa sub) */}
                        {ma.details.map((d, dIdx) => (
                            <tr key={`d-${maIdx}-${dIdx}`}>
                                <td className="border border-slate-300 px-2 py-1" />
                                <td className="border border-slate-300 px-2 py-1" />
                                <td className="border border-slate-300 px-2 py-1" />
                                <td className="border border-slate-300 px-2 py-1 text-slate-600">{d.uraian}</td>
                                <td className="border border-slate-300 px-2 py-1 text-right text-slate-600">{formatRupiah(d.jumlah)}</td>
                            </tr>
                        ))}

                        {/* Sub Mata Anggaran + detailnya */}
                        {ma.subs.map((sub, subIdx) => (
                            <Fragment key={`s-${maIdx}-${subIdx}`}>
                                <tr className="bg-slate-100">
                                    <td className="border border-slate-300 px-2 py-1" />
                                    <td className="border border-slate-300 px-2 py-1" />
                                    <td className="border border-slate-300 px-2 py-1 font-semibold" colSpan={3}>
                                        {sub.kode}&nbsp;&nbsp;{sub.nama}
                                    </td>
                                </tr>
                                {sub.details.map((d, dIdx) => (
                                    <tr key={`sd-${maIdx}-${subIdx}-${dIdx}`}>
                                        <td className="border border-slate-300 px-2 py-1" />
                                        <td className="border border-slate-300 px-2 py-1" />
                                        <td className="border border-slate-300 px-2 py-1" />
                                        <td className="border border-slate-300 px-2 py-1 text-slate-600">{d.uraian}</td>
                                        <td className="border border-slate-300 px-2 py-1 text-right text-slate-600">{formatRupiah(d.jumlah)}</td>
                                    </tr>
                                ))}
                            </Fragment>
                        ))}
                    </Fragment>
                ))}
                {/* Baris TOTAL diletakkan di tbody (bukan tfoot) agar tidak
                    terulang di setiap halaman saat dokumen dicetak. */}
                <tr className="bg-slate-800 text-white font-bold">
                    <td className="border border-slate-300 px-2 py-1" />
                    <td className="border border-slate-300 px-2 py-1" colSpan={3}>TOTAL ANGGARAN</td>
                    <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(totalAnggaran)}</td>
                </tr>
            </tbody>
        </table>
    );
}

// ---------------------------------------------------------------------------
// Print Document Component
// ---------------------------------------------------------------------------

interface RapbsPersetujuanDocumentProps {
    unit: RapbsUnitData;
    tahun: string;
    mataAnggarans: PersetujuanMataAnggaran[];
    rapbs?: Rapbs;
    /** Nama Kepala Sekolah/Kepala Unit, diisi lewat popup sebelum cetak. */
    kepalaSekolah?: string;
    /** Nama Kabag Keuangan (unit 3-penandatangan), diisi lewat popup sebelum cetak. */
    kabagKeuangan?: string;
    /** Nama Kabag SDM dan Umum (unit 3-penandatangan), diisi lewat popup sebelum cetak. */
    kabagSdmUmum?: string;
    /** Program unggulan unit untuk tahun ajaran ini. */
    programPrioritas?: ProgramPrioritas[];
}

export function RapbsPersetujuanDocument({
    unit,
    tahun,
    mataAnggarans,
    rapbs,
    kepalaSekolah,
    kabagKeuangan,
    kabagSdmUmum,
    programPrioritas = [],
}: RapbsPersetujuanDocumentProps) {
    const tahunAnggaran = formatAcademicYear(tahun);
    const totalAnggaran = mataAnggarans.reduce((s, ma) => s + ma.total, 0);
    const isThreeSigner = isThreeSignerUnit(unit.unit_nama);
    const isDirpen = isDirekturPendidikanUnit(unit.unit_nama);
    const kepalaLabel = isSchoolUnit(unit.unit_nama) ? 'Kepala Sekolah' : 'Kepala Bagian';
    const placeholderNama = '................................';
    // Penandatangan kolom utama: Direktur Pendidikan pakai nama & jabatan khusus,
    // unit lain pakai nama dari popup/pengaju dengan jabatan Kepala Bagian.
    const kepalaNama = isDirpen
        ? DIREKTUR_PENDIDIKAN_NAMA
        : kepalaSekolah || rapbs?.submitter?.name || placeholderNama;
    const kepalaRole = isDirpen ? 'Direktur Pendidikan' : 'Kepala Bagian';

    return (
        <div className="bg-white p-8 print:p-4" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Header */}
            <div className="relative flex items-center mb-8" style={{ minHeight: 80 }}>
                {/* Logo kiri */}
                <div className="absolute left-0 top-0 shrink-0">
                    <img
                        src="/logo/yapi.png"
                        alt="Logo YAPI"
                        style={{
                            width: 72,
                            height: 72,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #e2e8f0',
                        }}
                    />
                </div>
                {/* Teks tengah */}
                <div className="flex-1 text-center">
                    <h2 className="text-lg font-bold uppercase mt-1">
                        Anggaran Belanja Sekolah
                    </h2>
                    <h3 className="text-base font-semibold mt-1">
                        Tahun Ajaran {tahunAnggaran}
                    </h3>
                </div>
            </div>

            {/* Document Info */}
            <div className="mb-6 border border-slate-300 p-4 rounded">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {/* Kolom Kiri */}
                    <div className="space-y-2">
                        <div>
                            <span className="font-semibold">Unit:</span>
                            <span className="ml-2">{unit.unit_nama || '-'}</span>
                        </div>
                        <div>
                            <span className="font-semibold">Kode Unit:</span>
                            <span className="ml-2">{unit.unit_kode || '-'}</span>
                        </div>
                    </div>
                    {/* Kolom Kanan */}
                    <div className="space-y-2">
                        <div>
                            <span className="font-semibold">Tanggal Persetujuan Pembina:</span>
                            <span className="ml-2">{TANGGAL_PERSETUJUAN_PEMBINA}</span>
                        </div>
                        <div>
                            <span className="font-semibold">Tanggal Diterima:</span>
                            <span className="ml-2">{TANGGAL_DITERIMA}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Program Prioritas */}
            <div className="mb-6 border border-slate-300 p-4 rounded">
                <h4 className="font-bold text-sm mb-3 border-b border-slate-300 pb-1">PROGRAM PRIORITAS</h4>
                {programPrioritas.length > 0 ? (
                    <ul className="text-sm space-y-3">
                        {programPrioritas.map((p, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                                <div>
                                    <div>
                                        {p.kode && <span className="font-mono text-xs text-slate-500 mr-2">[{p.kode}]</span>}
                                        <span className="font-medium">{p.nama}</span>
                                    </div>
                                    {p.deskripsi && (
                                        <p className="mt-1 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{p.deskripsi}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-slate-400 italic">Belum ada program prioritas untuk tahun ajaran ini.</p>
                )}
            </div>

            {/* Rincian Anggaran - struktur sama dengan export Excel */}
            <div className="mb-8">
                <h4 className="font-bold text-sm mb-2 border-b border-slate-300 pb-1">RINCIAN ANGGARAN</h4>
                <RincianAnggaranTable mataAnggarans={mataAnggarans} totalAnggaran={totalAnggaran} />
            </div>

            {/* Signature Section */}
            <div className="mt-12 page-break-inside-avoid text-sm">
                {isThreeSigner ? (
                    /* Blok 1 (unit khusus): Kabag Keuangan | Kabag SDM dan Umum | Kepala Bagian/Direktur Pendidikan */
                    <>
                        <div className="text-right">
                            <p>Jakarta, {formatTanggal(rapbs?.approved_at ?? new Date().toISOString())}</p>
                            <p>{unit.unit_nama}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-8 text-center">
                            <div>
                                <p className="mt-20 font-bold underline">{kabagKeuangan || placeholderNama}</p>
                                <p>Kabag Keuangan</p>
                            </div>
                            <div>
                                <p className="mt-20 font-bold underline">{kabagSdmUmum || placeholderNama}</p>
                                <p>Kabag SDM dan Umum</p>
                            </div>
                            <div>
                                <p className="mt-20 font-bold underline">{kepalaNama}</p>
                                <p>{kepalaRole}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Blok 1 (default): Direktur (kiri) & Kepala Sekolah/Bagian (kanan) */
                    <div className="flex justify-between gap-8">
                        <div>
                            <p>Direktorat Pendidikan</p>
                            <p>Yayasan Asrama Pelajar Islam</p>
                            <p className="mt-20 font-bold underline">{DIREKTUR_NAMA}</p>
                            <p>Direktur</p>
                        </div>
                        <div>
                            <p>Jakarta, {formatTanggal(rapbs?.approved_at ?? new Date().toISOString())}</p>
                            <p>{unit.unit_nama}</p>
                            <p className="mt-20 font-bold underline">
                                {kepalaSekolah || rapbs?.submitter?.name || placeholderNama}
                            </p>
                            <p>{kepalaLabel}</p>
                        </div>
                    </div>
                )}

                {/* Mengetahui */}
                <div className="mt-10 text-center">
                    <p>Mengetahui</p>
                    <p>Yayasan Asrama Pelajar Islam</p>
                    <p>Pengurus</p>
                </div>

                {/* Blok 2: Ketua Umum (kiri) & Bendahara (kanan) */}
                <div className="flex justify-between gap-8">
                    <div>
                        <p className="mt-20 font-bold underline">{KETUA_UMUM_NAMA}</p>
                        <p>Ketua Umum</p>
                    </div>
                    <div>
                        <p className="mt-20 font-bold underline">{BENDAHARA_NAMA}</p>
                        <p>Bendahara</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 text-center print:mt-4">
                <p>Dokumen ini digenerate oleh SIANGGAR - Sistem Informasi Pengajuan Anggaran</p>
                <p>RAPBS {unit.unit_nama} - Tahun Ajaran {tahunAnggaran}</p>
            </div>
        </div>
    );
}
