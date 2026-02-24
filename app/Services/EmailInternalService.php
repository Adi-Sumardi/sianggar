<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\EmailStatus;
use App\Models\Email;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EmailInternalService
{
    /**
     * Create a new internal email/surat
     *
     * @param array{
     *     jenis_surat: string,
     *     perihal: string,
     *     isi: string,
     *     tujuan: ?string,
     *     unit: ?string,
     *     tanggal: ?string,
     *     lampiran: ?string,
     *     keterangan: ?string,
     * } $data
     */
    public function create(array $data, User $user): Email
    {
        return DB::transaction(function () use ($data, $user) {
            $noSurat = $this->generateNoSurat();

            $email = Email::create([
                'no_surat' => $noSurat,
                'jenis_surat' => $data['jenis_surat'],
                'perihal' => $data['perihal'],
                'isi' => $data['isi'],
                'tujuan' => $data['tujuan'] ?? null,
                'unit' => $data['unit'] ?? null,
                'tanggal' => $data['tanggal'] ?? now()->toDateString(),
                'lampiran' => $data['lampiran'] ?? null,
                'keterangan' => $data['keterangan'] ?? null,
                'status' => EmailStatus::Draft->value,
                'created_by' => $user->id,
            ]);

            return $email->fresh();
        });
    }

    /**
     * Generate a sequential surat number for internal emails
     * Format: {number}/SRT/{month-roman}/{year}
     */
    public function generateNoSurat(): string
    {
        $currentYear = now()->format('Y');
        $currentMonth = (int) now()->format('m');

        $romanMonths = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV',
            5 => 'V', 6 => 'VI', 7 => 'VII', 8 => 'VIII',
            9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
        ];
        $romanMonth = $romanMonths[$currentMonth];

        // Count existing emails in this year
        $count = Email::whereYear('created_at', $currentYear)->count();
        $nextNumber = str_pad((string) ($count + 1), 3, '0', STR_PAD_LEFT);

        return "{$nextNumber}/SRT/{$romanMonth}/{$currentYear}";
    }

    /**
     * Archive an email (mark as archived)
     */
    public function archive(Email $email): void
    {
        if ($email->status === EmailStatus::Archived->value) {
            throw new \RuntimeException('Email sudah diarsipkan.');
        }

        $email->update([
            'status' => EmailStatus::Archived->value,
            'archived_at' => now(),
        ]);
    }

    /**
     * Send a draft email (mark as sent)
     */
    public function send(Email $email): void
    {
        if ($email->status !== EmailStatus::Draft->value) {
            throw new \RuntimeException('Hanya email berstatus draft yang dapat dikirim.');
        }

        $email->update([
            'status' => EmailStatus::Sent->value,
            'sent_at' => now(),
        ]);
    }

    /**
     * Get emails filtered by status and user
     *
     * @param array{
     *     status?: string,
     *     jenis_surat?: string,
     *     search?: string,
     *     unit?: string,
     * } $filters
     */
    public function getFiltered(array $filters, ?User $user = null): \Illuminate\Support\Collection
    {
        $query = Email::with('creator');

        if ($user !== null) {
            $query->where('created_by', $user->id);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['jenis_surat'])) {
            $query->where('jenis_surat', $filters['jenis_surat']);
        }

        if (!empty($filters['unit'])) {
            $query->where('unit', $filters['unit']);
        }

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('no_surat', 'like', "%{$search}%")
                    ->orWhere('perihal', 'like', "%{$search}%")
                    ->orWhere('tujuan', 'like', "%{$search}%");
            });
        }

        return $query->orderByDesc('created_at')->get();
    }
}
