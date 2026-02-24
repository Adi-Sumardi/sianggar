/**
 * Convert a number into its Indonesian word representation.
 *
 * Handles values from 0 up to 999.999.999.999.999 (hundreds of trillions).
 * The output uses title-case and appends "Rupiah" at the end.
 *
 * Example:
 *   terbilang(1_500_000) => "Satu Juta Lima Ratus Ribu Rupiah"
 */

const SATUAN = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
];

function terbilangRaw(n: number): string {
    if (n < 0) {
        return 'Minus ' + terbilangRaw(Math.abs(n));
    }

    if (n === 0) {
        return 'Nol';
    }

    if (n < 12) {
        return SATUAN[n];
    }

    if (n < 20) {
        return SATUAN[n - 10] + ' Belas';
    }

    if (n < 100) {
        const tens = Math.floor(n / 10);
        const remainder = n % 10;
        return SATUAN[tens] + ' Puluh' + (remainder > 0 ? ' ' + SATUAN[remainder] : '');
    }

    if (n < 200) {
        const remainder = n % 100;
        return 'Seratus' + (remainder > 0 ? ' ' + terbilangRaw(remainder) : '');
    }

    if (n < 1_000) {
        const hundreds = Math.floor(n / 100);
        const remainder = n % 100;
        return SATUAN[hundreds] + ' Ratus' + (remainder > 0 ? ' ' + terbilangRaw(remainder) : '');
    }

    if (n < 2_000) {
        const remainder = n % 1_000;
        return 'Seribu' + (remainder > 0 ? ' ' + terbilangRaw(remainder) : '');
    }

    if (n < 1_000_000) {
        const thousands = Math.floor(n / 1_000);
        const remainder = n % 1_000;
        return terbilangRaw(thousands) + ' Ribu' + (remainder > 0 ? ' ' + terbilangRaw(remainder) : '');
    }

    if (n < 1_000_000_000) {
        const millions = Math.floor(n / 1_000_000);
        const remainder = n % 1_000_000;
        return terbilangRaw(millions) + ' Juta' + (remainder > 0 ? ' ' + terbilangRaw(remainder) : '');
    }

    if (n < 1_000_000_000_000) {
        const billions = Math.floor(n / 1_000_000_000);
        const remainder = n % 1_000_000_000;
        return terbilangRaw(billions) + ' Miliar' + (remainder > 0 ? ' ' + terbilangRaw(remainder) : '');
    }

    if (n < 1_000_000_000_000_000) {
        const trillions = Math.floor(n / 1_000_000_000_000);
        const remainder = n % 1_000_000_000_000;
        return terbilangRaw(trillions) + ' Triliun' + (remainder > 0 ? ' ' + terbilangRaw(remainder) : '');
    }

    return n.toString();
}

/**
 * Convert a number to Indonesian words with "Rupiah" suffix.
 *
 * @param value - The numeric amount (integer, decimals are truncated)
 * @returns Indonesian word representation ending with "Rupiah"
 */
export function terbilang(value: number): string {
    const integer = Math.floor(Math.abs(value));

    if (integer === 0) {
        return 'Nol Rupiah';
    }

    const prefix = value < 0 ? 'Minus ' : '';
    return prefix + terbilangRaw(integer) + ' Rupiah';
}

/**
 * Convert a number to Indonesian words without the "Rupiah" suffix.
 */
export function terbilangTanpaRupiah(value: number): string {
    const integer = Math.floor(Math.abs(value));
    const prefix = value < 0 ? 'Minus ' : '';
    return prefix + terbilangRaw(integer);
}
