import * as XLSX from 'xlsx';
import { getSubMataAnggarans, getDetailMataAnggarans } from '@/services/budgetService';
import type { RapbsUnitData } from '@/services/budgetService';

const UNIT_NAME = 'RA Sakinah';
const COL_WIDTHS = [6, 32, 36, 44, 18]; // A–E

type Row = (string | number | null)[];

interface CellStyle {
  row: number;
  col: number;
  bold?: boolean;
  bg?: string;
  color?: string;
  align?: 'center' | 'left' | 'right';
  border?: boolean;
  size?: number;
  indent?: number;
}

// Build cell address e.g. row=0,col=0 → "A1"
function addr(row: number, col: number): string {
  return XLSX.utils.encode_cell({ r: row, c: col });
}

function currency(v: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export async function exportUnitRapbsExcel(
  unit: RapbsUnitData,
  tahun: string,
): Promise<void> {
  const wb = XLSX.utils.book_new();

  const rows: Row[] = [];
  const styles: CellStyle[] = [];
  const merges: XLSX.Range[] = [];

  let r = 0;

  // ── Row 1: Unit name ──────────────────────────────────────────
  rows.push([UNIT_NAME, null, null, null, null]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 4 } });
  styles.push({ row: r, col: 0, bold: true, align: 'center', size: 13 });
  r++;

  // ── Row 2: Title ──────────────────────────────────────────────
  rows.push([`RAPBS ${tahun.replace('/', '/')}`, null, null, null, null]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 4 } });
  styles.push({ row: r, col: 0, bold: true, align: 'center', size: 11 });
  r++;

  // ── Row 3: Unit info ─────────────────────────────────────────
  rows.push([`Unit: ${unit.unit_nama} (${unit.unit_kode})`, null, null, null, null]);
  merges.push({ s: { r, c: 0 }, e: { r, c: 4 } });
  styles.push({ row: r, col: 0, align: 'center', size: 10 });
  r++;

  // ── Row 4: Empty ─────────────────────────────────────────────
  rows.push([null, null, null, null, null]);
  r++;

  // ── Row 5: Header ─────────────────────────────────────────────
  rows.push(['No.', 'Mata Anggaran', 'Sub Mata Anggaran', 'Detail Anggaran', 'Anggaran']);
  for (let c = 0; c < 5; c++) {
    styles.push({
      row: r, col: c,
      bold: true, bg: '2563EB', color: 'FFFFFF',
      align: c === 4 ? 'right' : c === 0 ? 'center' : 'left',
      border: true, size: 9,
    });
  }
  r++;

  // ── Data rows ─────────────────────────────────────────────────
  let maNo = 0;

  for (const ma of unit.mata_anggarans) {
    maNo++;
    const maTotal = ma.total ?? 0;

    // Fetch sub mata anggaran
    const subsResp = await getSubMataAnggarans(ma.id, { per_page: 200 });
    const subs = subsResp.data || [];

    // Mata Anggaran row
    rows.push([`${maNo}.`, `${ma.kode} - ${ma.nama}`, null, null, maTotal]);
    merges.push({ s: { r, c: 1 }, e: { r, c: 3 } });
    for (let c = 0; c < 5; c++) {
      styles.push({
        row: r, col: c,
        bold: true, bg: 'DBEAFE',
        align: c === 4 ? 'right' : c === 0 ? 'center' : 'left',
        border: true, size: 9,
      });
    }
    r++;

    if (subs.length === 0) {
      // No subs — fetch details directly under MA
      const detailsResp = await getDetailMataAnggarans({
        mata_anggaran_id: ma.id,
        per_page: 500,
      });
      const details = detailsResp.data || [];
      for (const d of details) {
        const uraian = `${d.volume} ${d.satuan} × ${currency(d.harga_satuan)}`;
        rows.push([null, null, null, `${d.kode ? d.kode + ' - ' : ''}${d.nama} (${uraian})`, d.jumlah]);
        for (let c = 0; c < 5; c++) {
          styles.push({
            row: r, col: c,
            align: c === 4 ? 'right' : 'left',
            size: 8, indent: c === 3 ? 2 : 0,
          });
        }
        r++;
      }
    } else {
      let subNo = 0;
      for (const sub of subs) {
        subNo++;

        // Fetch detail under this sub
        const detailsResp = await getDetailMataAnggarans({
          mata_anggaran_id: ma.id,
          sub_mata_anggaran_id: sub.id,
          per_page: 500,
        });
        const details = detailsResp.data || [];

        const subTotal = details.reduce((s, d) => s + (d.jumlah ?? 0), 0);

        // Sub Mata Anggaran row
        rows.push([null, null, `${maNo}.${subNo}  ${sub.kode} - ${sub.nama}`, null, subTotal]);
        merges.push({ s: { r, c: 2 }, e: { r, c: 3 } });
        for (let c = 0; c < 5; c++) {
          styles.push({
            row: r, col: c,
            bold: true, bg: 'F1F5F9',
            align: c === 4 ? 'right' : 'left',
            border: false, size: 9,
          });
        }
        r++;

        // Detail rows
        for (const d of details) {
          const uraian = `${d.volume} ${d.satuan} × ${currency(d.harga_satuan)}`;
          rows.push([null, null, null, `${d.kode ? d.kode + ' - ' : ''}${d.nama} (${uraian})`, d.jumlah]);
          for (let c = 0; c < 5; c++) {
            styles.push({
              row: r, col: c,
              align: c === 4 ? 'right' : 'left',
              size: 8, indent: c === 3 ? 2 : 0,
            });
          }
          r++;
        }
      }
    }

    // Spacer between MA
    rows.push([null, null, null, null, null]);
    r++;
  }

  // ── Grand Total ───────────────────────────────────────────────
  const grandTotal = unit.mata_anggarans.reduce((s, ma) => s + (ma.total ?? 0), 0);
  rows.push(['', 'TOTAL ANGGARAN', null, null, grandTotal]);
  merges.push({ s: { r, c: 1 }, e: { r, c: 3 } });
  for (let c = 0; c < 5; c++) {
    styles.push({
      row: r, col: c,
      bold: true, bg: '1E3A5F', color: 'FFFFFF',
      align: c === 4 ? 'right' : c === 0 ? 'center' : 'left',
      border: true, size: 10,
    });
  }
  r++;

  // ── Build worksheet ──────────────────────────────────────────
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  ws['!cols'] = COL_WIDTHS.map((w) => ({ wch: w }));

  // Apply styles
  for (const s of styles) {
    const cellAddr = addr(s.row, s.col);
    if (!ws[cellAddr]) ws[cellAddr] = { t: 'z', v: '' };
    const cell = ws[cellAddr];

    // Format currency for Anggaran column
    if (s.col === 4 && typeof cell.v === 'number') {
      cell.t = 'n';
      cell.z = '#,##0';
    }

    cell.s = {
      font: {
        bold: s.bold ?? false,
        sz: s.size ?? 10,
        color: { rgb: s.color ?? '000000' },
      },
      fill: s.bg
        ? { patternType: 'solid', fgColor: { rgb: s.bg } }
        : undefined,
      alignment: {
        horizontal: s.align ?? 'left',
        vertical: 'center',
        wrapText: true,
        indent: s.indent ?? 0,
      },
      border: s.border
        ? {
            top: { style: 'thin', color: { rgb: 'CBD5E1' } },
            bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } },
          }
        : undefined,
    };
  }

  const safeName = unit.unit_kode.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeName || 'Unit');

  const filename = `RAPBS_${tahun.replace('/', '-')}_${unit.unit_kode}.xlsx`;
  XLSX.writeFile(wb, filename);
}
