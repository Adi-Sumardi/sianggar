// =============================================================================
// Permission constants – mirrors Spatie permissions defined in backend
// =============================================================================

export const Permission = {
    VIEW_DASHBOARD: 'view-dashboard',
    VIEW_BUDGET: 'view-budget',
    MANAGE_BUDGET: 'manage-budget',
    CREATE_PROPOSAL: 'create-proposal',
    VIEW_PROPOSALS: 'view-proposals',
    APPROVE_PROPOSALS: 'approve-proposals',
    VIEW_REPORTS: 'view-reports',
    CREATE_LPJ: 'create-lpj',
    MANAGE_REPORTS: 'manage-reports',
    VIEW_PLANNING: 'view-planning',
    MANAGE_PLANNING: 'manage-planning',
    VIEW_EMAILS: 'view-emails',
    MANAGE_EMAILS: 'manage-emails',
    MANAGE_USERS: 'manage-users',
    MANAGE_UNITS: 'manage-units',
    MANAGE_PERUBAHAN: 'manage-perubahan',
} as const;

export type PermissionValue = (typeof Permission)[keyof typeof Permission];
