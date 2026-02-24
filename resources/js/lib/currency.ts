export function formatRupiah(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

export function parseRupiah(formatted: string): number {
    return parseInt(formatted.replace(/[^0-9-]/g, ''), 10) || 0;
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
}
