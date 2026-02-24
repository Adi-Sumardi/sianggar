import { useQuery, useMutation } from '@tanstack/react-query';
import * as laporanService from '@/services/laporanService';
import type {
    LaporanPengajuanParams,
    CawuUnitParams,
    CawuGabunganParams,
    AccountingParams,
} from '@/services/laporanService';
import { toast } from 'sonner';
import { getCurrentAcademicYear } from '@/stores/authStore';

// =============================================================================
// Query Keys
// =============================================================================

export const laporanKeys = {
    all: ['laporan'] as const,
    pengajuan: (params?: LaporanPengajuanParams) => [...laporanKeys.all, 'pengajuan', params] as const,
    cawuUnit: (params: CawuUnitParams) => [...laporanKeys.all, 'cawu-unit', params] as const,
    cawuGabungan: (params?: CawuGabunganParams) => [...laporanKeys.all, 'cawu-gabungan', params] as const,
    accounting: (params?: AccountingParams) => [...laporanKeys.all, 'accounting', params] as const,
};

// =============================================================================
// Queries
// =============================================================================

export function useLaporanPengajuan(params?: LaporanPengajuanParams) {
    return useQuery({
        queryKey: laporanKeys.pengajuan(params),
        queryFn: () => laporanService.getLaporanPengajuan(params),
    });
}

export function useCawuUnit(params: CawuUnitParams, enabled = true) {
    return useQuery({
        queryKey: laporanKeys.cawuUnit(params),
        queryFn: () => laporanService.getCawuUnit(params),
        enabled: enabled && !!params.tahun,
    });
}

export function useCawuGabungan(params?: CawuGabunganParams) {
    return useQuery({
        queryKey: laporanKeys.cawuGabungan(params),
        queryFn: () => laporanService.getCawuGabungan(params),
    });
}

export function useAccounting(params?: AccountingParams) {
    return useQuery({
        queryKey: laporanKeys.accounting(params),
        queryFn: () => laporanService.getAccounting(params),
    });
}

// =============================================================================
// Export Mutations
// =============================================================================

export function useExportLaporanExcel() {
    return useMutation({
        mutationFn: (params: { type: 'pengajuan' | 'realisasi' | 'penerimaan'; tahun?: string; unit_id?: number }) =>
            laporanService.exportLaporanExcel(params),
        onSuccess: (blob, variables) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `laporan-${variables.type}-${(variables.tahun || getCurrentAcademicYear()).replace('/', '-')}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('File Excel berhasil diunduh');
        },
        onError: () => {
            toast.error('Gagal mengunduh file Excel');
        },
    });
}

export function useExportLaporanPdf() {
    return useMutation({
        mutationFn: (params: { type: 'pengajuan' | 'realisasi' | 'penerimaan'; tahun?: string; unit_id?: number }) =>
            laporanService.exportLaporanPdf(params),
        onSuccess: (blob, variables) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `laporan-${variables.type}-${(variables.tahun || getCurrentAcademicYear()).replace('/', '-')}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('File PDF berhasil diunduh');
        },
        onError: () => {
            toast.error('Gagal mengunduh file PDF');
        },
    });
}
