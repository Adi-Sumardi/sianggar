import api from '@/lib/api';

/**
 * Unduh backup database (.sql) dari server. Hanya dapat diakses Administrator.
 * Mengembalikan blob beserta nama file yang disarankan server.
 */
export async function downloadDatabaseBackup(): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get('/admin/backup/database', {
        responseType: 'blob',
    });

    const disposition = (response.headers['content-disposition'] as string | undefined) ?? '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? `backup-sianggar-${Date.now()}.sql`;

    return { blob: response.data as Blob, filename };
}

/**
 * Pulihkan database dari file backup .sql. OPERASI DESTRUKTIF — menimpa seluruh
 * data. Hanya dapat diakses Administrator.
 */
export async function restoreDatabaseBackup(file: File): Promise<{ message: string }> {
    const form = new FormData();
    form.append('file', file);

    const { data } = await api.post<{ message: string }>('/admin/backup/restore', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
}
