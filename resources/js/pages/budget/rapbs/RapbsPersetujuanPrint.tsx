import { Fragment } from 'react';

import { formatRupiah } from '@/lib/currency';
import { getRapbsStatusLabel } from '@/types/enums';
import { getSubMataAnggarans, getDetailMataAnggarans } from '@/services/budgetService';
import type { RapbsUnitData } from '@/services/budgetService';
import type { Rapbs } from '@/types/models';

// ---------------------------------------------------------------------------
// Dokumen cetak "Lembar Persetujuan Anggaran" per unit.
// Desain mengikuti Lembar Pengesahan APBS (ApbsDetail.tsx);
// struktur tabel rincian & blok tanda tangan mengikuti export Excel.
// ---------------------------------------------------------------------------

// Nama pejabat penandatangan (Kepala Sekolah diambil dinamis dari pengaju RAPBS)
const DIREKTUR_NAMA = 'Drs. Nasjudi, M.Pd';
const KETUA_UMUM_NAMA = 'H. Kunrat Wirasubrata, MBA';
const BENDAHARA_NAMA = 'M. Sholihul Anwar SAP, M.Ak';

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

/**
 * Susun data rincian untuk dokumen persetujuan. Struktur dan sumber datanya
 * sama dengan buildUnitSheet pada export Excel.
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

interface RapbsPersetujuanDocumentProps {
    unit: RapbsUnitData;
    tahun: string;
    mataAnggarans: PersetujuanMataAnggaran[];
    rapbs?: Rapbs;
    /** Nama Kepala Sekolah/Kepala Unit, diisi lewat popup sebelum cetak. */
    kepalaSekolah?: string;
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

export function RapbsPersetujuanDocument({ unit, tahun, mataAnggarans, rapbs, kepalaSekolah }: RapbsPersetujuanDocumentProps) {
    const tahunAnggaran = formatAcademicYear(tahun);
    const totalAnggaran = mataAnggarans.reduce((s, ma) => s + ma.total, 0);

    return (
        <div className="bg-white p-8 print:p-4" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-xl font-bold uppercase tracking-wide">
                    Lembar Persetujuan Anggaran
                </h1>
                <h2 className="text-lg font-bold uppercase mt-1">
                    Rencana Anggaran Pendapatan dan Belanja Sekolah (RAPBS)
                </h2>
                <h3 className="text-base font-semibold mt-1">
                    Tahun Anggaran {tahunAnggaran}
                </h3>
            </div>

            {/* Document Info */}
            <div className="mb-6 border border-slate-300 p-4 rounded">
                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
                    <div>
                        <span className="font-semibold">Unit:</span>
                        <span className="ml-2">{unit.unit_nama || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Kode Unit:</span>
                        <span className="ml-2">{unit.unit_kode || '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Status RAPBS:</span>
                        <span className="ml-2">{rapbs ? getRapbsStatusLabel(rapbs.status) : '-'}</span>
                    </div>
                    <div>
                        <span className="font-semibold">Tanggal Pengajuan:</span>
                        <span className="ml-2">{formatTanggal(rapbs?.submitted_at)}</span>
                    </div>
                </div>
            </div>

            {/* Rincian Anggaran - struktur sama dengan export Excel */}
            <div className="mb-8">
                <h4 className="font-bold text-sm mb-2 border-b border-slate-300 pb-1">RINCIAN ANGGARAN</h4>
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
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-800 text-white font-bold">
                            <td className="border border-slate-300 px-2 py-1" />
                            <td className="border border-slate-300 px-2 py-1" colSpan={3}>TOTAL ANGGARAN</td>
                            <td className="border border-slate-300 px-2 py-1 text-right">{formatRupiah(totalAnggaran)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Signature Section - desain mengikuti format tanda tangan di Excel */}
            <div className="mt-12 page-break-inside-avoid text-sm">
                {/* Blok 1: Direktur (kiri) & Kepala Sekolah (kanan) */}
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
                            {kepalaSekolah || rapbs?.submitter?.name || '................................'}
                        </p>
                        <p>Kepala Sekolah</p>
                    </div>
                </div>

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
                <p>RAPBS {unit.unit_nama} - Tahun Anggaran {tahunAnggaran}</p>
            </div>
        </div>
    );
}
