import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Bell,
    ChevronDown,
    ChevronRight,
    Home,
    LogOut,
    Settings,
    FileText,
    Check,
    CheckCheck,
    Clock,
    AlertCircle,
    ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, getAcademicYearOptions } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { getRoleLabel } from '@/types/enums';
import { useNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/useNotifications';
import api from '@/lib/api';

// ---------------------------------------------------------------------------
// Breadcrumb label mapping (same as PageHeader for consistency)
// ---------------------------------------------------------------------------

const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    admin: 'Admin',
    users: 'Kelola User',
    create: 'Tambah',
    edit: 'Edit',
    budget: 'Anggaran',
    'mata-anggaran': 'Mata Anggaran',
    apbs: 'APBS',
    rapbs: 'RAPBS',
    coa: 'COA',
    pengajuan: 'Pengajuan',
    approvals: 'Approval',
    perubahan: 'Perubahan',
    lpj: 'LPJ',
    laporan: 'Laporan',
    cawu: 'CAWU',
    accounting: 'Akuntansi',
    planning: 'Perencanaan',
    strategies: 'Strategi',
    indicators: 'Indikator',
    prokers: 'Proker',
    activities: 'Kegiatan',
    pkt: 'PKT',
    emails: 'Surat Internal',
    settings: 'Pengaturan',
};

