<?php

use App\Http\Controllers\Api\V1\Admin\PermissionController;
use App\Http\Controllers\Api\V1\Admin\RoleController;
use App\Http\Controllers\Api\V1\Admin\UnitController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Budget\ApbsController;
use App\Http\Controllers\Api\V1\Budget\DetailMataAnggaranController;
use App\Http\Controllers\Api\V1\Budget\JenisMataAnggaranController;
use App\Http\Controllers\Api\V1\Budget\MataAnggaranController;
use App\Http\Controllers\Api\V1\Budget\RapbsApprovalController;
use App\Http\Controllers\Api\V1\Budget\RapbsController;
use App\Http\Controllers\Api\V1\Budget\SubMataAnggaranController;
use App\Http\Controllers\Api\V1\Communication\EmailController;
use App\Http\Controllers\Api\V1\Communication\EmailReplyController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\Planning\ActivityController;
use App\Http\Controllers\Api\V1\Planning\IndicatorController;
use App\Http\Controllers\Api\V1\Planning\PktController;
use App\Http\Controllers\Api\V1\Planning\ProkerController;
use App\Http\Controllers\Api\V1\Planning\StrategyController;
use App\Http\Controllers\Api\V1\Proposal\ApprovalController;
use App\Http\Controllers\Api\V1\Proposal\DiscussionController;
use App\Http\Controllers\Api\V1\Proposal\PengajuanController;
use App\Http\Controllers\Api\V1\Proposal\PerubahanAnggaranController;
use App\Http\Controllers\Api\V1\Proposal\PerubahanController;
use App\Http\Controllers\Api\V1\Proposal\RevisionCommentController;
use App\Http\Controllers\Api\V1\Report\AccountingController;
use App\Http\Controllers\Api\V1\Report\LaporanController;
use App\Http\Controllers\Api\V1\Report\LpjController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - SIANGGAR Application
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api/v1 automatically.
| Public routes are accessible without authentication.
| Protected routes require Sanctum session + Spatie permissions.
|
*/

