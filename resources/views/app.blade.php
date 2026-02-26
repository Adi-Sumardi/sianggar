<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#2563EB">
        <meta name="description" content="SIANGGAR - Sistem Informasi Pengajuan Anggaran">

        <!-- iOS PWA -->
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="SIANGGAR">

        <title>SIANGGAR - Sistem Informasi Pengajuan Anggaran</title>

        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" sizes="512x512" href="/logo/logo-sianggar.png">
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">
        <link rel="manifest" href="/build/manifest.webmanifest">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body class="bg-background text-foreground antialiased" style="background:#fff">
        <div id="root">
            {{-- Inline splash — shown instantly before React mounts --}}
            <div id="splash" style="display:flex;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;flex-direction:column;gap:16px;background:#fff">
                <img src="/pwa-192x192.png" alt="" width="72" height="72" style="border-radius:16px">
                <div style="color:#2563EB;font-size:14px;font-weight:600;font-family:system-ui,sans-serif;letter-spacing:0.5px">SIANGGAR</div>
            </div>
        </div>
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/build/sw.js', { scope: '/' });
                });
            }
        </script>
    </body>
</html>
