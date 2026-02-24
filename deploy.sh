#!/bin/bash
set -e

# SIANGGAR Deploy Script
# Dijalankan via SSH oleh GitHub Actions setelah file upload selesai

APP_PATH="/home/u300093989/sianggar"

cd "$APP_PATH"

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Caching configuration..."
php artisan config:cache

echo "==> Caching routes..."
php artisan route:cache

echo "==> Caching views..."
php artisan view:cache

echo "==> Caching events..."
php artisan event:cache

echo "==> Creating storage link (if not exists)..."
if [ ! -L "/home/u300093989/public_html/storage" ]; then
    ln -s "$APP_PATH/storage/app/public" "/home/u300093989/public_html/storage"
    echo "    Storage link created."
else
    echo "    Storage link already exists."
fi

echo "==> Deploy complete!"
