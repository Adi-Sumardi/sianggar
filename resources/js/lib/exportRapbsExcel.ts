import * as XLSX from 'xlsx';
import { getSubMataAnggarans, getDetailMataAnggarans } from '@/services/budgetService';
import type { RapbsUnitData } from '@/services/budgetService';

// ── Colour palette ────────────────────────────────────────────────────────────
const C = {
    headerBg:    '1E3A5F', // navy  – judul utama
    headerFg:    'FFFFFF',
    colHeadBg:   '2563EB', // biru  – header kolom
    colHeadFg:   'FFFFFF',
    maBg:        'DBEAFE', // biru muda – Mata Anggaran
    maFg:        '1E40AF',
    subBg:       'F1F5F9', // abu terang – Sub MA
    subFg:       '334155',
    detailFg:    '475569',
    totalBg:     '1E3A5F', // navy  – grand total
    totalFg:     'FFFFFF',
    borderColor: 'CBD5E1',
    white:       'FFFFFF',
    black:       '000000',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
type Row = (string | number | null)[];

function addr(row: number, col: number) {
    return XLSX.utils.encode_cell({ r: row, c: col });
}

function n(v: unknown): number {
    const num = Number(v);
    return isNaN(num) ? 0 : num;
}

// Indonesian Rupiah Excel format
const IDR_FMT = '"Rp "#,##0';

// Build a cell style object
function makeStyle(opts: {
    bold?: boolean;
    size?: number;
    fg?: string;
    bg?: string;
    align?: 'left' | 'center' | 'right';
    wrap?: boolean;
    border?: boolean;
    indent?: number;
    italic?: boolean;
}): object {
    return {
        font: {
            bold:   opts.bold   ?? false,
            italic: opts.italic ?? false,
            sz:     opts.size   ?? 10,
            color:  { rgb: opts.fg ?? C.black },
        },
        fill: opts.bg
            ? { patternType: 'solid', fgColor: { rgb: opts.bg } }
            : { patternType: 'none' },
        alignment: {
            horizontal: opts.align   ?? 'left',
            vertical:   'center',
            wrapText:   opts.wrap    ?? false,
            indent:     opts.indent  ?? 0,
        },
        border: opts.border ? {
            top:    { style: 'thin', color: { rgb: C.borderColor } },
            bottom: { style: 'thin', color: { rgb: C.borderColor } },
            left:   { style: 'thin', color: { rgb: C.borderColor } },
            right:  { style: 'thin', color: { rgb: C.borderColor } },
        } : {
            bottom: { style: 'hair', color: { rgb: 'E2E8F0' } },
        },
    };
}

function setCell(
    ws: XLSX.WorkSheet,
    row: number,
    col: number,
    value: string | number | null,
    style: object,
    numFmt?: string,
) {
    const key = addr(row, col);
    const t   = typeof value === 'number' ? 'n' : 's';
    ws[key]   = { t, v: value ?? '', s: style };
    if (numFmt && typeof value === 'number') {
        ws[key].z = numFmt;
    }
}

// ── Main export function ──────────────────────────────────────────────────────
export async function exportUnitRapbsExcel(
    unit: RapbsUnitData,
    tahun: string,
): Promise<void> {
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};
    const merges: XLSX.Range[] = [];

    let r = 0;

    // helper: push a merge
    const merge = (r1: number, c1: number, r2: number, c2: number) =>
        merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

    // ── Row 0: Unit name ────────────────────────────────────────────────────
    setCell(ws, r, 0, unit.unit_nama, makeStyle({ bold: true, size: 14, fg: C.headerBg, align: 'center' }));
    merge(r, 0, r, 4);
    r++;

    // ── Row 1: RAPBS title ──────────────────────────────────────────────────
    setCell(ws, r, 0, `RAPBS ${tahun}`, makeStyle({ bold: true, size: 11, fg: C.headerBg, align: 'center' }));
    merge(r, 0, r, 4);
    r++;

    // ── Row 2: Subtitle kode ────────────────────────────────────────────────
    setCell(ws, r, 0, `Kode Unit: ${unit.unit_kode}`, makeStyle({ size: 9, fg: '64748B', align: 'center', italic: true }));
    merge(r, 0, r, 4);
    r++;

    // ── Row 3: Empty ────────────────────────────────────────────────────────
    r++;

    // ── Row 4: Column headers ────────────────────────────────────────────────
    const headers = ['No.', 'Mata Anggaran', 'Sub Mata Anggaran', 'Detail Anggaran', 'Anggaran'];
    const hAligns: Array<'left'|'center'|'right'> = ['center','left','left','left','right'];
    headers.forEach((h, c) => {
        setCell(ws, r, c, h, makeStyle({
            bold: true, size: 9,
            fg: C.colHeadFg, bg: C.colHeadBg,
            align: hAligns[c], border: true,
        }));
    });
    r++;

    // ── Data rows ────────────────────────────────────────────────────────────
    let maNo = 0;

    for (const ma of unit.mata_anggarans) {
        maNo++;
        const maTotal = n(ma.total);

        const subsResp = await getSubMataAnggarans(ma.id, { per_page: 500 });
        const subs = subsResp.data || [];

        // ── Mata Anggaran row ────────────────────────────────────────────────
        const maStyle    = makeStyle({ bold: true, size: 9, bg: C.maBg, fg: C.maFg, border: true });
        const maStyleR   = makeStyle({ bold: true, size: 9, bg: C.maBg, fg: C.maFg, align: 'right', border: true });
        const maStyleC   = makeStyle({ bold: true, size: 9, bg: C.maBg, fg: C.maFg, align: 'center', border: true });
        setCell(ws, r, 0, `${maNo}.`, maStyleC);
        setCell(ws, r, 1, `${ma.kode}  ${ma.nama}`, maStyle);
        setCell(ws, r, 2, null, maStyle);
        setCell(ws, r, 3, null, maStyle);
        setCell(ws, r, 4, maTotal, maStyleR, IDR_FMT);
        merge(r, 1, r, 3);
        r++;

        if (subs.length === 0) {
            // Details directly under MA
            const detailsResp = await getDetailMataAnggarans({ mata_anggaran_id: ma.id, per_page: 500 });
            const details = detailsResp.data || [];
            for (const d of details) {
                const uraian = `${d.nama}  (${n(d.volume)} ${d.satuan} × Rp ${n(d.harga_satuan).toLocaleString('id-ID')})`;
                const ds     = makeStyle({ size: 8, fg: C.detailFg });
                const dsR    = makeStyle({ size: 8, fg: C.detailFg, align: 'right' });
                setCell(ws, r, 0, null, ds);
                setCell(ws, r, 1, null, ds);
                setCell(ws, r, 2, null, ds);
                setCell(ws, r, 3, uraian, makeStyle({ size: 8, fg: C.detailFg, wrap: true, indent: 1 }));
                setCell(ws, r, 4, n(d.jumlah), dsR, IDR_FMT);
                r++;
            }
        } else {
            let subNo = 0;
            for (const sub of subs) {
                subNo++;

                const detailsResp = await getDetailMataAnggarans({
                    mata_anggaran_id: ma.id,
                    sub_mata_anggaran_id: sub.id,
                    per_page: 500,
                });
                const details  = detailsResp.data || [];
                const subTotal = details.reduce((s, d) => s + n(d.jumlah), 0);

                // ── Sub Mata Anggaran row ────────────────────────────────────
                const ss  = makeStyle({ bold: true, size: 9, bg: C.subBg, fg: C.subFg });
                const ssR = makeStyle({ bold: true, size: 9, bg: C.subBg, fg: C.subFg, align: 'right' });
                setCell(ws, r, 0, null, ss);
                setCell(ws, r, 1, null, ss);
                setCell(ws, r, 2, `${maNo}.${subNo}  ${sub.kode}  ${sub.nama}`, ss);
                setCell(ws, r, 3, null, ss);
                setCell(ws, r, 4, subTotal, ssR, IDR_FMT);
                merge(r, 2, r, 3);
                r++;

                // ── Detail rows ──────────────────────────────────────────────
                for (const d of details) {
                    const uraian = `${d.nama}  (${n(d.volume)} ${d.satuan} × Rp ${n(d.harga_satuan).toLocaleString('id-ID')})`;
                    const ds     = makeStyle({ size: 8, fg: C.detailFg });
                    const dsR    = makeStyle({ size: 8, fg: C.detailFg, align: 'right' });
                    setCell(ws, r, 0, null, ds);
                    setCell(ws, r, 1, null, ds);
                    setCell(ws, r, 2, null, ds);
                    setCell(ws, r, 3, uraian, makeStyle({ size: 8, fg: C.detailFg, wrap: true, indent: 1 }));
                    setCell(ws, r, 4, n(d.jumlah), dsR, IDR_FMT);
                    r++;
                }
            }
        }

        // Spacer row between MA
        for (let c = 0; c < 5; c++) {
            setCell(ws, r, c, null, makeStyle({ size: 6 }));
        }
        r++;
    }

    // ── Grand total ──────────────────────────────────────────────────────────
    const grandTotal = unit.mata_anggarans.reduce((s, ma) => s + n(ma.total), 0);
    const ts  = makeStyle({ bold: true, size: 10, bg: C.totalBg, fg: C.totalFg, border: true });
    const tsR = makeStyle({ bold: true, size: 10, bg: C.totalBg, fg: C.totalFg, border: true, align: 'right' });
    setCell(ws, r, 0, null, ts);
    setCell(ws, r, 1, 'TOTAL ANGGARAN', ts);
    setCell(ws, r, 2, null, ts);
    setCell(ws, r, 3, null, ts);
    setCell(ws, r, 4, grandTotal, tsR, IDR_FMT);
    merge(r, 1, r, 3);
    r++;

    // ── Sheet metadata ───────────────────────────────────────────────────────
    ws['!ref']    = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r, c: 4 } });
    ws['!merges'] = merges;
    ws['!cols']   = [
        { wch: 6  },  // A – No
        { wch: 34 },  // B – Mata Anggaran
        { wch: 36 },  // C – Sub MA
        { wch: 48 },  // D – Detail
        { wch: 20 },  // E – Anggaran
    ];
    ws['!rows'] = Array.from({ length: r }, (_, i) => ({
        hpt: i < 4 ? 18 : 15,
    }));

    const sheetName = unit.unit_kode.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 31) || 'Unit';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filename = `RAPBS_${tahun.replace('/', '-')}_${unit.unit_kode}.xlsx`;
    XLSX.writeFile(wb, filename);
}
