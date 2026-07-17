import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ledgerService from '@/services/ledgerService';
import type {
    AccountFilterParams,
    CreateAccountDTO,
    UpdateAccountDTO,
    JournalEntryFilterParams,
    GeneralLedgerParams,
    UnitLedgerParams,
    TrialBalanceParams,
    CreateManualEntryDTO,
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

export function useCancelReversal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number | string) => ledgerService.cancelReversal(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
            queryClient.invalidateQueries({ queryKey: ['unit-ledger'] });
            queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
            queryClient.invalidateQueries({ queryKey: ['income-statement'] });
            queryClient.invalidateQueries({ queryKey: ['balance-sheet'] });
        },
    });
}

export function useCreateManualEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: CreateManualEntryDTO) => ledgerService.createManualEntry(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            queryClient.invalidateQueries({ queryKey: ['general-ledger'] });
            queryClient.invalidateQueries({ queryKey: ['unit-ledger'] });
            queryClient.invalidateQueries({ queryKey: ['trial-balance'] });
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

// =============================================================================
// Rekening Unit hook
// =============================================================================

export function useUnitLedger(params: UnitLedgerParams | null) {
    return useQuery({
        queryKey: ['unit-ledger', params],
        queryFn: () => ledgerService.getUnitLedger(params!),
        enabled: params !== null,
    });
}

// =============================================================================
// Neraca Saldo / Laba Rugi / Neraca hooks
// =============================================================================

export function useTrialBalance(params: TrialBalanceParams | null) {
    return useQuery({
        queryKey: ['trial-balance', params],
        queryFn: () => ledgerService.getTrialBalance(params!),
        enabled: params !== null,
    });
}

export function useIncomeStatement(params: TrialBalanceParams | null) {
    return useQuery({
        queryKey: ['income-statement', params],
        queryFn: () => ledgerService.getIncomeStatement(params!),
        enabled: params !== null,
    });
}

export function useBalanceSheet(params: TrialBalanceParams | null) {
    return useQuery({
        queryKey: ['balance-sheet', params],
        queryFn: () => ledgerService.getBalanceSheet(params!),
        enabled: params !== null,
    });
}
