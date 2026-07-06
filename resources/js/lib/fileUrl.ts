/**
 * Bangun URL file lampiran dari `path` yang dikirim API.
 *
 * AttachmentResource kini mengembalikan URL publik lengkap ("/storage/...")
 * — jangan tambah prefix lagi. Tetap dukung nilai legacy (relatif) dan URL absolut.
 */
export function getFileUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
        return path;
    }
    return `/storage/${path}`;
}
