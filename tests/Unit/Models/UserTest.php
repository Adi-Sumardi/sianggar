<?php

declare(strict_types=1);

use App\Enums\UserRole;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('User Model', function () {
    describe('factory', function () {
        it('creates a user with default attributes', function () {
            $user = User::factory()->create();

            expect($user)->toBeInstanceOf(User::class)
                ->and($user->name)->not->toBeEmpty()
                ->and($user->email)->not->toBeEmpty()
                ->and($user->email_verified_at)->not->toBeNull()
                ->and($user->role)->toBe(UserRole::Admin);
        });

        it('creates users with specific roles', function () {
            $staffDirektur = User::factory()->staffDirektur()->create();
            expect($staffDirektur->role)->toBe(UserRole::StaffDirektur);

            $staffKeuangan = User::factory()->staffKeuangan()->create();
            expect($staffKeuangan->role)->toBe(UserRole::StaffKeuangan);

            $direktur = User::factory()->direktur()->create();
            expect($direktur->role)->toBe(UserRole::Direktur);

            $ketum = User::factory()->ketum()->create();
            expect($ketum->role)->toBe(UserRole::Ketum);

            $keuangan = User::factory()->keuangan()->create();
            expect($keuangan->role)->toBe(UserRole::Keuangan);

            $bendahara = User::factory()->bendahara()->create();
            expect($bendahara->role)->toBe(UserRole::Bendahara);

            $kasir = User::factory()->kasir()->create();
            expect($kasir->role)->toBe(UserRole::Kasir);
        });

        it('creates unit user with associated unit', function () {
            $user = User::factory()->unit('sd')->create();

            expect($user->role)->toBe(UserRole::SD)
                ->and($user->unit_id)->not->toBeNull();
        });
    });

    describe('relationships', function () {
        it('belongs to a unit', function () {
            $unit = Unit::factory()->create();
            $user = User::factory()->create(['unit_id' => $unit->id]);

            expect($user->unit)->toBeInstanceOf(Unit::class)
                ->and($user->unit->id)->toBe($unit->id);
        });

        it('can have null unit', function () {
            $user = User::factory()->create(['unit_id' => null]);

            expect($user->unit)->toBeNull();
        });
    });

    describe('hasEnumRole', function () {
        it('returns true when user has the specified role', function () {
            $user = User::factory()->create(['role' => UserRole::Admin->value]);

            expect($user->hasEnumRole(UserRole::Admin))->toBeTrue();
        });

        it('returns false when user does not have the specified role', function () {
            $user = User::factory()->create(['role' => UserRole::Admin->value]);

            expect($user->hasEnumRole(UserRole::Direktur))->toBeFalse();
        });

        it('accepts multiple roles and returns true if any match', function () {
            $user = User::factory()->create(['role' => UserRole::Direktur->value]);

            expect($user->hasEnumRole(UserRole::Admin, UserRole::Direktur, UserRole::Ketum))->toBeTrue();
        });

        it('returns false when none of multiple roles match', function () {
            $user = User::factory()->create(['role' => UserRole::Kasir->value]);

            expect($user->hasEnumRole(UserRole::Admin, UserRole::Direktur))->toBeFalse();
        });
    });

    describe('scopeByRole', function () {
        it('filters users by role', function () {
            User::factory()->create(['role' => UserRole::Admin->value]);
            User::factory()->create(['role' => UserRole::Direktur->value]);
            User::factory()->create(['role' => UserRole::Direktur->value]);
            User::factory()->create(['role' => UserRole::Kasir->value]);

            $direkturs = User::byRole(UserRole::Direktur)->get();

            expect($direkturs)->toHaveCount(2);
            $direkturs->each(fn ($user) => expect($user->role)->toBe(UserRole::Direktur));
        });
    });

    describe('password hashing', function () {
        it('automatically hashes password', function () {
            $user = User::factory()->create(['password' => 'plaintext']);

            expect($user->password)->not->toBe('plaintext');
        });
    });

    describe('hidden attributes', function () {
        it('hides password and remember_token in serialization', function () {
            $user = User::factory()->create();
            $array = $user->toArray();

            expect($array)->not->toHaveKey('password')
                ->and($array)->not->toHaveKey('remember_token');
        });
    });
});
