<?php

declare(strict_types=1);

use App\Enums\RapbsApprovalStage;
use App\Enums\UserRole;

describe('RapbsApprovalStage Enum', function () {
    it('has expected cases', function () {
        $cases = RapbsApprovalStage::cases();

        expect($cases)->toHaveCount(7)
            ->and(RapbsApprovalStage::Direktur->value)->toBe('direktur')
            ->and(RapbsApprovalStage::Sekretariat->value)->toBe('sekretariat')
            ->and(RapbsApprovalStage::Keuangan->value)->toBe('keuangan')
            ->and(RapbsApprovalStage::Sekretaris->value)->toBe('sekretaris')
            ->and(RapbsApprovalStage::WakilKetua->value)->toBe('wakil_ketua')
            ->and(RapbsApprovalStage::Ketum->value)->toBe('ketum')
            ->and(RapbsApprovalStage::Bendahara->value)->toBe('bendahara');
    });

    it('returns correct labels', function () {
        expect(RapbsApprovalStage::Direktur->label())->toBe('Direktur Pendidikan')
            ->and(RapbsApprovalStage::Sekretariat->label())->toBe('Sekretariat')
            ->and(RapbsApprovalStage::Keuangan->label())->toBe('Keuangan')
            ->and(RapbsApprovalStage::Sekretaris->label())->toBe('Sekretaris')
            ->and(RapbsApprovalStage::WakilKetua->label())->toBe('Wakil Ketua')
            ->and(RapbsApprovalStage::Ketum->label())->toBe('Ketua Umum')
            ->and(RapbsApprovalStage::Bendahara->label())->toBe('Bendahara');
    });

    it('returns correct required roles', function () {
        expect(RapbsApprovalStage::Direktur->requiredRole())->toBe(UserRole::Direktur)
            ->and(RapbsApprovalStage::Sekretariat->requiredRole())->toBe(UserRole::Sekretariat)
            ->and(RapbsApprovalStage::Keuangan->requiredRole())->toBe(UserRole::Keuangan)
            ->and(RapbsApprovalStage::Sekretaris->requiredRole())->toBe(UserRole::Sekretaris)
            ->and(RapbsApprovalStage::WakilKetua->requiredRole())->toBe(UserRole::Ketua1)
            ->and(RapbsApprovalStage::Ketum->requiredRole())->toBe(UserRole::Ketum)
            ->and(RapbsApprovalStage::Bendahara->requiredRole())->toBe(UserRole::Bendahara);
    });

    describe('unitFlow', function () {
        it('returns correct stages for unit flow', function () {
            $flow = RapbsApprovalStage::unitFlow();

            expect($flow)->toBeArray()
                ->toHaveCount(6)
                ->and($flow[0])->toBe(RapbsApprovalStage::Direktur)
                ->and($flow[1])->toBe(RapbsApprovalStage::Keuangan)
                ->and($flow[2])->toBe(RapbsApprovalStage::Sekretaris)
                ->and($flow[3])->toBe(RapbsApprovalStage::WakilKetua)
                ->and($flow[4])->toBe(RapbsApprovalStage::Ketum)
                ->and($flow[5])->toBe(RapbsApprovalStage::Bendahara);
        });
    });

    describe('substansiFlow', function () {
        it('returns correct stages for substansi flow', function () {
            $flow = RapbsApprovalStage::substansiFlow();

            expect($flow)->toBeArray()
                ->toHaveCount(6)
                ->and($flow[0])->toBe(RapbsApprovalStage::Sekretariat)
                ->and($flow[1])->toBe(RapbsApprovalStage::Keuangan)
                ->and($flow[2])->toBe(RapbsApprovalStage::Sekretaris)
                ->and($flow[3])->toBe(RapbsApprovalStage::WakilKetua)
                ->and($flow[4])->toBe(RapbsApprovalStage::Ketum)
                ->and($flow[5])->toBe(RapbsApprovalStage::Bendahara);
        });
    });

    describe('getNextStage', function () {
        it('returns next stage for unit flow', function () {
            expect(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Direktur, true))
                ->toBe(RapbsApprovalStage::Keuangan)
                ->and(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Keuangan, true))
                ->toBe(RapbsApprovalStage::Sekretaris)
                ->and(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Sekretaris, true))
                ->toBe(RapbsApprovalStage::WakilKetua)
                ->and(RapbsApprovalStage::getNextStage(RapbsApprovalStage::WakilKetua, true))
                ->toBe(RapbsApprovalStage::Ketum)
                ->and(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Ketum, true))
                ->toBe(RapbsApprovalStage::Bendahara);
        });

        it('returns next stage for substansi flow', function () {
            expect(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Sekretariat, false))
                ->toBe(RapbsApprovalStage::Keuangan)
                ->and(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Keuangan, false))
                ->toBe(RapbsApprovalStage::Sekretaris);
        });

        it('returns null for final stage', function () {
            expect(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Bendahara, true))->toBeNull()
                ->and(RapbsApprovalStage::getNextStage(RapbsApprovalStage::Bendahara, false))->toBeNull();
        });
    });

    describe('getFirstStage', function () {
        it('returns Direktur for unit submitter', function () {
            expect(RapbsApprovalStage::getFirstStage(true))->toBe(RapbsApprovalStage::Direktur);
        });

        it('returns Sekretariat for substansi submitter', function () {
            expect(RapbsApprovalStage::getFirstStage(false))->toBe(RapbsApprovalStage::Sekretariat);
        });
    });

    describe('getOrder', function () {
        it('returns correct order for unit flow', function () {
            expect(RapbsApprovalStage::Direktur->getOrder(true))->toBe(1)
                ->and(RapbsApprovalStage::Keuangan->getOrder(true))->toBe(2)
                ->and(RapbsApprovalStage::Sekretaris->getOrder(true))->toBe(3)
                ->and(RapbsApprovalStage::WakilKetua->getOrder(true))->toBe(4)
                ->and(RapbsApprovalStage::Ketum->getOrder(true))->toBe(5)
                ->and(RapbsApprovalStage::Bendahara->getOrder(true))->toBe(6);
        });

        it('returns correct order for substansi flow', function () {
            expect(RapbsApprovalStage::Sekretariat->getOrder(false))->toBe(1)
                ->and(RapbsApprovalStage::Keuangan->getOrder(false))->toBe(2)
                ->and(RapbsApprovalStage::Sekretaris->getOrder(false))->toBe(3);
        });

        it('returns 0 for stage not in flow', function () {
            expect(RapbsApprovalStage::Sekretariat->getOrder(true))->toBe(0)
                ->and(RapbsApprovalStage::Direktur->getOrder(false))->toBe(0);
        });
    });

    describe('isFinal', function () {
        it('returns true only for Bendahara', function () {
            expect(RapbsApprovalStage::Bendahara->isFinal())->toBeTrue();
        });

        it('returns false for other stages', function () {
            expect(RapbsApprovalStage::Direktur->isFinal())->toBeFalse()
                ->and(RapbsApprovalStage::Sekretariat->isFinal())->toBeFalse()
                ->and(RapbsApprovalStage::Keuangan->isFinal())->toBeFalse()
                ->and(RapbsApprovalStage::Sekretaris->isFinal())->toBeFalse()
                ->and(RapbsApprovalStage::WakilKetua->isFinal())->toBeFalse()
                ->and(RapbsApprovalStage::Ketum->isFinal())->toBeFalse();
        });
    });
});
