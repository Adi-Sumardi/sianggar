<?php

declare(strict_types=1);

use App\Enums\UserRole;

describe('UserRole Enum', function () {
    describe('isUnit', function () {
        it('returns true for unit roles', function () {
            expect(UserRole::PG->isUnit())->toBeTrue();
            expect(UserRole::RA->isUnit())->toBeTrue();
            expect(UserRole::TK->isUnit())->toBeTrue();
            expect(UserRole::SD->isUnit())->toBeTrue();
            expect(UserRole::SMP12->isUnit())->toBeTrue();
            expect(UserRole::SMP55->isUnit())->toBeTrue();
            expect(UserRole::SMA33->isUnit())->toBeTrue();
        });

        it('returns false for non-unit roles', function () {
            expect(UserRole::Admin->isUnit())->toBeFalse();
            expect(UserRole::Direktur->isUnit())->toBeFalse();
            expect(UserRole::Ketum->isUnit())->toBeFalse();
            expect(UserRole::Keuangan->isUnit())->toBeFalse();
            expect(UserRole::Asrama->isUnit())->toBeFalse();
        });
    });

    describe('isSubstansi', function () {
        it('returns true for substansi roles', function () {
            expect(UserRole::Asrama->isSubstansi())->toBeTrue();
            expect(UserRole::Laz->isSubstansi())->toBeTrue();
            expect(UserRole::Litbang->isSubstansi())->toBeTrue();
            expect(UserRole::Stebank->isSubstansi())->toBeTrue();
            expect(UserRole::StaffDirektur->isSubstansi())->toBeTrue();
            expect(UserRole::StaffSekretariat->isSubstansi())->toBeTrue();
            expect(UserRole::SDM->isSubstansi())->toBeTrue();
            expect(UserRole::Umum->isSubstansi())->toBeTrue();
        });

        it('returns false for non-substansi roles', function () {
            expect(UserRole::Admin->isSubstansi())->toBeFalse();
            expect(UserRole::SD->isSubstansi())->toBeFalse();
            expect(UserRole::Direktur->isSubstansi())->toBeFalse();
            expect(UserRole::Ketum->isSubstansi())->toBeFalse();
        });
    });

    describe('isApprover', function () {
        it('returns true for approver roles', function () {
            expect(UserRole::Direktur->isApprover())->toBeTrue();
            expect(UserRole::Ketum->isApprover())->toBeTrue();
            expect(UserRole::Sekretaris->isApprover())->toBeTrue();
            expect(UserRole::Bendahara->isApprover())->toBeTrue();
            expect(UserRole::Keuangan->isApprover())->toBeTrue();
            expect(UserRole::Kasir->isApprover())->toBeTrue();
            expect(UserRole::Payment->isApprover())->toBeTrue();
            expect(UserRole::StaffKeuangan->isApprover())->toBeTrue();
            expect(UserRole::KabagSdmUmum->isApprover())->toBeTrue();
            expect(UserRole::StaffDirektur->isApprover())->toBeTrue();
        });

        it('returns false for non-approver roles', function () {
            expect(UserRole::SD->isApprover())->toBeFalse();
            expect(UserRole::SMP12->isApprover())->toBeFalse();
            expect(UserRole::Asrama->isApprover())->toBeFalse();
        });
    });

    describe('canCreateProposal', function () {
        it('returns true for admin', function () {
            expect(UserRole::Admin->canCreateProposal())->toBeTrue();
        });

        it('returns true for unit roles', function () {
            expect(UserRole::SD->canCreateProposal())->toBeTrue();
            expect(UserRole::SMP12->canCreateProposal())->toBeTrue();
            expect(UserRole::SMA33->canCreateProposal())->toBeTrue();
        });

        it('returns true for substansi roles', function () {
            expect(UserRole::Asrama->canCreateProposal())->toBeTrue();
            expect(UserRole::Laz->canCreateProposal())->toBeTrue();
        });

        it('returns false for approver-only roles', function () {
            expect(UserRole::Direktur->canCreateProposal())->toBeFalse();
            expect(UserRole::Ketum->canCreateProposal())->toBeFalse();
            expect(UserRole::Keuangan->canCreateProposal())->toBeFalse();
        });
    });

    describe('canCreateLpj', function () {
        it('returns true for admin', function () {
            expect(UserRole::Admin->canCreateLpj())->toBeTrue();
        });

        it('returns true for unit roles', function () {
            expect(UserRole::SD->canCreateLpj())->toBeTrue();
            expect(UserRole::SMP12->canCreateLpj())->toBeTrue();
        });

        it('returns false for substansi roles', function () {
            expect(UserRole::Asrama->canCreateLpj())->toBeFalse();
            expect(UserRole::Laz->canCreateLpj())->toBeFalse();
        });

        it('returns false for approver roles', function () {
            expect(UserRole::Direktur->canCreateLpj())->toBeFalse();
            expect(UserRole::Ketum->canCreateLpj())->toBeFalse();
        });
    });

    describe('dashboardType', function () {
        it('returns admin for Admin role', function () {
            expect(UserRole::Admin->dashboardType())->toBe('admin');
        });

        it('returns unit for unit roles', function () {
            expect(UserRole::SD->dashboardType())->toBe('unit');
            expect(UserRole::SMP12->dashboardType())->toBe('unit');
        });

        it('returns kasir for Kasir role', function () {
            expect(UserRole::Kasir->dashboardType())->toBe('kasir');
        });

        it('returns payment for Payment role', function () {
            expect(UserRole::Payment->dashboardType())->toBe('payment');
        });

        it('returns finance for finance-related roles', function () {
            expect(UserRole::Keuangan->dashboardType())->toBe('finance');
            expect(UserRole::StaffKeuangan->dashboardType())->toBe('finance');
            expect(UserRole::Bendahara->dashboardType())->toBe('finance');
            expect(UserRole::Akuntansi->dashboardType())->toBe('finance');
        });

        it('returns leadership for leadership roles', function () {
            expect(UserRole::Direktur->dashboardType())->toBe('leadership');
            expect(UserRole::Ketum->dashboardType())->toBe('leadership');
            expect(UserRole::Ketua1->dashboardType())->toBe('leadership');
        });
    });

    describe('canViewAllData', function () {
        it('returns true for Admin', function () {
            expect(UserRole::Admin->canViewAllData())->toBeTrue();
        });

        it('returns true for approver roles', function () {
            expect(UserRole::Direktur->canViewAllData())->toBeTrue();
            expect(UserRole::Ketum->canViewAllData())->toBeTrue();
            expect(UserRole::Keuangan->canViewAllData())->toBeTrue();
        });

        it('returns false for unit roles', function () {
            expect(UserRole::SD->canViewAllData())->toBeFalse();
            expect(UserRole::SMP12->canViewAllData())->toBeFalse();
        });
    });

    describe('shouldFilterByOwnData', function () {
        it('returns true for unit roles', function () {
            expect(UserRole::SD->shouldFilterByOwnData())->toBeTrue();
            expect(UserRole::SMP12->shouldFilterByOwnData())->toBeTrue();
        });

        it('returns true for substansi roles', function () {
            expect(UserRole::Asrama->shouldFilterByOwnData())->toBeTrue();
            expect(UserRole::Laz->shouldFilterByOwnData())->toBeTrue();
        });

        it('returns false for Admin', function () {
            expect(UserRole::Admin->shouldFilterByOwnData())->toBeFalse();
        });

        it('returns false for approver roles', function () {
            expect(UserRole::Direktur->shouldFilterByOwnData())->toBeFalse();
            expect(UserRole::Ketum->shouldFilterByOwnData())->toBeFalse();
        });
    });

    describe('labels', function () {
        it('returns correct labels for key roles', function () {
            expect(UserRole::Admin->label())->toBe('Administrator');
            expect(UserRole::Direktur->label())->toBe('Direktur');
            expect(UserRole::Ketum->label())->toBe('Ketua Umum');
            expect(UserRole::Ketua1->label())->toBe('Wakil Ketua');
            expect(UserRole::Sekretaris->label())->toBe('Sekretaris');
            expect(UserRole::Bendahara->label())->toBe('Bendahara');
            expect(UserRole::Keuangan->label())->toBe('Keuangan');
            expect(UserRole::SD->label())->toBe('SD');
            expect(UserRole::SMP12->label())->toBe('SMP 12');
        });
    });
});