function segmentLabel(segment: string): string {
    if (/^\d+$/.test(segment)) return `#${segment}`;
    return labelMap[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

// ---------------------------------------------------------------------------
// Notification icon mapping
// ---------------------------------------------------------------------------

function getNotificationIcon(type: string) {
    switch (type) {
        case 'new_proposal':
            return <FileText className="h-4 w-4 text-blue-500" />;
        case 'proposal_approved':
        case 'proposal_fully_approved':
        case 'lpj_approved':
            return <Check className="h-4 w-4 text-green-500" />;
        case 'proposal_revised':
        case 'lpj_revised':
            return <AlertCircle className="h-4 w-4 text-amber-500" />;
        case 'proposal_rejected':
        case 'lpj_rejected':
            return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'new_lpj':
            return <ClipboardCheck className="h-4 w-4 text-purple-500" />;
        default:
            return <Bell className="h-4 w-4 text-slate-500" />;
    }
}

// ---------------------------------------------------------------------------
// Navbar Component
// ---------------------------------------------------------------------------

export function Navbar() {
    const { user, fiscalYear, setFiscalYear, logout: storeLogout } = useAuthStore();
    const { isCollapsed, toggleCollapse, toggleMobileOpen } = useSidebarStore();
    const location = useLocation();
    const navigate = useNavigate();

    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showYearPicker, setShowYearPicker] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const userMenuRef = useRef<HTMLDivElement>(null);
    const yearMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Fetch notifications
    const { data: notificationsData } = useNotifications();
    const markAsReadMutation = useMarkNotificationAsRead();
    const markAllAsReadMutation = useMarkAllNotificationsAsRead();

    const notifications = notificationsData?.data ?? [];
    const unreadCount = notificationsData?.unread_count ?? 0;

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target as Node)
            ) {
                setShowUserMenu(false);
            }
            if (
                yearMenuRef.current &&
                !yearMenuRef.current.contains(e.target as Node)
            ) {
                setShowYearPicker(false);
            }
            if (
                notificationRef.current &&
                !notificationRef.current.contains(e.target as Node)
            ) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setShowUserMenu(false);
        setShowYearPicker(false);
        setShowNotifications(false);
    }, [location.pathname]);

    // Breadcrumbs
    const segments = location.pathname.split('/').filter(Boolean);

    // Logout handler
    async function handleLogout() {
        try {
            await api.post('/auth/logout');
        } catch {
            // Proceed even if logout API fails
        }
        storeLogout();
        navigate('/login');
    }

    // Handle notification click
    function handleNotificationClick(notification: typeof notifications[0]) {
        if (!notification.read_at) {
            markAsReadMutation.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
            setShowNotifications(false);
        }
    }

    // Format relative time
    function formatRelativeTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    }

    // User initials
    const initials =
        user?.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() ?? '?';

    // Academic year options
    const yearOptions = getAcademicYearOptions();

    return (
        <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center border-b-2 border-primary-600 bg-white shadow-sm">
            <div className="flex h-full w-full items-center gap-4 px-4">
                {/* --- Left: Toggle buttons + breadcrumbs --- */}
                <div className="flex items-center gap-2">
                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        onClick={toggleMobileOpen}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
                        aria-label="Toggle menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Desktop sidebar collapse */}
                    <button
                        type="button"
                        onClick={toggleCollapse}
                        className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? (
                            <PanelLeftOpen className="h-5 w-5" />
                        ) : (
                            <PanelLeftClose className="h-5 w-5" />
                        )}
                    </button>

                    {/* Breadcrumbs (hidden on small screens) */}
                    <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                            <Home className="h-3.5 w-3.5" />
                        </Link>
                        {segments.map((segment, index) => {
                            const path = '/' + segments.slice(0, index + 1).join('/');
                            const isLast = index === segments.length - 1;
                            const label = segmentLabel(segment);

                            return (
                                <span key={path} className="flex items-center gap-1">
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                                    {isLast ? (
                                        <span className="max-w-35 truncate font-medium text-foreground">
                                            {label}
                                        </span>
                                    ) : (
                                        <Link
                                            to={path}
                                            className="max-w-35 truncate transition-colors hover:text-foreground"
                                        >
                                            {label}
                                        </Link>
                                    )}
                                </span>
                            );
                        })}
                    </nav>
                </div>

                {/* --- Spacer --- */}
                <div className="flex-1" />

                {/* --- Right: Fiscal year, notifications, user --- */}
                <div className="flex items-center gap-2">
                    {/* Fiscal Year Selector */}
                    <div ref={yearMenuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setShowYearPicker((prev) => !prev)}
                            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            <span className="hidden sm:inline text-muted-foreground">TA</span>
                            <span>{fiscalYear}</span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>

                        <AnimatePresence>
                            {showYearPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1 w-36 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
                                >
                                    {yearOptions.map((year) => (
                                        <button
                                            key={year}
                                            type="button"
                                            onClick={() => {
                                                setFiscalYear(year);
                                                setShowYearPicker(false);
                                            }}
                                            className={cn(
                                                'flex w-full items-center px-4 py-2 text-sm transition-colors',
                                                year === fiscalYear
                                                    ? 'bg-primary-50 font-medium text-primary-600'
                                                    : 'text-foreground hover:bg-muted',
                                            )}
                                        >
                                            TA {year}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Notification bell */}
                    <div ref={notificationRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setShowNotifications((prev) => !prev)}
                            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Notifications"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-white shadow-lg"
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Notifikasi
                                        </h3>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => markAllAsReadMutation.mutate()}
                                                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                                            >
                                                <CheckCheck className="h-3.5 w-3.5" />
                                                Tandai semua dibaca
                                            </button>
                                        )}
                                    </div>

                                    {/* Notification list */}
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Bell className="h-8 w-8 text-slate-300" />
                                                <p className="mt-2 text-sm text-muted-foreground">
                                                    Tidak ada notifikasi
                                                </p>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 10).map((notification) => (
                                                <button
                                                    key={notification.id}
                                                    type="button"
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={cn(
                                                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted',
                                                        !notification.read_at && 'bg-primary-50/50',
                                                    )}
                                                >
                                                    <div className="mt-0.5 shrink-0">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {notification.title}
                                                        </p>
                                                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                            {notification.message}
                                                        </p>
                                                        <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <Clock className="h-3 w-3" />
                                                            {formatRelativeTime(notification.created_at)}
                                                        </p>
                                                    </div>
                                                    {!notification.read_at && (
                                                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                                                    )}
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {notifications.length > 0 && (
                                        <div className="border-t border-border p-2">
                                            <Link
                                                to="/notifications"
                                                onClick={() => setShowNotifications(false)}
                                                className="flex items-center justify-center rounded-md py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-muted"
                                            >
                                                Lihat semua notifikasi
                                            </Link>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* User avatar dropdown */}
                    <div ref={userMenuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setShowUserMenu((prev) => !prev)}
                            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                                {initials}
                            </div>
                            <div className="hidden text-left lg:block">
                                <p className="max-w-30 truncate text-sm font-medium text-foreground">
                                    {user?.name ?? 'User'}
                                </p>
                                <p className="text-[11px] capitalize text-muted-foreground">
                                    {user?.role ? getRoleLabel(user.role) : 'User'}
                                </p>
                            </div>
                            <ChevronDown className="hidden h-4 w-4 text-muted-foreground lg:block" />
                        </button>

                        <AnimatePresence>
                            {showUserMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-1 w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-white py-1 shadow-lg"
                                >
                                    {/* User info header */}
                                    <div className="border-b border-border px-4 py-3">
                                        <p className="truncate text-sm font-medium text-foreground">
                                            {user?.name ?? 'User'}
                                        </p>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {user?.email ?? ''}
                                        </p>
                                        <span className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium capitalize text-primary-700">
                                            {user?.role ? getRoleLabel(user.role) : 'User'}
                                        </span>
                                    </div>

                                    {/* Menu items */}
                                    <Link
                                        to="/settings"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                                    >
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        Pengaturan
                                    </Link>

                                    <div className="my-1 border-t border-border" />

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
