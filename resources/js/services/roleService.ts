import api from '@/lib/api';

// =============================================================================
// Types
// =============================================================================

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    permissions: string[];
}

export interface RoleWithMeta extends Role {
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedRoles {
    data: Role[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface RoleMatrix {
    roles: Role[];
    permissions: Permission[];
}

export interface Permission {
    id: number;
    name: string;
    guard_name: string;
}

export interface RoleFilterParams {
    search?: string;
    per_page?: number;
    page?: number;
}

export interface CreateRolePayload {
    name: string;
    guard_name?: string;
    permissions?: string[];
}

export interface UpdateRolePayload {
    name?: string;
    guard_name?: string;
    permissions?: string[];
}

export interface SyncPermissionsPayload {
    permissions: string[];
}

// =============================================================================
// API Calls
// =============================================================================

/**
 * Fetch paginated list of roles with their permissions.
 */
export async function getRoles(params?: RoleFilterParams): Promise<PaginatedRoles> {
    const response = await api.get('/roles', { params });
    return response.data;
}

/**
 * Fetch a single role by ID.
 */
export async function getRole(id: number): Promise<Role> {
    const response = await api.get(`/roles/${id}`);
    return response.data.data;
}

/**
 * Fetch role-permission matrix for matrix view UI.
 */
export async function getRoleMatrix(): Promise<RoleMatrix> {
    const response = await api.get('/roles/matrix');
    return response.data.data;
}

/**
 * Create a new role.
 */
export async function createRole(data: CreateRolePayload): Promise<Role> {
    const response = await api.post('/roles', data);
    return response.data.data;
}

/**
 * Update an existing role.
 */
export async function updateRole(id: number, data: UpdateRolePayload): Promise<Role> {
    const response = await api.put(`/roles/${id}`, data);
    return response.data.data;
}

/**
 * Delete a role.
 */
export async function deleteRole(id: number): Promise<void> {
    await api.delete(`/roles/${id}`);
}

/**
 * Sync permissions for a specific role.
 */
export async function syncRolePermissions(id: number, data: SyncPermissionsPayload): Promise<Role> {
    const response = await api.post(`/roles/${id}/sync-permissions`, data);
    return response.data.data;
}
