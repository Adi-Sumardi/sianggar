<?php

/**
 * Deploy Webhook
 *
 * Triggered by GitHub Actions after FTP upload to run artisan commands.
 * Protected by a secret token stored in .env (DEPLOY_TOKEN).
 */

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Determine app path (shared hosting: ../sianggar/)
$appPath = dirname(__DIR__) . '/sianggar';
$envFile = $appPath . '/.env';

if (!file_exists($envFile)) {
    http_response_code(500);
    exit('App not configured');
}

// Read DEPLOY_TOKEN from .env
$envContent = file_get_contents($envFile);
$expectedToken = '';
if (preg_match('/^DEPLOY_TOKEN=(.+)$/m', $envContent, $matches)) {
    $expectedToken = trim($matches[1]);
}

if (empty($expectedToken)) {
    http_response_code(500);
    exit('Deploy token not configured');
}

// Verify token
$providedToken = $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '';
if (!hash_equals($expectedToken, $providedToken)) {
    http_response_code(403);
    exit('Forbidden');
}

// Run artisan commands
chdir($appPath);

$commands = [
    'php artisan migrate --force',
    'php artisan config:cache',
    'php artisan route:cache',
    'php artisan view:cache',
    'php artisan event:cache',
];

header('Content-Type: text/plain');

$allSuccess = true;
foreach ($commands as $cmd) {
    $cmdOutput = [];
    $exitCode = 0;
    exec($cmd . ' 2>&1', $cmdOutput, $exitCode);

    echo "$ {$cmd}\n";
    echo implode("\n", $cmdOutput) . "\n";
    echo "Exit: {$exitCode}\n\n";

    if ($exitCode !== 0) {
        $allSuccess = false;
    }
}

// Create storage link if not exists
$publicPath = dirname(__DIR__) . '/public_html';
$storageLink = $publicPath . '/storage';
if (!is_link($storageLink)) {
    $target = $appPath . '/storage/app/public';
    if (symlink($target, $storageLink)) {
        echo "$ storage link created\n";
    } else {
        echo "$ storage link failed (create manually)\n";
    }
} else {
    echo "$ storage link already exists\n";
}

if (!$allSuccess) {
    http_response_code(500);
    echo "\nDeploy completed with errors.\n";
} else {
    echo "\nDeploy completed successfully.\n";
}
