<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WatzapService
{
    private string $apiKey;
    private string $numberKey;
    private string $endpoint = 'https://api.watzap.id/v1/send_message';

    public function __construct()
    {
        $this->apiKey    = (string) config('services.watzap.api_key', '');
        $this->numberKey = (string) config('services.watzap.number_key', '');
    }

    /**
     * Kirim pesan WhatsApp via Watzap.id.
     * Mengembalikan true bila sukses, false bila gagal (non-blocking).
     */
    public function send(string $phone, string $message): bool
    {
        if (empty($this->apiKey) || empty($this->numberKey)) {
            Log::warning('Watzap: api_key atau number_key belum dikonfigurasi');

            return false;
        }

        try {
            $response = Http::timeout(10)->asJson()->post($this->endpoint, [
                'api_key'    => $this->apiKey,
                'number_key' => $this->numberKey,
                'phone_no'   => $phone,
                'message'    => $message,
            ]);

            if ($response->successful()) {
                // Watzap mengembalikan HTTP 200 dengan field "status" saat berhasil.
                $status = strtolower((string) ($response->json('status') ?? ''));

                if ($status === '' || in_array($status, ['200', 'success', 'sent'], true)) {
                    return true;
                }
            }

            Log::warning('Watzap: gagal mengirim pesan', [
                'phone'  => $phone,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('Watzap: exception saat mengirim pesan', [
                'phone'   => $phone,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
