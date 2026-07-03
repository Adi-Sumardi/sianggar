import { formatRupiah } from '@/lib/currency';

// ---------------------------------------------------------------------------
// Dokumen cetak: Surat Permohonan Pengajuan Dana
// ---------------------------------------------------------------------------

interface CetakDetailItem {
    id: number;
    jumlah?: number | null;
    uraian?: string | null;
    mata_anggaran?: { kode?: string; nama?: string } | null;
    sub_mata_anggaran?: { kode?: string; nama?: string } | null;
    detail_mata_anggaran?: { kode?: string; nama?: string } | null;
}

interface CetakPengajuan {
    no_surat?: string | null;
    nomor_pengajuan?: string | null;
    nama_pengajuan?: string | null;
    perihal?: string | null;
    tempat?: string | null;
    waktu_kegiatan?: string | null;
    created_at?: string | null;
    jumlah_pengajuan_total?: number | null;
    unit?: { nama?: string } | null;
    user?: { name?: string } | null;
}

interface PengajuanCetakDocumentProps {
    pengajuan: CetakPengajuan;
    details: CetakDetailItem[];
}

/**
 * Petakan nama unit ke file kop surat di /public/logo/kop.
 * Unit tanpa kop khusus mengembalikan null (fallback ke logo YAPI).
 */
function resolveKop(unitNama?: string | null): string | null {
    if (!unitNama) return null;
    const n = unitNama.toLowerCase();
    if (n.includes('playgroup')) return '/logo/kop/kop-pg.png';
    if (n.includes('raudhatul') || n.includes('ra sakinah') || /\bra\b/.test(n)) return '/logo/kop/kop-ra.png';
    if (n.includes('tk') && n.includes('13')) return '/logo/kop/kop-tk13.png';
    if (n.includes('sd') && n.includes('13')) return '/logo/kop/kop-sd13.png';
    if (n.includes('smp') && n.includes('12')) return '/logo/kop/kop-smp12.png';
    if (n.includes('smp') && n.includes('55')) return '/logo/kop/kop-smp55.png';
    if (n.includes('sma') && n.includes('33')) return '/logo/kop/kop-smaia33.png';
    return null;
}

function formatDateTime(value?: string | null): string {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).replace(/\./g, ':');
}

