/**
 * Convert number to Indonesian words (terbilang).
 * Example: 330000 -> "Tiga Ratus Tiga Puluh Ribu Rupiah"
 */

const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function terbilangHelper(n: number): string {
    if (n < 12) {
        return satuan[n];
    } else if (n < 20) {
        return satuan[n - 10] + ' Belas';
    } else if (n < 100) {
        return satuan[Math.floor(n / 10)] + ' Puluh ' + satuan[n % 10];
    } else if (n < 200) {
        return 'Seratus ' + terbilangHelper(n - 100);
    } else if (n < 1000) {
        return satuan[Math.floor(n / 100)] + ' Ratus ' + terbilangHelper(n % 100);
    } else if (n < 2000) {
        return 'Seribu ' + terbilangHelper(n - 1000);
    } else if (n < 1000000) {
        return terbilangHelper(Math.floor(n / 1000)) + ' Ribu ' + terbilangHelper(n % 1000);
    } else if (n < 1000000000) {
        return terbilangHelper(Math.floor(n / 1000000)) + ' Juta ' + terbilangHelper(n % 1000000);
    } else if (n < 1000000000000) {
        return terbilangHelper(Math.floor(n / 1000000000)) + ' Miliar ' + terbilangHelper(n % 1000000000);
    } else if (n < 1000000000000000) {
        return terbilangHelper(Math.floor(n / 1000000000000)) + ' Triliun ' + terbilangHelper(n % 1000000000000);
    }
    return '';
}

/**
 * Convert number to Indonesian words with "Rupiah" suffix.
 */
export function numberToWords(amount: number): string {
    if (amount === 0) return 'Nol Rupiah';

    const result = terbilangHelper(Math.floor(amount))
        .replace(/\s+/g, ' ')
        .trim();

    return result + ' Rupiah';
}

/**
 * Format date to Indonesian format (DD Month YYYY).
 */
export function formatDateIndonesian(date: Date | string): string {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
}
