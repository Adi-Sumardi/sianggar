import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationService from '@/services/notificationService';

// =============================================================================
// Notification Hooks
// =============================================================================

/**
 * Fetch all notifications for the current user.
 */
export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: notificationService.getNotifications,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

/**
 * Fetch unread notification count.
 */
export function useUnreadNotificationCount() {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: notificationService.getUnreadCount,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}

/**
 * Mark a notification as read.
 */
export function useMarkNotificationAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

/**
 * Delete a notification.
 */
export function useDeleteNotification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}
