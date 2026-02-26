import { useCallback, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    LayoutDashboard,
    Wallet,
    FileSpreadsheet,
    FileBarChart,
    ListTree,
    FileText,
    FilePlus,
    RefreshCw,
    CheckCircle2,
    ClipboardList,
    BarChart3,
    Calendar,
    Calculator,
    Target,
    Gauge,
    Briefcase,
    Activity,
    PackageSearch,
    Mail,
    Users,
    Building,
    Shield,
    Key,
    ChevronLeft,
    LogOut,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { sidebarVariants } from '@/lib/animations';
import { getRoleLabel, UserRole } from '@/types/enums';
import { Permission } from '@/types/permissions';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { History, Printer as PrinterIcon } from 'lucide-react';
import { useLpjStats } from '@/hooks/useLpj';
import { LpjLimitModal } from '@/components/common/LpjLimitModal';

// ---------------------------------------------------------------------------
// Navigation structure
// ---------------------------------------------------------------------------

interface NavItem {
    label: string;
    to: string;
    icon: LucideIcon;
}

interface NavGroup {
    title: string;
    items: NavItem[];
    /** Permission required to see this group. Undefined = visible to all. */
    permission?: string;
}

const navigationGroups: NavGroup[] = [
    {
        title: 'UTAMA',
        permission: Permission.VIEW_DASHBOARD,
        items: [
            { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'ANGGARAN',
        permission: Permission.VIEW_BUDGET,
        items: [
            { label: 'Mata Anggaran', to: '/budget/mata-anggaran', icon: Wallet },
            { label: 'APBS', to: '/budget/apbs', icon: FileSpreadsheet },
            { label: 'RAPBS', to: '/budget/rapbs', icon: FileBarChart },
            { label: 'COA', to: '/budget/coa', icon: ListTree },
        ],
    },
    {
        title: 'PENGAJUAN',
        permission: Permission.VIEW_PROPOSALS,
        items: [
            { label: 'Pengajuan Baru', to: '/pengajuan/create', icon: FilePlus },
            { label: 'Daftar Pengajuan', to: '/pengajuan', icon: FileText },
            { label: 'Perubahan Anggaran', to: '/perubahan', icon: RefreshCw },
        ],
    },
    {
        title: 'APPROVAL',
        permission: Permission.APPROVE_PROPOSALS,
        items: [
            { label: 'Antrian Approval', to: '/approvals', icon: CheckCircle2 },
        ],
    },
    {
        title: 'LAPORAN',
        permission: Permission.VIEW_REPORTS,
        items: [
            { label: 'LPJ', to: '/lpj', icon: ClipboardList },
            { label: 'Laporan Pengajuan', to: '/laporan/pengajuan', icon: BarChart3 },
            { label: 'Laporan Semester', to: '/laporan/semester', icon: Calendar },
            { label: 'Laporan Akuntansi', to: '/laporan/accounting', icon: Calculator },
        ],
    },
    {
        title: 'SIPAKAT',
        permission: Permission.VIEW_PLANNING,
        items: [
            { label: 'Strategi', to: '/planning/strategies', icon: Target },
            { label: 'Indikator', to: '/planning/indicators', icon: Gauge },
            { label: 'Proker', to: '/planning/prokers', icon: Briefcase },
            { label: 'Kegiatan', to: '/planning/activities', icon: Activity },
            { label: 'PKT', to: '/planning/pkt', icon: PackageSearch },
        ],
    },
    {
        title: 'KOMUNIKASI',
        permission: Permission.VIEW_EMAILS,
        items: [
            { label: 'Surat Internal', to: '/emails', icon: Mail },
        ],
    },
    {
        title: 'ADMIN',
        permission: Permission.MANAGE_USERS,
        items: [
            { label: 'Kelola User', to: '/admin/users', icon: Users },
            { label: 'Kelola Unit', to: '/admin/units', icon: Building },
            { label: 'Role & Permission', to: '/admin/roles', icon: Shield },
        ],
    },
];

// Kasir-specific navigation - only shows Cetak Voucher and Riwayat Cetak
const kasirNavigationGroups: NavGroup[] = [
    {
        title: 'UTAMA',
        permission: Permission.VIEW_DASHBOARD,
        items: [
            { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'CETAK VOUCHER',
        permission: Permission.APPROVE_PROPOSALS,
        items: [
            { label: 'Antrian Voucher', to: '/approvals', icon: PrinterIcon },
            { label: 'Riwayat Cetak', to: '/voucher-history', icon: History },
        ],
    },
];

// Payment-specific navigation - only shows Payment queue
const paymentNavigationGroups: NavGroup[] = [
    {
        title: 'UTAMA',
        permission: Permission.VIEW_DASHBOARD,
        items: [
            { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
        ],
    },
    {
        title: 'PAYMENT',
        permission: Permission.APPROVE_PROPOSALS,
        items: [
            { label: 'Antrian Pembayaran', to: '/approvals', icon: Wallet },
            { label: 'Riwayat Pembayaran', to: '/payment-history', icon: History },
        ],
    },
];

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------

export function Sidebar() {
    const { user, hasPermission } = useAuthStore();
    const { isCollapsed, toggleCollapse } = useSidebarStore();
    const location = useLocation();
    const navigate = useNavigate();

    // LPJ limit modal state
    const [showLpjLimitModal, setShowLpjLimitModal] = useState(false);
    const { data: lpjStats } = useLpjStats();

    const userPermissions = user?.permissions ?? [];
    const isKasir = user?.role === UserRole.Kasir;
    const isPayment = user?.role === UserRole.Payment;

    // Filter groups by permission - use role-specific nav for Kasir/Payment
    const visibleGroups = useMemo(
        () => {
            let groups = navigationGroups;
            if (isKasir) groups = kasirNavigationGroups;
            if (isPayment) groups = paymentNavigationGroups;

            return groups
                .filter((group) => {
                    if (!group.permission) return true;
                    return userPermissions.includes(group.permission);
                })
;
        },
        [userPermissions, isKasir, isPayment],
    );

    // Check if a path is active (exact or starts-with for nested routes)
    const isActive = useCallback(
        (to: string) => {
            if (to === '/dashboard') return location.pathname === '/dashboard';
            return location.pathname === to || location.pathname.startsWith(to + '/');
        },
        [location.pathname],
    );

    return (
        <motion.aside
            initial={false}
            animate={isCollapsed ? 'collapsed' : 'open'}
            variants={sidebarVariants}
            className="fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar lg:flex"
            style={{ top: 64 }} // below navbar
        >
            {/* ---- Logo area ---- */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
                <img
                    src="/logo/logo-sianggar.png"
                    alt="SIANGGAR"
                    className="h-9 w-9 shrink-0 object-contain"
                />
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            key="logo-text"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.15 }}
                            className="min-w-0 overflow-hidden"
                        >
                            <h2 className="whitespace-nowrap text-lg font-bold tracking-tight text-primary-600">
                                SIANGGAR
                            </h2>
                            <p className="whitespace-nowrap text-[10px] leading-none text-muted-foreground">
                                Sistem Informasi Pengajuan Anggaran
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ---- Navigation ---- */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                {visibleGroups.map((group, groupIndex) => (
                    <div key={group.title} className={cn(groupIndex > 0 && 'mt-4')}>
                        {/* Group divider */}
                        {groupIndex > 0 && (
                            <div className="mb-3 border-t border-sidebar-border" />
                        )}

                        {/* Group title */}
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.p
                                    key={`title-${group.title}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70"
                                >
                                    {group.title}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Items */}
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.to);
                                const isLpjLimited = item.to === '/pengajuan/create' && lpjStats && !lpjStats.can_create_pengajuan;

                                // Handle click for LPJ-limited items
                                const handleClick = (e: React.MouseEvent) => {
                                    if (isLpjLimited) {
                                        e.preventDefault();
                                        setShowLpjLimitModal(true);
                                    }
                                };

                                const navLinkContent = (
                                    <NavLink
                                        to={item.to}
                                        onClick={handleClick}
                                        className={cn(
                                            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            active
                                                ? 'bg-primary-50 text-primary-600'
                                                : 'text-sidebar-foreground hover:bg-primary-50/50 hover:text-primary-600',
                                            isCollapsed && 'justify-center px-0',
                                            isLpjLimited && 'opacity-60',
                                        )}
                                    >
                                        {/* Active indicator bar */}
                                        {active && (
                                            <motion.div
                                                layoutId="sidebar-active-indicator"
                                                className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-primary-600"
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 350,
                                                    damping: 30,
                                                }}
                                            />
                                        )}

                                        <Icon
                                            className={cn(
                                                'h-5 w-5 shrink-0',
                                                active
                                                    ? 'text-primary-600'
                                                    : 'text-muted-foreground group-hover:text-primary-600',
                                            )}
                                        />

                                        <AnimatePresence mode="wait">
                                            {!isCollapsed && (
                                                <motion.span
                                                    key={`label-${item.to}`}
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="truncate"
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </NavLink>
                                );

                                return (
                                    <li key={item.to}>
                                        {isCollapsed ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    {navLinkContent}
                                                </TooltipTrigger>
                                                <TooltipContent side="right" sideOffset={8}>
                                                    {item.label}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            navLinkContent
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* ---- Collapse toggle ---- */}
            <div className="border-t border-sidebar-border p-3">
                {isCollapsed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                onClick={toggleCollapse}
                                className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary-50/50 hover:text-primary-600"
                            >
                                <motion.div
                                    animate={{ rotate: 180 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </motion.div>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                            Perluas sidebar
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <button
                        type="button"
                        onClick={toggleCollapse}
                        className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary-50/50 hover:text-primary-600"
                    >
                        <motion.div
                            animate={{ rotate: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </motion.div>
                        <span className="truncate">Perkecil</span>
                    </button>
                )}
            </div>

            {/* ---- User info ---- */}
            <div className="border-t border-sidebar-border p-3">
                <div
                    className={cn(
                        'flex items-center gap-3',
                        isCollapsed && 'justify-center',
                    )}
                >
                    {/* Avatar */}
                    {isCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                                    {user?.name
                                        ?.split(' ')
                                        .map((n: string) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase() ?? '?'}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                                <p className="font-medium">{user?.name ?? 'User'}</p>
                                <p className="text-[10px] capitalize text-muted-foreground">
                                    {user?.role ? getRoleLabel(user.role) : 'User'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                            {user?.name
                                ?.split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() ?? '?'}
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                key="user-info"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.15 }}
                                className="min-w-0 flex-1 overflow-hidden"
                            >
                                <p className="truncate text-sm font-medium text-sidebar-foreground">
                                    {user?.name ?? 'User'}
                                </p>
                                <span className="inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium capitalize text-primary-700">
                                    {user?.role ? getRoleLabel(user.role) : 'User'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* LPJ Limit Modal */}
            <LpjLimitModal
                open={showLpjLimitModal}
                onOpenChange={setShowLpjLimitModal}
                pendingCount={lpjStats?.pending_lpj_count ?? 0}
                maxLimit={lpjStats?.max_pending_lpj ?? 20}
            />
        </motion.aside>
    );
}

// ---------------------------------------------------------------------------
// Mobile Sidebar (overlay)
// ---------------------------------------------------------------------------

export function MobileSidebar() {
    const { user } = useAuthStore();
    const { isMobileOpen, setMobileOpen } = useSidebarStore();
    const location = useLocation();

    // LPJ limit modal state
    const [showLpjLimitModal, setShowLpjLimitModal] = useState(false);
    const { data: lpjStats } = useLpjStats();

    const userPermissions = user?.permissions ?? [];
    const isKasir = user?.role === UserRole.Kasir;
    const isPayment = user?.role === UserRole.Payment;
    const isAdmin = user?.role === UserRole.Admin;

    const visibleGroups = useMemo(
        () => {
            let groups = navigationGroups;
            if (isKasir) groups = kasirNavigationGroups;
            if (isPayment) groups = paymentNavigationGroups;

            return groups
                .filter((group) => {
                    if (!group.permission) return true;
                    return userPermissions.includes(group.permission);
                })
;
        },
        [userPermissions, isKasir, isPayment],
    );

    const isActive = useCallback(
        (to: string) => {
            if (to === '/dashboard') return location.pathname === '/dashboard';
            return location.pathname === to || location.pathname.startsWith(to + '/');
        },
        [location.pathname],
    );

    return (
    <>
        <AnimatePresence>
            {isMobileOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Sidebar panel */}
                    <motion.aside
                        key="mobile-sidebar"
                        initial={{ x: -272 }}
                        animate={{ x: 0 }}
                        exit={{ x: -272 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-sidebar-border bg-sidebar lg:hidden"
                    >
                        {/* Logo */}
                        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
                            <img
                                src="/logo/logo-sianggar.png"
                                alt="SIANGGAR"
                                className="h-9 w-9 shrink-0 object-contain"
                            />
                            <div className="min-w-0">
                                <h2 className="text-lg font-bold tracking-tight text-primary-600">
                                    SIANGGAR
                                </h2>
                                <p className="text-[10px] leading-none text-muted-foreground">
                                    Sistem Informasi Pengajuan Anggaran
                                </p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto px-3 py-4">
                            {visibleGroups.map((group, groupIndex) => (
                                <div
                                    key={group.title}
                                    className={cn(groupIndex > 0 && 'mt-4')}
                                >
                                    {groupIndex > 0 && (
                                        <div className="mb-3 border-t border-sidebar-border" />
                                    )}

                                    <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                                        {group.title}
                                    </p>

                                    <ul className="space-y-0.5">
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const active = isActive(item.to);
                                            const isLpjLimited = item.to === '/pengajuan/create' && lpjStats && !lpjStats.can_create_pengajuan;

                                            // Handle click for LPJ-limited items
                                            const handleClick = (e: React.MouseEvent) => {
                                                if (isLpjLimited) {
                                                    e.preventDefault();
                                                    setShowLpjLimitModal(true);
                                                } else {
                                                    setMobileOpen(false);
                                                }
                                            };

                                            return (
                                                <li key={item.to}>
                                                    <NavLink
                                                        to={item.to}
                                                        onClick={handleClick}
                                                        className={cn(
                                                            'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                            active
                                                                ? 'bg-primary-50 text-primary-600'
                                                                : 'text-sidebar-foreground hover:bg-primary-50/50 hover:text-primary-600',
                                                            isLpjLimited && 'opacity-60',
                                                        )}
                                                    >
                                                        {active && (
                                                            <div className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r-full bg-primary-600" />
                                                        )}
                                                        <Icon
                                                            className={cn(
                                                                'h-5 w-5 shrink-0',
                                                                active
                                                                    ? 'text-primary-600'
                                                                    : 'text-muted-foreground',
                                                            )}
                                                        />
                                                        <span className="truncate">
                                                            {item.label}
                                                        </span>
                                                    </NavLink>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                        </nav>

                        {/* User */}
                        <div className="border-t border-sidebar-border p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                                    {user?.name
                                        ?.split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase() ?? '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-sidebar-foreground">
                                        {user?.name ?? 'User'}
                                    </p>
                                    <span className="inline-block rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium capitalize text-primary-700">
                                        {user?.role ? getRoleLabel(user.role) : 'User'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </motion.aside>
                </>
            )}

        </AnimatePresence>

        {/* LPJ Limit Modal - outside AnimatePresence to work independently */}
        <LpjLimitModal
            open={showLpjLimitModal}
            onOpenChange={setShowLpjLimitModal}
            pendingCount={lpjStats?.pending_lpj_count ?? 0}
            maxLimit={lpjStats?.max_pending_lpj ?? 20}
        />
    </>
    );
}
