import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { getSubMataAnggarans, getDetailMataAnggarans } from '@/services/budgetService';
import type { RapbsUnitData } from '@/services/budgetService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function n(v: unknown): number {
    const num = Number(v);
    return isNaN(num) ? 0 : num;
}

function fmtVolume(v: unknown): string {
    const num = n(v);
    return Number.isInteger(num) ? String(num) : new Intl.NumberFormat('id-ID').format(num);
}

const thin: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFCBD5E1' } };
const allBorder: Partial<ExcelJS.Borders> = { top: thin, bottom: thin, left: thin, right: thin };
const bottomOnly: Partial<ExcelJS.Borders> = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } };

function fill(argb: string): ExcelJS.Fill {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function idrFmt(cell: ExcelJS.Cell, value: number) {
    cell.value = value;
    cell.numFmt = '"Rp "#,##0';
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
}

function sanitizeSheetName(name: string, index: number): string {
    const clean = name.replace(/[:\\/?\*\[\]]/g, '').trim().slice(0, 31);
    return clean || `Unit ${index + 1}`;
}

// ── Core sheet builder ────────────────────────────────────────────────────────

async function buildUnitSheet(ws: ExcelJS.Worksheet, unit: RapbsUnitData, tahun: string): Promise<void> {
    // Column widths
    ws.columns = [
        { key: 'a', width: 6  },
        { key: 'b', width: 36 },
        { key: 'c', width: 36 },
        { key: 'd', width: 50 },
        { key: 'e', width: 22 },
    ];

    const addRow = (...values: (string | number | null)[]) => {
        const r = ws.addRow(values);
        r.height = 16;
        return r;
    };

    // ── Header rows ───────────────────────────────────────────────────────────
    const r1 = addRow(unit.unit_nama, null, null, null, null);
    ws.mergeCells(`A${r1.number}:E${r1.number}`);
    r1.getCell(1).value = unit.unit_nama;
    r1.getCell(1).font  = { bold: true, size: 14, color: { argb: 'FF1E3A5F' }, name: 'Calibri' };
    r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r1.height = 22;

    const r2 = addRow(`RAPBS ${tahun}`, null, null, null, null);
    ws.mergeCells(`A${r2.number}:E${r2.number}`);
    r2.getCell(1).value = `RAPBS ${tahun}`;
    r2.getCell(1).font  = { bold: true, size: 11, color: { argb: 'FF1E3A5F' }, name: 'Calibri' };
    r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    r2.height = 18;

    const r3 = addRow(`Kode Unit: ${unit.unit_kode}`, null, null, null, null);
    ws.mergeCells(`A${r3.number}:E${r3.number}`);
    r3.getCell(1).value = `Kode Unit: ${unit.unit_kode}`;
    r3.getCell(1).font  = { italic: true, size: 9, color: { argb: 'FF64748B' }, name: 'Calibri' };
    r3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    addRow(); // Row 4 – kosong

    // ── Column header ─────────────────────────────────────────────────────────
    const rH = addRow('No.', 'Mata Anggaran', 'Sub Mata Anggaran', 'Detail Anggaran', 'Anggaran');
    rH.height = 18;
    ['A','B','C','D','E'].forEach((col, i) => {
        const cell = rH.getCell(col);
        cell.font   = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
        cell.fill   = fill('FF2563EB');
        cell.border = allBorder;
        cell.alignment = {
            horizontal: i === 0 ? 'center' : i === 4 ? 'right' : 'left',
            vertical: 'middle',
        };
    });

    // ── Data ──────────────────────────────────────────────────────────────────
    let maNo = 0;

    for (const ma of unit.mata_anggarans) {
        maNo++;
        const maTotal = n(ma.total);

        const subsResp = await getSubMataAnggarans(ma.id, { per_page: 500 });
        const subs = subsResp.data || [];

        // ── Mata Anggaran row ─────────────────────────────────────────────────
        const rMA = addRow(`${maNo}.`, `${ma.kode}  ${ma.nama}`, null, null, null);
        ws.mergeCells(`B${rMA.number}:D${rMA.number}`);
        rMA.height = 17;
        rMA.getCell('A').value = `${maNo}.`;
        rMA.getCell('B').value = `${ma.kode}  ${ma.nama}`;
        idrFmt(rMA.getCell('E'), maTotal);
        ['A','B','C','D','E'].forEach((col) => {
            const c = rMA.getCell(col);
            c.font   = { bold: true, size: 9, color: { argb: 'FF1E40AF' }, name: 'Calibri' };
            c.fill   = fill('FFDBEAFE');
            c.border = allBorder;
            c.alignment = { horizontal: col === 'A' ? 'center' : col === 'E' ? 'right' : 'left', vertical: 'middle' };
        });
        rMA.getCell('E').font   = { bold: true, size: 9, color: { argb: 'FF1E40AF' }, name: 'Calibri' };
        rMA.getCell('E').numFmt = '"Rp "#,##0';

        if (subs.length === 0) {
            const detailsResp = await getDetailMataAnggarans({ mata_anggaran_id: ma.id, per_page: 500 });
            const details = detailsResp.data || [];

            for (const d of details) {
                const uraian = `${d.nama}  (${fmtVolume(d.volume)} ${d.satuan} × Rp ${n(d.harga_satuan).toLocaleString('id-ID')})`;
                const rD = addRow(null, null, null, uraian, null);
                rD.getCell('D').font      = { size: 8, color: { argb: 'FF475569' }, name: 'Calibri' };
                rD.getCell('D').alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
                rD.getCell('D').border    = bottomOnly;
                idrFmt(rD.getCell('E'), n(d.jumlah));
                rD.getCell('E').font   = { size: 8, color: { argb: 'FF475569' }, name: 'Calibri' };
                rD.getCell('E').border = bottomOnly;
            }
        } else {
            for (const sub of subs) {
                const detailsResp = await getDetailMataAnggarans({
                    mata_anggaran_id: ma.id,
                    sub_mata_anggaran_id: sub.id,
                    per_page: 500,
                });
                const details = detailsResp.data || [];

                // ── Sub Mata Anggaran row ─────────────────────────────────────
                const rS = addRow(null, null, `${sub.kode}  ${sub.nama}`, null, null);
                ws.mergeCells(`C${rS.number}:E${rS.number}`);
                rS.getCell('C').value = `${sub.kode}  ${sub.nama}`;
                rS.getCell('C').font  = { bold: true, size: 9, color: { argb: 'FF334155' }, name: 'Calibri' };
                rS.getCell('C').fill  = fill('FFF1F5F9');
                rS.getCell('C').alignment = { horizontal: 'left', vertical: 'middle' };
                rS.getCell('C').border = bottomOnly;
                ['A','B'].forEach(col => {
                    rS.getCell(col).fill   = fill('FFF1F5F9');
                    rS.getCell(col).border = bottomOnly;
                });

                // ── Detail rows ───────────────────────────────────────────────
                for (const d of details) {
                    const uraian = `${d.nama}  (${fmtVolume(d.volume)} ${d.satuan} × Rp ${n(d.harga_satuan).toLocaleString('id-ID')})`;
                    const rD = addRow(null, null, null, uraian, null);
                    rD.getCell('D').font      = { size: 8, color: { argb: 'FF475569' }, name: 'Calibri' };
                    rD.getCell('D').alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
                    rD.getCell('D').border    = bottomOnly;
                    idrFmt(rD.getCell('E'), n(d.jumlah));
                    rD.getCell('E').font   = { size: 8, color: { argb: 'FF475569' }, name: 'Calibri' };
                    rD.getCell('E').border = bottomOnly;
                }
            }
        }

        // Spacer
        const rSp = addRow(null, null, null, null, null);
        rSp.height = 6;
    }

    // ── Grand total ───────────────────────────────────────────────────────────
    const grandTotal = unit.mata_anggarans.reduce((s, ma) => s + n(ma.total), 0);
    const rT = addRow(null, 'TOTAL ANGGARAN', null, null, null);
    ws.mergeCells(`B${rT.number}:D${rT.number}`);
    rT.height = 20;
    rT.getCell('B').value = 'TOTAL ANGGARAN';
    idrFmt(rT.getCell('E'), grandTotal);
    ['A','B','C','D','E'].forEach((col) => {
        const c = rT.getCell(col);
        c.font   = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
        c.fill   = fill('FF1E3A5F');
        c.border = allBorder;
        c.alignment = { horizontal: col === 'B' ? 'left' : col === 'E' ? 'right' : 'center', vertical: 'middle' };
    });
    rT.getCell('E').numFmt = '"Rp "#,##0';
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function exportUnitRapbsExcel(
    unit: RapbsUnitData,
    tahun: string,
): Promise<void> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(
        sanitizeSheetName(unit.unit_nama, 0),
        { properties: { defaultRowHeight: 15 } },
    );

    await buildUnitSheet(ws, unit, tahun);

    const buffer   = await wb.xlsx.writeBuffer();
    const blob     = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `RAPBS_${tahun.replace('/', '-')}_${unit.unit_kode}.xlsx`;
    saveAs(blob, filename);
}

export async function exportAllUnitsRapbsExcel(
    units: RapbsUnitData[],
    tahun: string,
    onProgress?: (current: number, total: number) => void,
): Promise<void> {
    const wb = new ExcelJS.Workbook();

    // Track used sheet names to guarantee uniqueness
    const usedNames = new Set<string>();

    for (let i = 0; i < units.length; i++) {
        const unit = units[i];

        let sheetName = sanitizeSheetName(unit.unit_nama, i);
        if (usedNames.has(sheetName)) {
            sheetName = sheetName.slice(0, 28) + ` ${i + 1}`;
        }
        usedNames.add(sheetName);

        const ws = wb.addWorksheet(sheetName, { properties: { defaultRowHeight: 15 } });
        await buildUnitSheet(ws, unit, tahun);

        onProgress?.(i + 1, units.length);
    }

    const buffer   = await wb.xlsx.writeBuffer();
    const blob     = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `RAPBS_${tahun.replace('/', '-')}_Semua_Unit.xlsx`;
    saveAs(blob, filename);
}
