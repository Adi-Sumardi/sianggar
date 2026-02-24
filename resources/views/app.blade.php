<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="theme-color" content="#2563EB">
        <meta name="description" content="SIANGGAR - Sistem Informasi Pengajuan Anggaran">

        <title>SIANGGAR - Sistem Informasi Pengajuan Anggaran</title>

        <link rel="icon" href="/logo/logo-sianggar.png" type="image/png">
        <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body class="bg-background text-foreground antialiased">
        <div id="root"></div>
    </body>
</html>
