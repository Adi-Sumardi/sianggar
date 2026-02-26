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

        {{-- Splash screen styles — in <head> so browser parses before first paint --}}
        <style>
            body{margin:0;background:#f0f6ff}
            #splash{display:flex;align-items:center;justify-content:center;min-height:100vh;min-height:100dvh;flex-direction:column;background:linear-gradient(145deg,#f0f6ff 0%,#e0edff 50%,#f0f6ff 100%);overflow:hidden;position:fixed;inset:0;z-index:9999;transition:opacity .3s ease,visibility .3s ease}
            #splash.hide{opacity:0;visibility:hidden}
            #splash::before{content:'';position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.08) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-55%);animation:sp-glow 2s ease-in-out infinite alternate}
            .sp-logo{width:80px;height:80px;border-radius:20px;box-shadow:0 8px 32px rgba(37,99,235,.18),0 2px 8px rgba(0,0,0,.06);animation:sp-pop .6s cubic-bezier(.34,1.56,.64,1) both;position:relative;z-index:1}
            .sp-title{color:#1e40af;font-size:22px;font-weight:700;font-family:system-ui,-apple-system,sans-serif;letter-spacing:2px;margin-top:20px;animation:sp-fade .5s ease .3s both;position:relative;z-index:1}
            .sp-sub{color:#6b7fa8;font-size:11px;font-family:system-ui,-apple-system,sans-serif;letter-spacing:1.5px;margin-top:4px;animation:sp-fade .5s ease .5s both;position:relative;z-index:1}
            .sp-dots{display:flex;gap:6px;margin-top:32px;animation:sp-fade .5s ease .7s both;position:relative;z-index:1}
            .sp-dot{width:6px;height:6px;border-radius:50%;background:#2563EB;animation:sp-bounce 1.2s ease-in-out infinite}
            .sp-dot:nth-child(2){animation-delay:.15s}
            .sp-dot:nth-child(3){animation-delay:.3s}
            @keyframes sp-pop{0%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}
            @keyframes sp-fade{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:translateY(0)}}
            @keyframes sp-bounce{0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1.2)}}
            @keyframes sp-glow{0%{transform:translate(-50%,-55%) scale(1);opacity:.6}100%{transform:translate(-50%,-55%) scale(1.15);opacity:1}}
        </style>

        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" sizes="512x512" href="/logo/logo-sianggar.png">
        <link rel="icon" type="image/x-icon" href="/favicon.ico">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png">
        <link rel="manifest" href="/build/manifest.webmanifest">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body class="bg-background text-foreground antialiased">
        {{-- Splash overlay — fixed position, removed after React mounts --}}
        <div id="splash">
            <img src="/pwa-192x192.png" alt="" class="sp-logo" width="80" height="80">
            <div class="sp-title">SIANGGAR</div>
            <div class="sp-sub">SISTEM INFORMASI PENGAJUAN ANGGARAN</div>
            <div class="sp-dots"><span class="sp-dot"></span><span class="sp-dot"></span><span class="sp-dot"></span></div>
        </div>

        <div id="root"></div>

        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/build/sw.js', { scope: '/' });
                });
            }
        </script>
    </body>
</html>
