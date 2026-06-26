<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Orchestrator pengiriman WhatsApp.
 * Default memakai Watzap; bila gagal/tidak terkonfigurasi, fallback ke SaungWA.
 */
class WhatsappService
{
    public function __construct(
        protected WatzapService $watzap,
        protected SaungWaService $saungWa,
    ) {}

    /**
     * Kirim pesan WhatsApp. Mengembalikan true bila salah satu provider berhasil.
     */
    public function send(string $phone, string $message): bool
    {
        if ($this->watzap->send($phone, $message)) {
            return true;
        }

        Log::info('WhatsApp: Watzap gagal/tidak tersedia, fallback ke SaungWA', [
            'phone' => $phone,
        ]);

        return $this->saungWa->send($phone, $message);
    }
}
