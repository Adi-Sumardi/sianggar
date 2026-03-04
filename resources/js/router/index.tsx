import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PermissionGuard } from './PermissionGuard';
import { AppLayout } from '@/components/layout/AppLayout';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Permission } from '@/types/permissions';

// =============================================================================
// Lazy-loaded pages
// =============================================================================

// Auth
const Login = lazy(() => import('@/pages/auth/Login'));

// Dashboard
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));

// Admin -- Users
const UserList = lazy(() => import('@/pages/admin/users/UserList'));
const UserCreate = lazy(() => import('@/pages/admin/users/UserCreate'));
const UserEdit = lazy(() => import('@/pages/admin/users/UserEdit'));

// Admin -- Units
const UnitList = lazy(() => import('@/pages/admin/units/UnitList'));

// Admin -- Roles & Permissions
const RoleList = lazy(() => import('@/pages/admin/roles/RoleList'));
const PermissionList = lazy(() => import('@/pages/admin/permissions/PermissionList'));

// Budget
const MataAnggaranList = lazy(() => import('@/pages/budget/mata-anggaran/MataAnggaranList'));
const MataAnggaranCreate = lazy(() => import('@/pages/budget/mata-anggaran/MataAnggaranCreate'));
const MataAnggaranEdit = lazy(() => import('@/pages/budget/mata-anggaran/MataAnggaranEdit'));
const MataAnggaranDetail = lazy(() => import('@/pages/budget/mata-anggaran/MataAnggaranDetail'));
const ApbsList = lazy(() => import('@/pages/budget/apbs/ApbsList'));
const ApbsDetail = lazy(() => import('@/pages/budget/apbs/ApbsDetail'));
const RapbsList = lazy(() => import('@/pages/budget/rapbs/RapbsList'));
const CoaList = lazy(() => import('@/pages/budget/coa/CoaList'));
const CoaCreate = lazy(() => import('@/pages/budget/coa/CoaCreate'));

// Proposals (Pengajuan)
const PengajuanList = lazy(() => import('@/pages/proposal/PengajuanList'));
const PengajuanCreate = lazy(() => import('@/pages/proposal/PengajuanCreate'));
const PengajuanDetail = lazy(() => import('@/pages/proposal/PengajuanDetail'));
const PengajuanEdit = lazy(() => import('@/pages/proposal/PengajuanEdit'));
const PengajuanRevise = lazy(() => import('@/pages/proposal/PengajuanRevise'));
const ApprovalQueue = lazy(() => import('@/pages/proposal/ApprovalQueue'));
const ApprovalDetail = lazy(() => import('@/pages/proposal/ApprovalDetail'));
const VoucherHistory = lazy(() => import('@/pages/proposal/VoucherHistory'));
const PaymentHistory = lazy(() => import('@/pages/proposal/PaymentHistory'));
const PerubahanList = lazy(() => import('@/pages/proposal/PerubahanList'));

// Perubahan Anggaran (Budget Transfer)
const PerubahanAnggaranList = lazy(() => import('@/pages/perubahan-anggaran/PerubahanAnggaranList'));
const PerubahanAnggaranCreate = lazy(() => import('@/pages/perubahan-anggaran/PerubahanAnggaranCreate'));
const PerubahanAnggaranDetail = lazy(() => import('@/pages/perubahan-anggaran/PerubahanAnggaranDetail'));

// LPJ & Reports
const LpjList = lazy(() => import('@/pages/report/LpjList'));
const LpjCreate = lazy(() => import('@/pages/report/LpjCreate'));
const LpjDetail = lazy(() => import('@/pages/report/LpjDetail'));
const LaporanPengajuan = lazy(() => import('@/pages/report/LaporanPengajuan'));
const LaporanSemester = lazy(() => import('@/pages/report/LaporanSemester'));
const LaporanAccounting = lazy(() => import('@/pages/report/LaporanAccounting'));

// Planning
const StrategyList = lazy(() => import('@/pages/planning/StrategyList'));
const IndicatorList = lazy(() => import('@/pages/planning/IndicatorList'));
const ProkerList = lazy(() => import('@/pages/planning/ProkerList'));
const ActivityList = lazy(() => import('@/pages/planning/ActivityList'));
const PktList = lazy(() => import('@/pages/planning/PktList'));
const PktCreate = lazy(() => import('@/pages/planning/PktCreate'));
const PktEdit = lazy(() => import('@/pages/planning/PktEdit'));
const RapbsApprovalQueue = lazy(() => import('@/pages/planning/RapbsApprovalQueue'));
const RapbsDetail = lazy(() => import('@/pages/planning/RapbsDetail'));

// Communication
const EmailList = lazy(() => import('@/pages/communication/EmailList'));
const EmailCreate = lazy(() => import('@/pages/communication/EmailCreate'));
const EmailDetail = lazy(() => import('@/pages/communication/EmailDetail'));

// Settings
const Settings = lazy(() => import('@/pages/settings/Settings'));

// =============================================================================
// Router
// =============================================================================

