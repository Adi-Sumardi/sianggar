import api from '@/lib/api';
import type { User } from '@/types/models';
import type {
    ApiResponse,
    LoginDTO,
    LoginResponse,
    ChangePasswordDTO,
} from '@/types/api';

// =============================================================================
// Auth service – interacts with Laravel Sanctum SPA authentication
// =============================================================================

/**
 * Fetch the currently authenticated user.
 */
export async function getUser(): Promise<User> {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data;
}

/**
 * Log in with email and password.
 */
export async function login(dto: LoginDTO): Promise<LoginResponse> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', dto);
    return data.data;
}

/**
 * Log out the current user (invalidate session / token).
 */
export async function logout(): Promise<void> {
    await api.post('/auth/logout');
}

/**
 * Change the authenticated user's password.
 */
export async function changePassword(dto: ChangePasswordDTO): Promise<void> {
    await api.put('/auth/password', dto);
}

/**
 * Update the authenticated user's profile information.
 */
export async function updateProfile(dto: { name?: string; email?: string }): Promise<User> {
    const { data } = await api.put<ApiResponse<User>>('/auth/profile', dto);
    return data.data;
}
