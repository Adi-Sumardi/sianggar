<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SaungWaService
{
    private string $appkey;
    private string $authkey;
    private string $endpoint = 'https://app.saungwa.com/api/create-message';

    public function __construct()
    {
        $this->appkey  = config('services.saungwa.appkey', '');
        $this->authkey = config('services.saungwa.authkey', '');
    }

    /**
     * Send a WhatsApp message via SaungWA.
     * Returns true on success, false on failure (non-blocking).
     */
    public function send(string $phone, string $message): bool
    {
        if (empty($this->appkey) || empty($this->authkey)) {
            Log::warning('SaungWA: appkey or authkey not configured');
            return false;
        }

        try {
            $response = Http::timeout(10)->asMultipart()->post($this->endpoint, [
                ['name' => 'appkey',  'contents' => $this->appkey],
                ['name' => 'authkey', 'contents' => $this->authkey],
                ['name' => 'to',      'contents' => $phone],
                ['name' => 'message', 'contents' => $message],
            ]);

            if ($response->successful()) {
                return true;
            }

            Log::warning('SaungWA: failed to send message', [
                'phone'  => $phone,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);

            return false;
        } catch (\Throwable $e) {
            Log::error('SaungWA: exception when sending message', [
                'phone'   => $phone,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }
}