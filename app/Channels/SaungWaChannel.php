<?php

declare(strict_types=1);

namespace App\Channels;

use App\Services\WhatsappService;
use Illuminate\Notifications\Notification;

/**
 * Channel notifikasi WhatsApp. Pengiriman didelegasikan ke WhatsappService
 * yang memakai Watzap sebagai default dan fallback ke SaungWA bila gagal.
 *
 * Nama kelas & hook (routeNotificationFor('saungwa'), toSaungWa) dipertahankan
 * agar notifikasi yang sudah ada tidak perlu diubah.
 */
class SaungWaChannel
{
    public function __construct(
        protected WhatsappService $whatsapp,
    ) {}

    /**
     * Send the given notification via WhatsApp (Watzap default, SaungWA fallback).
     */
    public function send(object $notifiable, Notification $notification): void
    {
        $phone = $notifiable->routeNotificationFor('saungwa', $notification);

        if (empty($phone)) {
            return;
        }

        if (! method_exists($notification, 'toSaungWa')) {
            return;
        }

        $message = $notification->toSaungWa($notifiable);

        if (empty($message)) {
            return;
        }

        $this->whatsapp->send($phone, $message);
    }
}