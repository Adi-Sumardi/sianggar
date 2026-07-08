import api from '@/lib/api';
import type {
    Account,
    Journal,
    JournalEntry,
    GeneralLedgerReport,
} from '@/types/models';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

// =============================================================================
// Chart of Accounts
// =============================================================================

export interface AccountFilterParams {
    unit_id?: number;
    tipe?: string;
}

export async function getAccounts(params?: AccountFilterParams): Promise<{ data: Account[] }> {
    const { data } = await api.get<{ data: Account[] }>('/ledger/accounts', { params });
    return data;
}

export interface CreateAccountDTO {
    kode: string;
    nama: string;
    tipe: string;
    saldo_normal: string;
    parent_id?: number | null;
    unit_id?: number | null;
    is_postable?: boolean;
    keterangan?: string | null;
}

export type UpdateAccountDTO = Partial<CreateAccountDTO>;

export async function createAccount(dto: CreateAccountDTO): Promise<Account> {
    const { data } = await api.post<ApiResponse<Account>>('/ledger/accounts', dto);
    return data.data;
}

export async function updateAccount(id: number, dto: UpdateAccountDTO): Promise<Account> {
    const { data } = await api.put<ApiResponse<Account>>(`/ledger/accounts/${id}`, dto);
    return data.data;
}

export async function deleteAccount(id: number): Promise<void> {
    await api.delete(`/ledger/accounts/${id}`);
}

// =============================================================================
// Journals
// =============================================================================

export async function getJournals(): Promise<{ data: Journal[] }> {
    const { data } = await api.get<{ data: Journal[] }>('/ledger/journals');
    return data;
}

// =============================================================================
// Journal Entries
// =============================================================================

export interface JournalEntryFilterParams {
    unit_id?: number;
    status?: string;
    journal_id?: number;
    tahun?: string;
    per_page?: number;
    page?: number;
}

export async function getJournalEntries(
    params?: JournalEntryFilterParams,
): Promise<PaginatedResponse<JournalEntry>> {
    const { data } = await api.get<PaginatedResponse<JournalEntry>>('/ledger/journal-entries', { params });
    return data;
}

export async function getJournalEntry(id: number | string): Promise<JournalEntry> {
    const { data } = await api.get<ApiResponse<JournalEntry>>(`/ledger/journal-entries/${id}`);
    return data.data;
}

export async function reverseJournalEntry(id: number | string, notes?: string): Promise<JournalEntry> {
    const { data } = await api.post<ApiResponse<JournalEntry>>(`/ledger/journal-entries/${id}/reverse`, { notes });
    return data.data;
}

// =============================================================================
// General Ledger (Buku Besar) Report
// =============================================================================

export interface GeneralLedgerParams {
    account_id: number;
    unit_id?: number;
    tahun: string;
}

export async function getGeneralLedger(params: GeneralLedgerParams): Promise<GeneralLedgerReport> {
    const { data } = await api.get<GeneralLedgerReport>('/ledger/general-ledger', { params });
    return data;
}
