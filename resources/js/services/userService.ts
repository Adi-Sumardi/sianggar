import api from '@/lib/api';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    role_label: string;
    unit_id: number | null;
    unit?: {
        id: number;
        nama: string;
        kode: string;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedUsers {
    data: User[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export interface UserFilterParams {
    search?: string;
    role?: string;
    per_page?: number;
    page?: number;
}

export interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
    role: string;
    unit_id?: number | null;
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    role?: string;
    unit_id?: number | null;
}

export interface UpdatePasswordPayload {
    password: string;
    password_confirmation: string;
}

export async function getUsers(params?: UserFilterParams): Promise<PaginatedUsers> {
    const response = await api.get('/users', { params });
    return response.data;
}

export async function getUser(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
}

export async function createUser(data: CreateUserPayload): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data;
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data.data;
}

export async function deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
}

export async function updateUserPassword(id: number, data: UpdatePasswordPayload): Promise<void> {
    await api.patch(`/users/${id}/password`, data);
}
