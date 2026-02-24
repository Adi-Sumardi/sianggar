// ---------------------------------------------------------------------------
// Barrel re-export for all SIANGGAR types
// ---------------------------------------------------------------------------

export * from './enums';
export * from './models';
export * from './api';

// ---------------------------------------------------------------------------
// UI-specific types (not tied to the backend)
// ---------------------------------------------------------------------------

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    read: boolean;
    created_at: string;
}

export interface SidebarState {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    toggleCollapse: () => void;
    setCollapsed: (collapsed: boolean) => void;
    toggleMobileOpen: () => void;
    setMobileOpen: (open: boolean) => void;
}

export interface AuthState {
    user: import('./models').User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    fiscalYear: string;
    setUser: (user: import('./models').User | null) => void;
    setLoading: (isLoading: boolean) => void;
    setFiscalYear: (fiscalYear: string) => void;
    logout: () => void;
}
