import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        tailwindcss(),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: false,
            includeAssets: ['logo/logo-sianggar.png'],
            manifest: {
                name: 'SIANGGAR - Sistem Informasi Pengajuan Anggaran',
                short_name: 'SIANGGAR',
                description: 'Sistem Pengelolaan Anggaran Terpadu Yayasan Pendidikan',
                theme_color: '#2563EB',
                background_color: '#FFFFFF',
                display: 'standalone',
                orientation: 'any',
                start_url: '/',
                scope: '/',
                icons: [
                    { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
                    { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                navigateFallback: null,
                // Don't cache API responses - always fetch fresh data
                runtimeCaching: [
                    {
                        urlPattern: /^https?:\/\/.*\/api\/v1\//,
                        handler: 'NetworkOnly',
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    server: {
        host: 'localhost',
        cors: true,
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
