<?php

declare(strict_types=1);

use App\Enums\EmailStatus;
use App\Models\Email;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Email Model', function () {
    describe('attributes', function () {
        it('has fillable attributes', function () {
            $email = Email::factory()->create([
                'name_surat' => 'Surat Undangan',
                'no_surat' => 'SI-001/2025',
                'ditujukan' => 'Kepala Sekolah',
            ]);

            expect($email->name_surat)->toBe('Surat Undangan')
                ->and($email->no_surat)->toBe('SI-001/2025')
                ->and($email->ditujukan)->toBe('Kepala Sekolah');
        });

        it('casts status to EmailStatus enum', function () {
            $email = Email::factory()->create(['status' => 'draft']);

            expect($email->status)->toBeInstanceOf(EmailStatus::class)
                ->and($email->status)->toBe(EmailStatus::Draft);
        });

        it('casts tgl_surat to date', function () {
            $email = Email::factory()->create(['tgl_surat' => '2025-06-15']);

            expect($email->tgl_surat)->toBeInstanceOf(\Carbon\Carbon::class)
                ->and($email->tgl_surat->format('Y-m-d'))->toBe('2025-06-15');
        });
    });

    describe('relationships', function () {
        it('belongs to user', function () {
            $user = User::factory()->create();
            $email = Email::factory()->create(['user_id' => $user->id]);

            expect($email->user)->toBeInstanceOf(User::class)
                ->and($email->user->id)->toBe($user->id);
        });
    });

    describe('scopes', function () {
        beforeEach(function () {
            Email::factory()->draft()->count(3)->create();
            Email::factory()->sent()->count(2)->create();
            Email::factory()->approved()->count(4)->create();
        });

        it('scopes by status', function () {
            $draftEmails = Email::byStatus(EmailStatus::Draft)->get();
            expect($draftEmails)->toHaveCount(3);

            $sentEmails = Email::byStatus(EmailStatus::Sent)->get();
            expect($sentEmails)->toHaveCount(2);
        });

        it('scopes draft emails', function () {
            $drafts = Email::draft()->get();
            expect($drafts)->toHaveCount(3);

            $drafts->each(function ($email) {
                expect($email->status)->toBe(EmailStatus::Draft);
            });
        });

        it('scopes sent emails', function () {
            $sent = Email::sent()->get();
            expect($sent)->toHaveCount(2);

            $sent->each(function ($email) {
                expect($email->status)->toBe(EmailStatus::Sent);
            });
        });
    });

    describe('factory states', function () {
        it('creates draft email', function () {
            $email = Email::factory()->draft()->create();
            expect($email->status)->toBe(EmailStatus::Draft);
        });

        it('creates sent email', function () {
            $email = Email::factory()->sent()->create();
            expect($email->status)->toBe(EmailStatus::Sent);
        });

        it('creates in process email', function () {
            $email = Email::factory()->inProcess()->create();
            expect($email->status)->toBe(EmailStatus::InProcess);
        });

        it('creates approved email', function () {
            $email = Email::factory()->approved()->create();
            expect($email->status)->toBe(EmailStatus::Approved);
        });

        it('creates archived email', function () {
            $email = Email::factory()->archived()->create();
            expect($email->status)->toBe(EmailStatus::Archived)
                ->and($email->status_arsip)->toBeTrue();
        });

        it('creates email needing revision', function () {
            $email = Email::factory()->needsRevision()->create();
            expect($email->status_revisi)->toBeTrue();
        });
    });
});
