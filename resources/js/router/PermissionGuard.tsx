import { Link } from 'react-router-dom';
import { ShieldX, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface PermissionGuardProps {
    permissions: string[];
    children: React.ReactNode;
}

export function PermissionGuard({ permissions, children }: PermissionGuardProps) {
    const { user, isLoading } = useAuthStore();

    // Wait until auth state is resolved before checking permissions
    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
        );
    }

    const userPermissions = user?.permissions ?? [];
    const hasAccess = permissions.some((p) => userPermissions.includes(p));

    if (!user || !hasAccess) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                    <ShieldX className="h-8 w-8 text-red-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        403 - Akses Ditolak
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        Anda tidak memiliki izin untuk mengakses halaman ini.
                        Silakan hubungi administrator jika Anda merasa ini adalah
                        kesalahan.
                    </p>
                </div>
                <Link
                    to="/dashboard"
                    className="mt-2 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                    Kembali ke Dashboard
                </Link>
            </div>
        );
    }

    return <>{children}</>;
}
