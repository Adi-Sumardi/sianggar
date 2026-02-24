import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { PageTransition } from '@/components/layout/PageTransition';
import { PageHeader } from '@/components/layout/PageHeader';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/types/enums';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Settings() {
    const { user, changePassword, changePasswordStatus } = useAuth();

    // Password form state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Show/hide password toggles
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validation
    const passwordsMatch = newPassword === confirmPassword;
    const isValidLength = newPassword.length >= 8;
    const canSubmit =
        currentPassword.length > 0 &&
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        passwordsMatch &&
        isValidLength;

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canSubmit) return;

        try {
            await changePassword({
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
            });

            toast.success('Password berhasil diubah');

            // Reset form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Gagal mengubah password');
        }
    };

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
            >
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Pengaturan"
                        description="Kelola pengaturan akun dan keamanan Anda"
                    />
                </motion.div>

                {/* Account Info Card */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-lg border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <h2 className="text-base font-semibold text-slate-900">
                                Informasi Akun
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-medium text-slate-500">
                                        Nama
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {user?.name ?? '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">
                                        Email
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {user?.email ?? '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">
                                        Role
                                    </label>
                                    <p className="mt-1">
                                        <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                                            {user?.role ? getRoleLabel(user.role) : '-'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500">
                                        Unit
                                    </label>
                                    <p className="mt-1 text-sm font-medium text-slate-900">
                                        {user?.unit?.nama ?? '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Change Password Card */}
                <motion.div variants={staggerItem}>
                    <div className="rounded-lg border border-slate-200 bg-white">
                        <div className="border-b border-slate-200 px-6 py-4">
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-slate-400" />
                                <h2 className="text-base font-semibold text-slate-900">
                                    Ubah Password
                                </h2>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                                Pastikan password baru minimal 8 karakter
                            </p>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6">
                            <div className="max-w-md space-y-4">
                                {/* Current Password */}
                                <div>
                                    <label
                                        htmlFor="current-password"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Password Saat Ini
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="current-password"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Masukkan password saat ini"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* New Password */}
                                <div>
                                    <label
                                        htmlFor="new-password"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Password Baru
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="new-password"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Masukkan password baru"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {/* Password requirements */}
                                    <div className="mt-2 space-y-1">
                                        <div
                                            className={`flex items-center gap-1.5 text-xs ${
                                                isValidLength ? 'text-green-600' : 'text-slate-400'
                                            }`}
                                        >
                                            {isValidLength ? (
                                                <Check className="h-3.5 w-3.5" />
                                            ) : (
                                                <AlertCircle className="h-3.5 w-3.5" />
                                            )}
                                            Minimal 8 karakter
                                        </div>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label
                                        htmlFor="confirm-password"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Konfirmasi Password Baru
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirm-password"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`block w-full rounded-md border bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                                                confirmPassword.length > 0 && !passwordsMatch
                                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                                            }`}
                                            placeholder="Konfirmasi password baru"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && !passwordsMatch && (
                                        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            Password tidak cocok
                                        </p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={!canSubmit || changePasswordStatus.isPending}
                                        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {changePasswordStatus.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Lock className="h-4 w-4" />
                                                Ubah Password
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
