<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\SaungWaService;
use App\Services\WatzapService;
use App\Services\WhatsappService;
use Illuminate\Console\Command;

class TestWhatsapp extends Command
{
    protected $signature = 'wa:test
        {phone : Nomor tujuan (mis. 08xxxxxxxx atau 628xxxxxxxx)}
        {--message= : Isi pesan (opsional)}
        {--provider=auto : auto (Watzap->SaungWA), watzap, atau saungwa}';

    protected $description = 'Kirim pesan WhatsApp uji coba untuk debugging notifikasi.';

    public function handle(): int
    {
        $phone = $this->normalizePhone((string) $this->argument('phone'));
        $message = (string) ($this->option('message')
            ?: "🔔 *SIANGGAR*\nTes notifikasi WhatsApp — " . now()->format('d-m-Y H:i:s'));
        $provider = strtolower((string) $this->option('provider'));

        // Status konfigurasi (tanpa menampilkan nilai rahasia)
        $watzapReady = ! empty(config('services.watzap.api_key')) && ! empty(config('services.watzap.number_key'));
        $saungwaReady = ! empty(config('services.saungwa.appkey')) && ! empty(config('services.saungwa.authkey'));

        $this->info('== Konfigurasi ==');
        $this->line('  Watzap  : ' . ($watzapReady ? 'OK (api_key & number_key terisi)' : 'BELUM (kosong)'));
        $this->line('  SaungWA : ' . ($saungwaReady ? 'OK (appkey & authkey terisi)' : 'BELUM (kosong)'));
        $this->line('  Tujuan  : ' . $phone);
        $this->line('  Provider: ' . $provider);
        $this->newLine();

        $ok = match ($provider) {
            'watzap'  => app(WatzapService::class)->send($phone, $message),
            'saungwa' => app(SaungWaService::class)->send($phone, $message),
            default   => app(WhatsappService::class)->send($phone, $message),
        };

        if ($ok) {
            $this->info('✅ Pesan berhasil dikirim (provider melaporkan sukses).');
        } else {
            $this->error('❌ Gagal mengirim. Cek storage/logs/laravel.log (cari "Watzap"/"SaungWA") untuk detail.');
        }

        return $ok ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Normalisasi nomor ke format internasional 628xxxx.
     */
    private function normalizePhone(string $raw): string
    {
        $phone = preg_replace('/\D/', '', $raw) ?? '';

        if (str_starts_with($phone, '0')) {
            return '62' . substr($phone, 1);
        }

        if (! str_starts_with($phone, '62')) {
            return '62' . $phone;
        }

        return $phone;
    }
}
