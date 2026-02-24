import api from '@/lib/api';

// =============================================================================
// Notification Types
// =============================================================================

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    color: string;
    link: string | null;
    read_at: string | null;
    created_at: string;
}

export interface NotificationsResponse {
    data: Notification[];
    unread_count: number;
}

// =============================================================================
// Notification Service
// =============================================================================

export async function getNotifications(): Promise<NotificationsResponse> {
    const { data } = await api.get<NotificationsResponse>('/notifications');
    return data;
}

export async function getUnreadCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>('/notifications/unread-count');
    return data.count;
}

export async function markAsRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
    await api.post('/notifications/read-all');
}

export async function deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
}
