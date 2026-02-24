import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageTransition } from '@/components/layout/PageTransition';
import { SearchableSelect } from '@/components/common/SearchableSelect';
import { UserRole, getRoleLabel } from '@/types/enums';
import { useUnitsList } from '@/hooks/useUnits';
import { useCreateUser } from '@/hooks/useUsers';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const createUserSchema = z
    .object({
        name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
        email: z.string().email('Format email tidak valid'),
        password: z.string().min(8, 'Password minimal 8 karakter'),
        password_confirmation: z.string().min(1, 'Konfirmasi password wajib diisi'),
        role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Role wajib dipilih' }) }),
        unit_id: z.coerce.number().optional(),
    })
    .refine((data) => data.password === data.password_confirmation, {
        message: 'Konfirmasi password tidak cocok',
        path: ['password_confirmation'],
    });

type CreateUserForm = z.infer<typeof createUserSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UserCreate() {
    const navigate = useNavigate();

    // Fetch units list from API
    const { data: unitsList = [], isLoading: unitsLoading } = useUnitsList();

    // Create user mutation
    const createUser = useCreateUser();

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<CreateUserForm>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: undefined,
            unit_id: undefined,
        },
    });

    const selectedUnitId = watch('unit_id');

    const onSubmit = async (data: CreateUserForm) => {
        try {
            await createUser.mutateAsync({
                name: data.name,
                email: data.email,
                password: data.password,
                password_confirmation: data.password_confirmation,
                role: data.role,
                unit_id: data.unit_id ?? null,
            });
            toast.success('Pengguna berhasil ditambahkan');
            navigate('/admin/users');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Gagal menambahkan pengguna');
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
                {/* Header */}
                <motion.div variants={staggerItem}>
                    <PageHeader
                        title="Tambah Pengguna"
                        description="Buat akun pengguna baru untuk sistem SIANGGAR."
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

                {/* Form card */}
                <motion.div variants={staggerItem}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                                        {...register('name')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            errors.name
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-red-600">{errors.name.message}</p>
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
                                        {...register('email')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            errors.email
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="password"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Minimal 8 karakter"
                                        {...register('password')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            errors.password
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {errors.password && (
                                        <p className="text-xs text-red-600">{errors.password.message}</p>
                                    )}
                                </div>

                                {/* Konfirmasi Password */}
                                <div className="space-y-1.5">
                                    <label
                                        htmlFor="password_confirmation"
                                        className="block text-sm font-medium text-slate-700"
                                    >
                                        Konfirmasi Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        placeholder="Ulangi password"
                                        {...register('password_confirmation')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'placeholder:text-slate-400',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            errors.password_confirmation
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-xs text-red-600">{errors.password_confirmation.message}</p>
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
                                        {...register('role')}
                                        className={cn(
                                            'block w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            errors.role
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
                                    {errors.role && (
                                        <p className="text-xs text-red-600">{errors.role.message}</p>
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
                                                setValue('unit_id', val ? Number(val) : undefined);
                                            }}
                                            placeholder="Pilih unit..."
                                            searchPlaceholder="Cari unit..."
                                        />
                                    )}
                                    <p className="text-xs text-slate-500">
                                        Pilih unit jika pengguna merupakan bagian dari unit tertentu
                                    </p>
                                    {errors.unit_id && (
                                        <p className="text-xs text-red-600">{errors.unit_id.message}</p>
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
                                disabled={isSubmitting || createUser.isPending}
                                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                            >
                                {createUser.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {createUser.isPending ? 'Menyimpan...' : 'Simpan Pengguna'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </PageTransition>
    );
}
