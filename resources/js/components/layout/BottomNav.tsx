import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    ClipboardList,
    Mail,
    Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { Permission } from '@/types/permissions';

interface BottomNavItem {
    label: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
}

const items: BottomNavItem[] = [
    { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: Permission.VIEW_DASHBOARD },
    { label: 'Pengajuan', to: '/pengajuan', icon: FileText, permission: Permission.VIEW_PROPOSALS },
    { label: 'LPJ', to: '/lpj', icon: ClipboardList, permission: Permission.VIEW_REPORTS },
    { label: 'Email', to: '/emails', icon: Mail, permission: Permission.VIEW_EMAILS },
    { label: 'Menu', to: '#menu', icon: Menu },
];

export function BottomNav() {
    const { user } = useAuthStore();
    const userPermissions = user?.permissions ?? [];
    const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

    const visibleItems = items.filter((item) => {
        if (!item.permission) return true;
        return userPermissions.includes(item.permission);
    });

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white sm:hidden">
            <div className="flex h-16 items-center justify-around">
                {visibleItems.map((item) => {
                    const Icon = item.icon;

                    if (item.to === '#menu') {
                        return (
                            <button
                                key={item.label}
                                type="button"
                                onClick={() => setMobileOpen(true)}
                                className="flex flex-1 flex-col items-center justify-center gap-0.5 text-muted-foreground"
                            >
                                <Icon className="h-5 w-5" />
                                <span className="text-[11px] font-medium leading-tight">
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                                    isActive
                                        ? 'text-primary-600'
                                        : 'text-muted-foreground hover:text-foreground',
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className={cn(
                                            'h-5 w-5',
                                            isActive && 'text-primary-600',
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            'text-[11px] font-medium leading-tight',
                                            isActive && 'text-primary-600',
                                        )}
                                    >
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
