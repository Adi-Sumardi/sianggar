import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ledgerService from '@/services/ledgerService';
import type {
    AccountFilterParams,
    CreateAccountDTO,
    UpdateAccountDTO,
    JournalEntryFilterParams,
    GeneralLedgerParams,
} from '@/services/ledgerService';

// =============================================================================
// Chart of Accounts hooks
// =============================================================================

export function useAccounts(params?: AccountFilterParams) {
    return useQuery({
        queryKey: ['ledger-accounts', params],
        queryFn: () => ledgerService.getAccounts(params),
    });
}

export function useCreateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateAccountDTO) => ledgerService.createAccount(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateAccountDTO }) =>
            ledgerService.updateAccount(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] });
        },
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => ledgerService.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ledger-accounts'] });
        },
    });
}

// =============================================================================
// Journals hooks
// =============================================================================

export function useJournals() {
    return useQuery({
        queryKey: ['journals'],
        queryFn: () => ledgerService.getJournals(),
    });
}

// =============================================================================
// Journal Entries hooks
// =============================================================================

export function useJournalEntries(params?: JournalEntryFilterParams) {
    return useQuery({
        queryKey: ['journal-entries', params],
        queryFn: () => ledgerService.getJournalEntries(params),
    });
}

export function useJournalEntry(id: number | string | null) {
    return useQuery({
        queryKey: ['journal-entries', id],
        queryFn: () => ledgerService.getJournalEntry(id!),
        enabled: id !== null,
    });
}

export function useReverseJournalEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, notes }: { id: number | string; notes?: string }) =>
            ledgerService.reverseJournalEntry(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
        },
    });
}

// =============================================================================
// General Ledger (Buku Besar) report hook
// =============================================================================

export function useGeneralLedger(params: GeneralLedgerParams | null) {
    return useQuery({
        queryKey: ['general-ledger', params],
        queryFn: () => ledgerService.getGeneralLedger(params!),
        enabled: params !== null,
    });
}
