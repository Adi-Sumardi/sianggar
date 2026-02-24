import api from '@/lib/api';
import type { Unit } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';

// =============================================================================
// Types
// =============================================================================

export interface UnitListParams {
    search?: string;
    per_page?: number;
    page?: number;
}

export interface CreateUnitDto {
    kode: string;
    nama: string;
}

export interface UpdateUnitDto {
    kode?: string;
    nama?: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get paginated list of units (admin management).
 */
export async function getUnits(params?: UnitListParams): Promise<PaginatedResponse<Unit>> {
    const { data } = await api.get<PaginatedResponse<Unit>>('/units', { params });
    return data;
}

/**
 * Get simple list of all units (for dropdowns/filters).
 */
export async function getUnitsList(): Promise<{ id: number; kode: string; nama: string }[]> {
    const { data } = await api.get<{ data: { id: number; kode: string; nama: string }[] }>('/units/list');
    return data.data;
}

/**
 * Get single unit by ID.
 */
export async function getUnit(id: number): Promise<Unit> {
    const { data } = await api.get<{ data: Unit }>(`/units/${id}`);
    return data.data;
}

/**
 * Create a new unit.
 */
export async function createUnit(dto: CreateUnitDto): Promise<Unit> {
    const { data } = await api.post<{ data: Unit; message: string }>('/units', dto);
    return data.data;
}

/**
 * Update an existing unit.
 */
export async function updateUnit(id: number, dto: UpdateUnitDto): Promise<Unit> {
    const { data } = await api.put<{ data: Unit; message: string }>(`/units/${id}`, dto);
    return data.data;
}

/**
 * Delete a unit.
 */
export async function deleteUnit(id: number): Promise<void> {
    await api.delete(`/units/${id}`);
}
