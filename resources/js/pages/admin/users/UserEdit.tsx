import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { ArrowLeft, Save, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { UserRole, getRoleLabel } from '@/types/enums';
import { useUnitsList } from '@/hooks/useUnits';
import { useUser, useUpdateUser, useUpdateUserPassword } from '@/hooks/useUsers';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const editUserSchema = z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
    email: z.string().email('Format email tidak valid'),
    no_hp: z.string().max(20, 'No HP maksimal 20 karakter').optional(),
    role: z.nativeEnum(UserRole, { message: 'Role wajib dipilih' }),
    unit_id: z.number().optional(),
});

type EditUserForm = z.infer<typeof editUserSchema>;

const changePasswordSchema = z
    .object({
        password: z
            .string()
            .refine((val) => val === '' || val.length >= 8, {
                message: 'Password minimal 8 karakter',
            }),
        password_confirmation: z.string(),
    })
    .refine(
        (data) => {
            if (data.password === '') return true;
            return data.password === data.password_confirmation;
        },
        {
            message: 'Konfirmasi password tidak cocok',
            path: ['password_confirmation'],
        },
    );

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserEdit() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const userId = id ? Number(id) : null;

    // Fetch user data from API
    const { data: userData, isLoading: userLoading, isError, error } = useUser(userId);

    // Fetch units list from API
    const { data: unitsList = [], isLoading: unitsLoading } = useUnitsList();

    // Mutations
    const updateUserMutation = useUpdateUser();
    const updatePasswordMutation = useUpdateUserPassword();

    // User info form
    const {
        register: registerUser,
        handleSubmit: handleSubmitUser,
        watch: watchUser,
        setValue: setUserValue,
        reset: resetUserForm,
        formState: { errors: userErrors, isSubmitting: isUserSubmitting },
    } = useForm<EditUserForm>({
        resolver: zodResolver(editUserSchema),
        defaultValues: {
            name: '',
            email: '',
            no_hp: '',
            role: UserRole.Admin,
            unit_id: undefined,
        },
    });

    // Password form
    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        reset: resetPassword,
        formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    } = useForm<ChangePasswordForm>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            password: '',
            password_confirmation: '',
        },
    });

    // Populate form when user data is loaded
    useEffect(() => {
        if (userData) {
            resetUserForm({
                name: userData.name,
                email: userData.email,
                no_hp: userData.no_hp ?? '',
                role: userData.role as UserRole,
                unit_id: userData.unit_id ?? undefined,
            });
        }
    }, [userData, resetUserForm]);

    const selectedUnitId = watchUser('unit_id');

    const onSubmitUser = async (data: EditUserForm) => {
        if (!userId) return;

        updateUserMutation.mutate(
            {
                id: userId,
                data: {
                    name: data.name,
                    email: data.email,
                    no_hp: data.no_hp || null,
                    role: data.role,
                    unit_id: data.unit_id || null,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Data pengguna berhasil diperbarui');
                    navigate('/admin/users');
                },
                onError: (err: Error) => {
                    toast.error(err.message || 'Gagal memperbarui pengguna');
                },
            },
        );
    };

    const onSubmitPassword = async (data: ChangePasswordForm) => {
        if (!userId || !data.password) return;

        updatePasswordMutation.mutate(
            { id: userId, data },
            {
                onSuccess: () => {
                    toast.success('Password berhasil diubah');
                    resetPassword();
                },
                onError: (err: Error) => {
                    toast.error(err.message || 'Gagal mengubah password');
                },
            },
        );
    };

    if (userLoading) {
        return (
            <PageTransition>
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </PageTransition>
        );
    }

    if (isError || !userData) {
        return (
            <PageTransition>
                <div className="flex h-64 flex-col items-center justify-center gap-4">
                    <p className="text-sm text-red-600">
                        {error instanceof Error ? error.message : 'Pengguna tidak ditemukan'}
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/users')}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        Kembali ke daftar pengguna
                    </button>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Edit Pengguna"
                        description={`Mengubah data pengguna: ${userData.name}`}
                        actions={
                            <button
                                type="button"
                                onClick={() => navigate('/admin/users')}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </button>
                        }
                    />
                </motion.div>

                {/* User Info Form */}
                <motion.div variants={staggerItem}>
                    <form onSubmit={handleSubmitUser(onSubmitUser)} className="space-y-6">
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-lg font-semibold text-slate-900">
                                Informasi Pengguna
                            </h2>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {/* Nama */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Nama <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Masukkan nama lengkap"
                                        {...registerUser('name')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            userErrors.name
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {userErrors.name && (
                                        <p className="text-xs text-red-600">{userErrors.name.message}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="contoh@sianggar.id"
                                        {...registerUser('email')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            userErrors.email
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {userErrors.email && (
                                        <p className="text-xs text-red-600">{userErrors.email.message}</p>
                                    )}
                                </div>

                                {/* No HP */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="no_hp"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        No HP (WhatsApp)
                                    </label>
                                    <input
                                        id="no_hp"
                                        type="text"
                                        placeholder="cth: 08123456789"
                                        {...registerUser('no_hp')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            userErrors.no_hp
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {userErrors.no_hp && (
                                        <p className="text-xs text-red-600">{userErrors.no_hp.message}</p>
                                    )}
                                </div>

                                {/* Role */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="role"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Role <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="role"
                                        {...registerUser('role')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            userErrors.role
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    >
                                        <option value="">Pilih role</option>
                                        {Object.values(UserRole).map((role) => (
                                            <option key={role} value={role}>
                                                {getRoleLabel(role)}
                                            </option>
                                        ))}
                                    </select>
                                    {userErrors.role && (
                                        <p className="text-xs text-red-600">{userErrors.role.message}</p>
                                    )}
                                </div>

                                {/* Unit */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="unit_id"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Unit
                                    </label>
                                    {unitsLoading ? (
                                        <div className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3">
                                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                            <span className="text-sm text-slate-400">Memuat unit...</span>
                                        </div>
                                    ) : (
                                        <SearchableSelect
                                            options={[
                                                { value: '', label: 'Tidak ada unit (Pusat)' },
                                                ...unitsList.map((unit) => ({
                                                    value: String(unit.id),
                                                    label: `${unit.kode} - ${unit.nama}`,
                                                })),
                                            ]}
                                            value={selectedUnitId ? String(selectedUnitId) : ''}
                                            onChange={(val) => {
                                                setUserValue('unit_id', val ? Number(val) : undefined);
                                            }}
                                            placeholder="Pilih unit..."
                                            searchPlaceholder="Cari unit..."
                                        />
                                    )}
                                    <p className="text-xs text-slate-500">
                                        Pilih unit jika pengguna merupakan bagian dari unit tertentu
                                    </p>
                                    {userErrors.unit_id && (
                                        <p className="text-xs text-red-600">{userErrors.unit_id.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/users')}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={isUserSubmitting || updateUserMutation.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                            >
                                {updateUserMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {updateUserMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Change Password Section */}
                <motion.div variants={staggerItem}>
                    <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
                        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                                    <KeyRound className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Ubah Password
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Biarkan kosong jika tidak ingin mengubah password.
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {/* New Password */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="new-password"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Password Baru
                                    </label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        placeholder="Minimal 8 karakter"
                                        {...registerPassword('password')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            passwordErrors.password
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {passwordErrors.password && (
                                        <p className="text-xs text-red-600">{passwordErrors.password.message}</p>
                                    )}
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="new-password-confirm"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Konfirmasi Password Baru
                                    </label>
                                    <input
                                        id="new-password-confirm"
                                        type="password"
                                        placeholder="Ulangi password baru"
                                        {...registerPassword('password_confirmation')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            passwordErrors.password_confirmation
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {passwordErrors.password_confirmation && (
                                        <p className="text-xs text-red-600">{passwordErrors.password_confirmation.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isPasswordSubmitting || updatePasswordMutation.isPending}
                                    className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
                                >
                                    {updatePasswordMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <KeyRound className="h-4 w-4" />
                                    )}
                                    {updatePasswordMutation.isPending ? 'Mengubah...' : 'Ubah Password'}
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
