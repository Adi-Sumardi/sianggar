import { useQuery } from '@tanstack/react-query';
import * as dashboardService from '@/services/dashboardService';
import type { DashboardParams } from '@/services/dashboardService';

// =============================================================================
// Dashboard hooks
// =============================================================================

/**
 * Fetch dashboard statistics for authenticated user.
 * Admin can filter by unit_id to see stats for a specific unit.
 */
export function useDashboardStats(params?: DashboardParams) {
    return useQuery({
        queryKey: ['dashboard', 'stats', params],
        queryFn: () => dashboardService.getDashboardStats(params),
        staleTime: 60 * 1000, // 1 minute
    });
}

/**
 * Fetch budget vs realization chart data.
 */
export function useDashboardCharts(params?: DashboardParams) {
    return useQuery({
        queryKey: ['dashboard', 'charts', params],
        queryFn: () => dashboardService.getDashboardCharts(params),
        staleTime: 60 * 1000,
    });
}

/**
 * Fetch monthly pengajuan vs realization chart data for a specific unit.
 */
export function useMonthlyCharts(params?: DashboardParams) {
    return useQuery({
        queryKey: ['dashboard', 'monthly-charts', params],
        queryFn: () => dashboardService.getMonthlyCharts(params),
        staleTime: 60 * 1000,
    });
}

/**
 * Fetch recent pengajuan list for dashboard table.
 */
export function useRecentPengajuan(params?: DashboardParams & { limit?: number }) {
    return useQuery({
        queryKey: ['dashboard', 'recent-pengajuan', params],
        queryFn: () => dashboardService.getRecentPengajuan(params),
        staleTime: 60 * 1000,
    });
}

/**
 * Fetch status distribution for pie chart.
 */
export function useStatusDistribution(params?: DashboardParams) {
    return useQuery({
        queryKey: ['dashboard', 'status-distribution', params],
        queryFn: () => dashboardService.getStatusDistribution(params),
        staleTime: 60 * 1000,
    });
}

/**
 * Fetch list of all units for filter dropdown.
 */
export function useUnitsList() {
    return useQuery({
        queryKey: ['units', 'list'],
        queryFn: () => dashboardService.getUnitsList(),
        staleTime: 5 * 60 * 1000, // 5 minutes - units don't change often
    });
}

/**
 * Fetch reminder stats for login notification modal.
 */
export function useReminderStats() {
    return useQuery({
        queryKey: ['dashboard', 'reminder-stats'],
        queryFn: () => dashboardService.getReminderStats(),
        staleTime: 30 * 1000, // 30 seconds
    });
}
