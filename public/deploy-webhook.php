<?php

/**
 * Deploy Webhook
 *
 * Triggered by GitHub Actions after FTP upload of archives.
 * 1. Extracts deploy-app.tar.gz to ../sianggar/
 * 2. Extracts deploy-public.tar.gz to ../public_html/
 * 3. Runs artisan commands (migrate, cache)
 * 4. Cleans up archive files
 *
 * Protected by DEPLOY_TOKEN in .env
 */

set_time_limit(300);

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

$domainPath = dirname(__DIR__);
$appPath = $domainPath . '/sianggar';
$publicPath = $domainPath . '/public_html';
$envFile = $appPath . '/.env';

if (!file_exists($envFile)) {
    http_response_code(500);
    exit('App not configured - .env not found');
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

header('Content-Type: text/plain');
$allSuccess = true;

// Step 1: Extract app archive
$appArchive = $publicPath . '/deploy-app.tar.gz';
if (file_exists($appArchive)) {
    echo "==> Extracting app archive...\n";
    $cmd = "tar xzf " . escapeshellarg($appArchive) . " -C " . escapeshellarg($appPath);
    exec($cmd . ' 2>&1', $output, $exitCode);
    echo implode("\n", $output) . "\n";
    if ($exitCode === 0) {
        echo "    App extracted successfully.\n\n";
        unlink($appArchive);
    } else {
        echo "    ERROR: App extraction failed (exit: {$exitCode})\n\n";
        $allSuccess = false;
    }
    $output = [];
} else {
    echo "==> WARNING: deploy-app.tar.gz not found, skipping extraction.\n\n";
}

// Step 2: Extract public archive
$publicArchive = $publicPath . '/deploy-public.tar.gz';
if (file_exists($publicArchive)) {
    echo "==> Extracting public archive...\n";
    $cmd = "tar xzf " . escapeshellarg($publicArchive) . " -C " . escapeshellarg($publicPath);
    exec($cmd . ' 2>&1', $output, $exitCode);
    echo implode("\n", $output) . "\n";
    if ($exitCode === 0) {
        echo "    Public files extracted successfully.\n\n";
        unlink($publicArchive);
    } else {
        echo "    ERROR: Public extraction failed (exit: {$exitCode})\n\n";
        $allSuccess = false;
    }
    $output = [];
} else {
    echo "==> WARNING: deploy-public.tar.gz not found, skipping extraction.\n\n";
}

// Step 3: Find PHP 8.4 binary (Hostinger CLI defaults to older version)
$phpBin = 'php';
$phpCandidates = [
    '/usr/bin/php8.4',
    '/opt/alt/php84/usr/bin/php',
    '/usr/local/php8.4/bin/php',
    '/opt/cpanel/ea-php84/root/usr/bin/php',
];
foreach ($phpCandidates as $candidate) {
    if (file_exists($candidate)) {
        $phpBin = $candidate;
        break;
    }
}
echo "==> Using PHP binary: {$phpBin}\n";
exec($phpBin . ' -v 2>&1', $phpVersion);
echo "    " . ($phpVersion[0] ?? 'unknown') . "\n\n";
$phpVersion = [];

// Step 4: Run artisan commands
chdir($appPath);

$commands = [
    $phpBin . ' artisan migrate --force',
    $phpBin . ' artisan config:cache',
    $phpBin . ' artisan route:cache',
    $phpBin . ' artisan view:cache',
    $phpBin . ' artisan event:cache',
];

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

// Step 5: Create storage link if not exists
$storageLink = $publicPath . '/storage';
if (!is_link($storageLink)) {
    $target = $appPath . '/storage/app/public';
    if (symlink($target, $storageLink)) {
        echo "==> Storage link created.\n";
    } else {
        echo "==> Storage link failed (create manually).\n";
    }
} else {
    echo "==> Storage link already exists.\n";
}

if (!$allSuccess) {
    http_response_code(500);
    echo "\nDeploy completed with errors.\n";
} else {
    echo "\nDeploy completed successfully.\n";
}