export function AppRouter() {
    return (
        <ErrorBoundary>
        <Suspense fallback={null}>
            <Routes>
                {/* ---- Public routes ---- */}
                <Route path="/login" element={<Login />} />

                {/* ---- Authenticated routes ---- */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Redirect root to dashboard */}
                    <Route index element={<Navigate to="/dashboard" replace />} />

                    {/* Dashboard */}
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* Settings - accessible by all authenticated users */}
                    <Route path="settings" element={<Settings />} />

                    {/* ---- Admin ---- */}
                    <Route
                        path="admin/users"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_USERS]}>
                                <UserList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="admin/users/create"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_USERS]}>
                                <UserCreate />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="admin/users/:id/edit"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_USERS]}>
                                <UserEdit />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="admin/units"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_UNITS]}>
                                <UnitList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="admin/roles"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_USERS]}>
                                <RoleList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="admin/permissions"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_USERS]}>
                                <PermissionList />
                            </PermissionGuard>
                        }
                    />

                    {/* ---- Budget ---- */}
                    <Route
                        path="budget/mata-anggaran"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_BUDGET]}>
                                <MataAnggaranList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/mata-anggaran/create"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_BUDGET]}>
                                <MataAnggaranCreate />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/mata-anggaran/:id/edit"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_BUDGET]}>
                                <MataAnggaranEdit />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/mata-anggaran/:id"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_BUDGET]}>
                                <MataAnggaranDetail />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/apbs"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_BUDGET]}>
                                <ApbsList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/apbs/:id"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_BUDGET]}>
                                <ApbsDetail />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/rapbs"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_BUDGET]}>
                                <RapbsList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/coa"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_BUDGET]}>
                                <CoaList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="budget/coa/create"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_BUDGET]}>
                                <CoaCreate />
                            </PermissionGuard>
                        }
                    />

                    {/* ---- Proposals (Pengajuan) ---- */}
                    <Route
                        path="pengajuan"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_PROPOSALS]}>
                                <PengajuanList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="pengajuan/create"
                        element={
                            <PermissionGuard permissions={[Permission.CREATE_PROPOSAL]}>
                                <PengajuanCreate />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="pengajuan/:id"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_PROPOSALS]}>
                                <PengajuanDetail />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="pengajuan/:id/edit"
                        element={
                            <PermissionGuard permissions={[Permission.CREATE_PROPOSAL]}>
                                <PengajuanEdit />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="pengajuan/:id/revise"
                        element={
                            <PermissionGuard permissions={[Permission.CREATE_PROPOSAL]}>
                                <PengajuanRevise />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="approvals"
                        element={
                            <PermissionGuard permissions={[Permission.APPROVE_PROPOSALS]}>
                                <ApprovalQueue />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="approvals/:id"
                        element={
                            <PermissionGuard permissions={[Permission.APPROVE_PROPOSALS]}>
                                <ApprovalDetail />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="voucher-history"
                        element={
                            <PermissionGuard permissions={[Permission.APPROVE_PROPOSALS]}>
                                <VoucherHistory />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="payment-history"
                        element={
                            <PermissionGuard permissions={[Permission.APPROVE_PROPOSALS]}>
                                <PaymentHistory />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="perubahan"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PERUBAHAN]}>
                                <PerubahanList />
                            </PermissionGuard>
                        }
                    />

                    {/* ---- Perubahan Anggaran (Budget Transfer) ---- */}
                    <Route
                        path="perubahan-anggaran"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_PROPOSALS]}>
                                <PerubahanAnggaranList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="perubahan-anggaran/create"
                        element={
                            <PermissionGuard permissions={[Permission.CREATE_PROPOSAL]}>
                                <PerubahanAnggaranCreate />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="perubahan-anggaran/:id"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_PROPOSALS]}>
                                <PerubahanAnggaranDetail />
                            </PermissionGuard>
                        }
                    />

                    {/* ---- LPJ & Reports ---- */}
                    <Route
                        path="lpj"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_REPORTS]}>
                                <LpjList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="lpj/create"
                        element={
                            <PermissionGuard permissions={[Permission.CREATE_LPJ]}>
                                <LpjCreate />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="lpj/:id"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_REPORTS]}>
                                <LpjDetail />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="laporan/pengajuan"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_REPORTS]}>
                                <LaporanPengajuan />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="laporan/semester"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_REPORTS]}>
                                <LaporanSemester />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="laporan/accounting"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_REPORTS]}>
                                <LaporanAccounting />
                            </PermissionGuard>
                        }
                    />

                    {/* ---- Planning ---- */}
                    <Route
                        path="planning/strategies"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PLANNING]}>
                                <StrategyList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/indicators"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PLANNING]}>
                                <IndicatorList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/prokers"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PLANNING]}>
                                <ProkerList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/activities"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PLANNING]}>
                                <ActivityList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/pkt"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PLANNING]}>
                                <PktList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/pkt/create"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PLANNING]}>
                                <PktCreate />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/pkt/:id/edit"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_PLANNING]}>
                                <PktEdit />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/rapbs-approvals"
                        element={
                            <PermissionGuard permissions={[Permission.APPROVE_PROPOSALS]}>
                                <RapbsApprovalQueue />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="planning/rapbs/:id"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_BUDGET]}>
                                <RapbsDetail />
                            </PermissionGuard>
                        }
                    />

                    {/* ---- Communication ---- */}
                    <Route
                        path="emails"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_EMAILS]}>
                                <EmailList />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="emails/create"
                        element={
                            <PermissionGuard permissions={[Permission.MANAGE_EMAILS]}>
                                <EmailCreate />
                            </PermissionGuard>
                        }
                    />
                    <Route
                        path="emails/:id"
                        element={
                            <PermissionGuard permissions={[Permission.VIEW_EMAILS]}>
                                <EmailDetail />
                            </PermissionGuard>
                        }
                    />
                </Route>

                {/* Catch-all: redirect unknown routes to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Suspense>
        </ErrorBoundary>
    );
}
