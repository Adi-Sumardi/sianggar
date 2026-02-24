import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/enums';

interface RoleGuardProps {
    roles: UserRole[];
    children: React.ReactNode;
}

export function RoleGuard({ roles, children }: RoleGuardProps) {
    const { user } = useAuthStore();

    if (!user || !roles.includes(user.role)) {
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
