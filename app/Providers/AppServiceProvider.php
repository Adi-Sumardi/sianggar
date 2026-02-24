<?php

declare(strict_types=1);

namespace App\Providers;

use App\Listeners\LogApprovalAction;
use App\Listeners\NotifyProposalCreator;
use App\Listeners\SendApprovalNotification;
use App\Models\Email;
use App\Models\Lpj;
use App\Models\PengajuanAnggaran;
use App\Policies\EmailPolicy;
use App\Policies\LpjPolicy;
use App\Policies\PengajuanPolicy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // -----------------------------------------------------------------
        // Policy Registration
        //
        // PengajuanAnggaran -> PengajuanPolicy is non-standard naming,
        // so we register it explicitly. Lpj -> LpjPolicy and
        // Email -> EmailPolicy follow convention but are registered
        // explicitly for clarity.
        // -----------------------------------------------------------------
        Gate::policy(PengajuanAnggaran::class, PengajuanPolicy::class);
        Gate::policy(Lpj::class, LpjPolicy::class);
        Gate::policy(Email::class, EmailPolicy::class);

        // -----------------------------------------------------------------
        // Event Subscriber Registration
        //
        // In Laravel 12, simple event-listener pairs are auto-discovered.
        // However, subscriber classes (using the subscribe method) must be
        // registered explicitly.
        //
        // The UpdateBudgetBalance listener uses handle() with a single
        // event, so it will be auto-discovered.
        // -----------------------------------------------------------------
        Event::subscribe(SendApprovalNotification::class);
        Event::subscribe(LogApprovalAction::class);
        Event::subscribe(NotifyProposalCreator::class);
    }
}
