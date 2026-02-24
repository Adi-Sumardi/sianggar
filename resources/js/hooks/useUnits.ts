import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as unitService from '@/services/unitService';
import type { UnitListParams, CreateUnitDto, UpdateUnitDto } from '@/services/unitService';

// =============================================================================
// Query Keys
// =============================================================================

export const unitKeys = {
    all: ['units'] as const,
    lists: () => [...unitKeys.all, 'list'] as const,
    list: (params?: UnitListParams) => [...unitKeys.lists(), params] as const,
    simple: () => [...unitKeys.all, 'simple'] as const,
    details: () => [...unitKeys.all, 'detail'] as const,
    detail: (id: number) => [...unitKeys.details(), id] as const,
};

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch paginated list of units (for admin management).
 */
export function useUnits(params?: UnitListParams) {
    return useQuery({
        queryKey: unitKeys.list(params),
        queryFn: () => unitService.getUnits(params),
    });
}

/**
 * Fetch simple list of all units (for dropdowns/filters).
 */
export function useUnitsList() {
    return useQuery({
        queryKey: unitKeys.simple(),
        queryFn: () => unitService.getUnitsList(),
        staleTime: 5 * 60 * 1000, // 5 minutes - units don't change often
    });
}

/**
 * Fetch single unit by ID.
 */
export function useUnit(id: number) {
    return useQuery({
        queryKey: unitKeys.detail(id),
        queryFn: () => unitService.getUnit(id),
        enabled: !!id,
    });
}

// =============================================================================
// Mutations
// =============================================================================

/**
 * Create a new unit.
 */
export function useCreateUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: CreateUnitDto) => unitService.createUnit(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitKeys.all });
        },
    });
}

/**
 * Update an existing unit.
 */
export function useUpdateUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateUnitDto }) => unitService.updateUnit(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitKeys.all });
        },
    });
}

/**
 * Delete a unit.
 */
export function useDeleteUnit() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => unitService.deleteUnit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: unitKeys.all });
        },
    });
}
