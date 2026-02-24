import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { fadeIn } from '@/lib/animations';
import type { User } from '@/types/models';

interface ApiErrorResponse {
    message?: string;
}

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email wajib diisi')
        .email('Format email tidak valid'),
    password: z
        .string()
        .min(6, 'Password minimal 6 karakter'),
    remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Decorative background component for the left panel
// ---------------------------------------------------------------------------

function DecorativeBackground() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Large circle top-right */}
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-white/10" />
            <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full border border-white/5" />

            {/* Circle bottom-left */}
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full border border-white/10" />
            <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full border border-white/[0.07]" />

            {/* Small circles scattered */}
            <div className="absolute left-1/4 top-1/3 h-3 w-3 rounded-full bg-white/20" />
            <div className="absolute left-2/3 top-1/4 h-2 w-2 rounded-full bg-white/15" />
            <div className="absolute left-1/3 top-2/3 h-4 w-4 rounded-full bg-white/10" />
            <div className="absolute left-3/4 top-3/4 h-2.5 w-2.5 rounded-full bg-white/15" />

            {/* Diagonal lines */}
            <div className="absolute left-0 top-1/2 h-px w-full -rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute left-0 top-1/3 h-px w-full rotate-6 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
            <div className="absolute left-0 top-3/4 h-px w-full -rotate-3 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

            {/* Grid dots pattern */}
            <svg
                className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.08]"
                width="120"
                height="120"
                viewBox="0 0 120 120"
            >
                {Array.from({ length: 36 }, (_, i) => (
                    <circle
                        key={i}
                        cx={(i % 6) * 24 + 12}
                        cy={Math.floor(i / 6) * 24 + 12}
                        r="2"
                        fill="white"
                    />
                ))}
            </svg>

            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-900/30 to-transparent" />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Login page component
// ---------------------------------------------------------------------------

export default function Login() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setUser } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            remember: false,
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            const response = await api.post<{ data: { user: User } }>('/auth/login', {
                email: data.email,
                password: data.password,
                remember: data.remember ?? false,
            });

            // Clear any cached auth data from previous session
            queryClient.removeQueries();

            setUser(response.data.data.user);
            toast.success('Login berhasil', {
                description: 'Selamat datang kembali!',
            });
            navigate('/dashboard');
        } catch (error) {
            let message = 'Email atau password salah. Silakan coba lagi.';

            if (error instanceof AxiosError && error.response?.data) {
                const errorData = error.response.data as ApiErrorResponse;
                message = errorData.message ?? message;
            }

            toast.error('Login gagal', { description: message });
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* -------------------------------------------------------------- */}
            {/* Left panel - Blue gradient (hidden on mobile)                   */}
            {/* -------------------------------------------------------------- */}
            <div className="relative hidden w-1/2 lg:flex lg:flex-col lg:items-center lg:justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
                <DecorativeBackground />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="relative z-10 px-16 text-center"
                >
                    {/* Logo mark */}
                    <div className="mx-auto mb-8 flex justify-center">
                        <img
                            src="/logo/logo-sianggar.png"
                            alt="SIANGGAR"
                            className="h-40 w-40 object-contain"
                        />
                    </div>

                    <h1 className="text-4xl font-bold tracking-tight text-white xl:text-5xl">
                        SIANGGAR
                    </h1>

                    <p className="mt-3 text-lg font-medium text-white/70">
                        Sistem Informasi Pengajuan Anggaran
                    </p>

                    <div className="mx-auto mt-8 h-px w-24 bg-white/20" />

                    <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-white/60">
                        Sistem pengelolaan anggaran terpadu untuk yayasan
                        pendidikan. Kelola pengajuan, persetujuan, dan
                        pelaporan anggaran dalam satu platform.
                    </p>
                </motion.div>

                {/* Footer on left panel */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="absolute bottom-6 text-xs text-white/40"
                >
                    &copy; {new Date().getFullYear()} SIANGGAR. All rights reserved.
                </motion.p>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Right panel - Login form                                        */}
            {/* -------------------------------------------------------------- */}
            <div className="flex w-full flex-col lg:w-1/2">
                {/* Mobile header strip */}
                <div className="flex flex-col items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 lg:hidden">
                    <img
                        src="/logo/logo-sianggar.png"
                        alt="SIANGGAR"
                        className="h-20 w-20 object-contain"
                    />
                    <div className="text-center">
                        <h1 className="text-xl font-bold text-white">SIANGGAR</h1>
                        <p className="text-xs text-white/60">
                            Sistem Informasi Pengajuan Anggaran
                        </p>
                    </div>
                </div>

                {/* Form container */}
                <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 sm:px-12">
                    <motion.div
                        {...fadeIn}
                        transition={{ duration: 0.4 }}
                        className="w-full max-w-md"
                    >
                        {/* Heading */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                                Masuk ke Akun Anda
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                Silakan masuk untuk mengakses sistem
                            </p>
                        </div>

                        {/* Form */}
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-5"
                            noValidate
                        >
                            {/* Email field */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                        <Mail className="h-4.5 w-4.5 text-slate-400" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="nama@email.com"
                                        className={cn(
                                            'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400',
                                            'transition-colors duration-150',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            errors.email
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-500">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password field */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-1.5 block text-sm font-medium text-slate-700"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                                        <Lock className="h-4.5 w-4.5 text-slate-400" />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        placeholder="Masukkan password"
                                        className={cn(
                                            'block w-full rounded-lg border bg-white py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400',
                                            'transition-colors duration-150',
                                            'focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                                            errors.password
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                                                : 'border-slate-300',
                                        )}
                                        {...register('password')}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 transition-colors hover:text-slate-600"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4.5 w-4.5" />
                                        ) : (
                                            <Eye className="h-4.5 w-4.5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-500">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Remember me */}
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-0"
                                    {...register('remember')}
                                />
                                <label
                                    htmlFor="remember"
                                    className="ml-2 text-sm text-slate-600"
                                >
                                    Ingat Saya
                                </label>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={cn(
                                    'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm',
                                    'transition-all duration-150',
                                    'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
                                    'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2',
                                    'disabled:cursor-not-allowed disabled:opacity-60',
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <span>Masuk</span>
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <p className="mt-8 text-center text-xs text-slate-400">
                            &copy; {new Date().getFullYear()} SIANGGAR &mdash; Sistem Informasi Pengajuan Anggaran
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