Route::prefix('v1')->group(function () {

    // =========================================================================
    // Public Routes
    // =========================================================================

    Route::post('auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1'); // Max 5 attempts per minute

    // =========================================================================
    // Authenticated Routes
    // =========================================================================

    Route::middleware('auth:sanctum')->group(function () {

        // ---------------------------------------------------------------------
        // Auth
        // ---------------------------------------------------------------------
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // ---------------------------------------------------------------------
        // Notifications
        // ---------------------------------------------------------------------
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);

        // ---------------------------------------------------------------------
        // Dashboard
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-dashboard')->group(function () {
            Route::get('dashboard/stats', [DashboardController::class, 'stats']);
            Route::get('dashboard/charts', [DashboardController::class, 'charts']);
            Route::get('dashboard/monthly-charts', [DashboardController::class, 'monthlyCharts']);
            Route::get('dashboard/recent-pengajuan', [DashboardController::class, 'recentPengajuan']);
            Route::get('dashboard/status-distribution', [DashboardController::class, 'statusDistribution']);
            Route::get('dashboard/reminder-stats', [DashboardController::class, 'reminderStats']);
        });

        // ---------------------------------------------------------------------
        // Units List (accessible to all authenticated users for filters/dropdowns)
        // ---------------------------------------------------------------------
        Route::get('units/list', [UnitController::class, 'list']);

        // ---------------------------------------------------------------------
        // Admin - User Management
        // ---------------------------------------------------------------------
        Route::middleware('permission:manage-users')->group(function () {
            Route::apiResource('users', UserController::class);
            Route::patch('users/{user}/password', [UserController::class, 'updatePassword']);

            // Role Management
            Route::get('roles/matrix', [RoleController::class, 'matrix']);
            Route::post('roles/{role}/sync-permissions', [RoleController::class, 'syncPermissions']);
            Route::apiResource('roles', RoleController::class);

            // Permission Management
            Route::apiResource('permissions', PermissionController::class);
        });

        // Admin - Unit Management
        Route::middleware('permission:manage-units')->group(function () {
            Route::apiResource('units', UnitController::class);
        });

        // ---------------------------------------------------------------------
        // Budget - Mata Anggaran (hierarchical)
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-budget')->group(function () {
            // Jenis Mata Anggaran (Read)
            Route::get('jenis-mata-anggarans', [JenisMataAnggaranController::class, 'index']);
            Route::get('jenis-mata-anggarans/{jenisMataAnggaran}', [JenisMataAnggaranController::class, 'show']);

            // Mata Anggaran (Read)
            Route::get('mata-anggarans', [MataAnggaranController::class, 'index']);
            Route::get('mata-anggarans/{mataAnggaran}', [MataAnggaranController::class, 'show']);

            // Sub Mata Anggaran (Read) - nested and standalone
            Route::get('mata-anggarans/{mataAnggaran}/sub-mata-anggarans', [SubMataAnggaranController::class, 'index']);
            Route::get('sub-mata-anggarans/{subMataAnggaran}', [SubMataAnggaranController::class, 'show']);

            // Detail Mata Anggaran (Read) - standalone
            Route::get('detail-mata-anggarans', [DetailMataAnggaranController::class, 'index']);
            Route::get('detail-mata-anggarans/{detailMataAnggaran}', [DetailMataAnggaranController::class, 'show']);

            // Budget sufficiency check
            Route::post('budget/check-sufficiency', [DetailMataAnggaranController::class, 'checkBudget']);

            // APBS (read)
            Route::get('apbs', [ApbsController::class, 'index']);
            Route::get('apbs/{apb}', [ApbsController::class, 'show']);

            // RAPBS (read-only)
            Route::get('rapbs', [RapbsController::class, 'index']);
            Route::get('rapbs/rekap/{unit}', [RapbsController::class, 'rekapByUnit']);

            // COA (read)
            Route::get('coa/unit', [AccountingController::class, 'coaByUnit']);
            Route::get('coa/penerimaan', [AccountingController::class, 'indexPenerimaan']);
            Route::get('coa/realisasi', [AccountingController::class, 'indexRealisasi']);

            // COA Export
            Route::get('coa/export/excel', [AccountingController::class, 'exportCoaExcel']);
            Route::get('coa/export/pdf', [AccountingController::class, 'exportCoaPdf']);
        });

        Route::middleware('permission:manage-budget')->group(function () {
            // Jenis Mata Anggaran CUD
            Route::post('jenis-mata-anggarans', [JenisMataAnggaranController::class, 'store']);
            Route::put('jenis-mata-anggarans/{jenisMataAnggaran}', [JenisMataAnggaranController::class, 'update']);
            Route::delete('jenis-mata-anggarans/{jenisMataAnggaran}', [JenisMataAnggaranController::class, 'destroy']);

            // Mata Anggaran CUD
            Route::post('mata-anggarans', [MataAnggaranController::class, 'store']);
            Route::put('mata-anggarans/{mataAnggaran}', [MataAnggaranController::class, 'update']);
            Route::delete('mata-anggarans/{mataAnggaran}', [MataAnggaranController::class, 'destroy']);

            // Mata Anggaran - Budget Comparison Update
            Route::patch('mata-anggarans/{mataAnggaran}/budget-comparison', [RapbsController::class, 'updateBudgetComparison']);

            // Sub Mata Anggaran CUD - standalone routes
            Route::post('sub-mata-anggarans', [SubMataAnggaranController::class, 'store']);
            Route::put('sub-mata-anggarans/{subMataAnggaran}', [SubMataAnggaranController::class, 'update']);
            Route::delete('sub-mata-anggarans/{subMataAnggaran}', [SubMataAnggaranController::class, 'destroy']);

            // Detail Mata Anggaran CUD - standalone routes
            Route::post('detail-mata-anggarans', [DetailMataAnggaranController::class, 'store']);
            Route::put('detail-mata-anggarans/{detailMataAnggaran}', [DetailMataAnggaranController::class, 'update']);
            Route::delete('detail-mata-anggarans/{detailMataAnggaran}', [DetailMataAnggaranController::class, 'destroy']);

            // APBS CUD
            Route::post('apbs', [ApbsController::class, 'store']);
            Route::put('apbs/{apb}', [ApbsController::class, 'update']);
            Route::delete('apbs/{apb}', [ApbsController::class, 'destroy']);

            // COA - Penerimaan CRUD
            Route::post('coa/penerimaan', [AccountingController::class, 'storePenerimaan']);
            Route::put('coa/penerimaan/{penerimaan}', [AccountingController::class, 'updatePenerimaan']);
            Route::delete('coa/penerimaan/{penerimaan}', [AccountingController::class, 'destroyPenerimaan']);

            // COA - Realisasi CRUD
            Route::post('coa/realisasi', [AccountingController::class, 'storeRealisasi']);
            Route::put('coa/realisasi/{realisasi}', [AccountingController::class, 'updateRealisasi']);
            Route::delete('coa/realisasi/{realisasi}', [AccountingController::class, 'destroyRealisasi']);
        });

        // ---------------------------------------------------------------------
        // Proposals - Pengajuan Anggaran
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-proposals')->group(function () {
            Route::get('pengajuan', [PengajuanController::class, 'index']);
            Route::get('pengajuan/available-for-lpj', [PengajuanController::class, 'availableForLpj']);
            Route::get('pengajuan/{pengajuan}', [PengajuanController::class, 'show']);
            Route::get('pengajuan/{pengajuan}/approvals', [PengajuanController::class, 'approvals']);
        });

        Route::middleware('permission:create-proposal')->group(function () {
            Route::post('pengajuan', [PengajuanController::class, 'store']);
            Route::put('pengajuan/{pengajuan}', [PengajuanController::class, 'update']);
            Route::delete('pengajuan/{pengajuan}', [PengajuanController::class, 'destroy']);
            Route::post('pengajuan/{pengajuan}/submit', [PengajuanController::class, 'submit']);
            Route::post('pengajuan/{pengajuan}/resubmit', [PengajuanController::class, 'resubmit']);

            // Attachments
            Route::post('pengajuan/{pengajuan}/attachments', [PengajuanController::class, 'uploadAttachment']);
            Route::delete('pengajuan/{pengajuan}/attachments/{attachment}', [PengajuanController::class, 'deleteAttachment']);
        });

        // Approval Actions
        Route::middleware('permission:approve-proposals')->group(function () {
            Route::get('approval-queue', [ApprovalController::class, 'queue']);
            Route::get('voucher-history', [ApprovalController::class, 'voucherHistory']);
            Route::get('payment-history', [ApprovalController::class, 'paymentHistory']);
            Route::post('pengajuan/{pengajuan}/approve', [ApprovalController::class, 'approve']);
            Route::post('pengajuan/{pengajuan}/revise', [ApprovalController::class, 'revise']);
            Route::post('pengajuan/{pengajuan}/reject', [ApprovalController::class, 'reject']);
            Route::post('pengajuan/{pengajuan}/validate', [ApprovalController::class, 'validateFinance']);
            Route::post('pengajuan/{pengajuan}/edit-amount', [ApprovalController::class, 'editAmount']);
            Route::post('pengajuan/{pengajuan}/print-voucher', [ApprovalController::class, 'printVoucher']);
            Route::post('pengajuan/{pengajuan}/mark-paid', [ApprovalController::class, 'markAsPaid']);

            // Discussion
            Route::get('discussions/active', [DiscussionController::class, 'active']);
            Route::post('pengajuan/{pengajuan}/discussion/open', [DiscussionController::class, 'open']);
            Route::post('pengajuan/{pengajuan}/discussion/close', [DiscussionController::class, 'close']);
            Route::get('pengajuan/{pengajuan}/discussion', [DiscussionController::class, 'messages']);
            Route::post('pengajuan/{pengajuan}/discussion/message', [DiscussionController::class, 'addMessage']);
        });

        // Perubahan (Budget Amendments - legacy)
        Route::middleware('permission:manage-perubahan')->group(function () {
            Route::apiResource('perubahan', PerubahanController::class);
        });

        // ---------------------------------------------------------------------
        // Perubahan Anggaran (Budget Transfer)
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-proposals')->group(function () {
            Route::get('perubahan-anggaran', [PerubahanAnggaranController::class, 'index']);
            Route::get('perubahan-anggaran/{perubahanAnggaran}', [PerubahanAnggaranController::class, 'show']);
            Route::get('perubahan-anggaran/{perubahanAnggaran}/expected-stages', [PerubahanAnggaranController::class, 'expectedStages']);
        });

        Route::middleware('permission:create-proposal')->group(function () {
            Route::post('perubahan-anggaran', [PerubahanAnggaranController::class, 'store']);
            Route::put('perubahan-anggaran/{perubahanAnggaran}', [PerubahanAnggaranController::class, 'update']);
            Route::delete('perubahan-anggaran/{perubahanAnggaran}', [PerubahanAnggaranController::class, 'destroy']);
            Route::post('perubahan-anggaran/{perubahanAnggaran}/submit', [PerubahanAnggaranController::class, 'submit']);
            Route::post('perubahan-anggaran/{perubahanAnggaran}/resubmit', [PerubahanAnggaranController::class, 'resubmit']);

            // Attachments
            Route::post('perubahan-anggaran/{perubahanAnggaran}/attachments', [PerubahanAnggaranController::class, 'uploadAttachment']);
            Route::delete('perubahan-anggaran/{perubahanAnggaran}/attachments/{attachment}', [PerubahanAnggaranController::class, 'deleteAttachment']);
        });

        Route::middleware('permission:approve-proposals')->group(function () {
            Route::get('perubahan-anggaran-queue', [PerubahanAnggaranController::class, 'approvalQueue']);
            Route::post('perubahan-anggaran/{perubahanAnggaran}/approve', [PerubahanAnggaranController::class, 'approve']);
            Route::post('perubahan-anggaran/{perubahanAnggaran}/revise', [PerubahanAnggaranController::class, 'revise']);
            Route::post('perubahan-anggaran/{perubahanAnggaran}/reject', [PerubahanAnggaranController::class, 'reject']);
        });

        // ---------------------------------------------------------------------
        // LPJ (Laporan Pertanggungjawaban)
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-reports')->group(function () {
            Route::get('lpj', [LpjController::class, 'index']);
            Route::get('lpj/stats', [LpjController::class, 'stats']);
            Route::get('lpj/{lpj}', [LpjController::class, 'show']);
            Route::get('lpj/{lpj}/timeline', [LpjController::class, 'timeline']);
        });

        Route::middleware('permission:create-lpj')->group(function () {
            Route::post('lpj', [LpjController::class, 'store']);
            Route::put('lpj/{lpj}', [LpjController::class, 'update']);
            Route::delete('lpj/{lpj}', [LpjController::class, 'destroy']);
            Route::post('lpj/{lpj}/submit', [LpjController::class, 'submit']);
            Route::post('lpj/{lpj}/resubmit', [LpjController::class, 'resubmit']);

            // Attachments
            Route::post('lpj/{lpj}/attachments', [LpjController::class, 'uploadAttachment']);
            Route::delete('lpj/{lpj}/attachments/{attachment}', [LpjController::class, 'deleteAttachment']);
        });

        // LPJ Approval Actions
        Route::middleware('permission:approve-proposals')->group(function () {
            Route::post('lpj/{lpj}/approve', [LpjController::class, 'approve']);
            Route::post('lpj/{lpj}/validate', [LpjController::class, 'validateLpj']);
            Route::post('lpj/{lpj}/revise', [LpjController::class, 'revise']);
            Route::post('lpj/{lpj}/reject', [LpjController::class, 'reject']);
        });

        // ---------------------------------------------------------------------
        // Reports - Laporan
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-reports')->group(function () {
            Route::prefix('laporan')->group(function () {
                Route::get('pengajuan', [LaporanController::class, 'pengajuan']);
                Route::get('cawu-unit', [LaporanController::class, 'cawuUnit']);
                Route::get('cawu-gabungan', [LaporanController::class, 'cawuGabungan']);
                Route::get('accounting', [LaporanController::class, 'accounting']);
                Route::get('export/excel', [LaporanController::class, 'exportExcel']);
                Route::get('export/pdf', [LaporanController::class, 'exportPdf']);
            });
        });

        // ---------------------------------------------------------------------
        // Planning
        // ---------------------------------------------------------------------
        Route::middleware('permission:manage-planning')->group(function () {
            // Import routes (must be before apiResource to avoid wildcard conflicts)
            Route::get('prokers/import-template', [ProkerController::class, 'importTemplate']);
            Route::post('prokers/import', [ProkerController::class, 'import']);
            Route::get('activities/import-template', [ActivityController::class, 'importTemplate']);
            Route::post('activities/import', [ActivityController::class, 'import']);

            Route::apiResource('strategies', StrategyController::class);
            Route::apiResource('indicators', IndicatorController::class);
            Route::apiResource('prokers', ProkerController::class);
            Route::apiResource('activities', ActivityController::class);
            Route::apiResource('pkt', PktController::class);
            Route::post('pkt/{pkt}/submit', [PktController::class, 'submit']);
        });

        // ---------------------------------------------------------------------
        // RAPBS Approval
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-budget')->group(function () {
            Route::get('rapbs-list', [RapbsApprovalController::class, 'index']);
            Route::get('rapbs/{rapbs}/detail', [RapbsApprovalController::class, 'show']);
            Route::get('rapbs/{rapbs}/history', [RapbsApprovalController::class, 'history']);
            Route::post('rapbs/{rapbs}/submit', [RapbsApprovalController::class, 'submit']);
        });

        Route::middleware('permission:approve-proposals')->group(function () {
            Route::get('rapbs-approval/pending', [RapbsApprovalController::class, 'pending']);
            Route::post('rapbs/{rapbs}/approve', [RapbsApprovalController::class, 'approve']);
            Route::post('rapbs/{rapbs}/revise', [RapbsApprovalController::class, 'revise']);
            Route::post('rapbs/{rapbs}/reject', [RapbsApprovalController::class, 'reject']);
        });

        // ---------------------------------------------------------------------
        // Revision Comments (Diskusi Revisi)
        // ---------------------------------------------------------------------
        Route::get('revision-comments/{type}/{id}', [RevisionCommentController::class, 'index']);
        Route::post('revision-comments/{type}/{id}', [RevisionCommentController::class, 'store']);

        // ---------------------------------------------------------------------
        // Communication - Email / Surat
        // ---------------------------------------------------------------------
        Route::middleware('permission:view-emails')->group(function () {
            Route::get('emails', [EmailController::class, 'index']);
            Route::get('emails/recipients', [EmailController::class, 'recipients']);
            Route::get('emails/reminder-stats', [EmailController::class, 'reminderStats']);
            Route::get('emails/{email}', [EmailController::class, 'show']);
            // Reply and archive available to anyone who can view the email
            Route::post('emails/{email}/reply', [EmailReplyController::class, 'store']);
            Route::post('emails/{email}/archive', [EmailController::class, 'archive']);
        });

        Route::middleware('permission:manage-emails')->group(function () {
            Route::post('emails', [EmailController::class, 'store']);
            Route::delete('emails/{email}', [EmailController::class, 'destroy']);
        });
    });
});