export function PengajuanCetakDocument({ pengajuan, details }: PengajuanCetakDocumentProps) {
    const namaPermintaan = pengajuan.nama_pengajuan || pengajuan.perihal || '-';
    const total = Number(pengajuan.jumlah_pengajuan_total ?? 0);
    const kop = resolveKop(pengajuan.unit?.nama);

    return (
        <div className="bg-white p-10 text-[13px] leading-relaxed text-slate-800" style={{ fontFamily: 'Times New Roman, serif' }}>
            {/* Kop surat: pakai kop unit bila ada, jika tidak fallback logo YAPI */}
            {kop ? (
                <img src={kop} alt="Kop Surat" className="mb-4" style={{ width: '100%', display: 'block' }} />
            ) : (
                <div className="mb-6">
                    <img
                        src="/logo/yapi.png"
                        alt="Logo YAPI"
                        style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }}
                    />
                </div>
            )}

            {/* Nomor & tanggal */}
            <div className="mb-6 flex items-start justify-between">
                <table className="text-[13px]">
                    <tbody>
                        <tr>
                            <td className="align-top pr-2">Nomor Surat</td>
                            <td className="align-top pr-1">:</td>
                            <td className="align-top">{pengajuan.no_surat || pengajuan.nomor_pengajuan || '-'}</td>
                        </tr>
                        <tr>
                            <td className="align-top pr-2">Perihal</td>
                            <td className="align-top pr-1">:</td>
                            <td className="align-top font-bold">{namaPermintaan}</td>
                        </tr>
                    </tbody>
                </table>
                <div className="text-right">
                    <p className="font-bold">Tanggal Pengajuan:</p>
                    <p>{formatDateTime(pengajuan.created_at)}</p>
                </div>
            </div>

            {/* Tujuan */}
            <div className="mb-5 font-bold italic">
                <p>Kepada Yth,</p>
                <p>BPH YAPI / Direktur Pendidikan YAPI</p>
                <p>di tempat</p>
            </div>

            {/* Salam & pembuka */}
            <p className="mb-4 font-bold italic">Assalamualaikum wr. wb.</p>
            <p className="mb-3">
                Teriring salam dan doa kami sampaikan semoga Allah SWT. selalu melimpahkan rahmat dan
                karunia-Nya kepada kita sekalian, sehingga sukses dalam menjalankan aktivitas sehari-hari, Amin.
            </p>
            <p className="mb-4">
                Berikut ini kami sampaikan <span className="font-bold">permohonan Pengajuan dana</span> :
            </p>

            {/* Info permintaan */}
            <table className="mb-5 text-[13px]">
                <tbody>
                    <tr>
                        <td className="align-top pr-4">Nama Permintaan</td>
                        <td className="align-top pr-1">:</td>
                        <td className="align-top">{namaPermintaan}</td>
                    </tr>
                    <tr>
                        <td className="align-top pr-4">Tempat Pelaksanaan</td>
                        <td className="align-top pr-1">:</td>
                        <td className="align-top">{pengajuan.tempat || '-'}</td>
                    </tr>
                    <tr>
                        <td className="align-top pr-4">Tanggal Kegiatan</td>
                        <td className="align-top pr-1">:</td>
                        <td className="align-top">{pengajuan.waktu_kegiatan || '-'}</td>
                    </tr>
                    <tr>
                        <td className="align-top pr-4">Jumlah Permintaan Dana</td>
                        <td className="align-top pr-1">:</td>
                        <td className="align-top font-bold">{formatRupiah(total)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Rincian item (dinamis) */}
            <table className="mb-5 w-full border-collapse text-[13px]">
                <thead>
                    <tr className="border-y border-slate-400">
                        <th className="px-2 py-1.5 text-left font-bold w-10">No</th>
                        <th className="px-2 py-1.5 text-left font-bold">Kode Anggaran</th>
                        <th className="px-2 py-1.5 text-left font-bold">Sub Mata Anggaran</th>
                        <th className="px-2 py-1.5 text-right font-bold">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    {details.length === 0 ? (
                        <tr className="border-b border-slate-200">
                            <td colSpan={4} className="px-2 py-3 text-center text-slate-500">Tidak ada item.</td>
                        </tr>
                    ) : (
                        details.map((d, i) => {
                            const kode = d.sub_mata_anggaran?.kode
                                || d.detail_mata_anggaran?.kode
                                || d.mata_anggaran?.kode
                                || '-';
                            const sub = d.sub_mata_anggaran?.nama
                                || d.uraian
                                || d.detail_mata_anggaran?.nama
                                || '-';
                            return (
                                <tr key={d.id} className="border-b border-slate-200">
                                    <td className="px-2 py-1.5 align-top">{i + 1}</td>
                                    <td className="px-2 py-1.5 align-top">{kode}</td>
                                    <td className="px-2 py-1.5 align-top">{sub}</td>
                                    <td className="px-2 py-1.5 align-top text-right">{formatRupiah(Number(d.jumlah ?? 0))}</td>
                                </tr>
                            );
                        })
                    )}
                    <tr className="border-b border-slate-400 font-bold">
                        <td className="px-2 py-1.5 text-right" colSpan={3}>Total</td>
                        <td className="px-2 py-1.5 text-right">{formatRupiah(total)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Penutup */}
            <p className="mb-4">
                Demikian permohonan ini kami sampaikan, atas perhatiannya kami ucapkan terimakasih.
            </p>
            <div className="mb-8 font-bold italic">
                <p>Billahit taufiq wal hidayah</p>
                <p>Wassalamualaikum Wr. Wb.</p>
            </div>

            {/* Tanda tangan pemohon */}
            <div className="flex justify-end">
                <div className="text-center">
                    <p>Hormat kami,</p>
                    <p>{pengajuan.unit?.nama || '-'}</p>
                    <p className="mt-20 font-bold underline">{pengajuan.user?.name || '................................'}</p>
                    <p>Pemohon</p>
                </div>
            </div>
        </div>
    );
}
