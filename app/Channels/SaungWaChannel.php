<?php

declare(strict_types=1);

namespace App\Channels;

use App\Services\SaungWaService;
use Illuminate\Notifications\Notification;

class SaungWaChannel
{
    public function __construct(
        protected SaungWaService $saungWa,
    ) {}

    /**
     * Send the given notification via SaungWA WhatsApp.
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

        $this->saungWa->send($phone, $message);
    }
}