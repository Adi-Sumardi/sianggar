import api from '@/lib/api';

// =============================================================================
// Types
// =============================================================================

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at?: string;
}

export interface PermissionWithRoles extends Permission {
    roles: string[];
}

export interface PermissionGroup {
    category: string;
    permissions: Permission[];
}

export interface PermissionsResponse {
    data: Permission[];
    grouped: PermissionGroup[];
}

export interface PermissionFilterParams {
    search?: string;
}

export interface CreatePermissionPayload {
    name: string;
    guard_name?: string;
}

export interface UpdatePermissionPayload {
    name?: string;
    guard_name?: string;
}

// =============================================================================
// API Calls
// =============================================================================

/**
 * Fetch all permissions with optional grouping.
 */
export async function getPermissions(params?: PermissionFilterParams): Promise<PermissionsResponse> {
    const response = await api.get('/permissions', { params });
    return response.data;
}

/**
 * Fetch a single permission by ID.
 */
export async function getPermission(id: number): Promise<PermissionWithRoles> {
    const response = await api.get(`/permissions/${id}`);
    return response.data.data;
}

/**
 * Create a new permission.
 */
export async function createPermission(data: CreatePermissionPayload): Promise<Permission> {
    const response = await api.post('/permissions', data);
    return response.data.data;
}

/**
 * Update an existing permission.
 */
export async function updatePermission(id: number, data: UpdatePermissionPayload): Promise<Permission> {
    const response = await api.put(`/permissions/${id}`, data);
    return response.data.data;
}

/**
 * Delete a permission.
 */
export async function deletePermission(id: number): Promise<void> {
    await api.delete(`/permissions/${id}`);
}
