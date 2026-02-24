<?php

/**
 * Deploy Webhook
 *
 * Triggered by GitHub Actions after FTP upload of archives.
 * Uses PHP native PharData for extraction (exec() disabled on shared hosting).
 * Runs artisan commands via Artisan::call() (no exec needed).
 *
 * Protected by DEPLOY_TOKEN in .env
 */

error_reporting(E_ALL);
ini_set('display_errors', '1');
set_time_limit(300);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method Not Allowed');
}

header('Content-Type: text/plain');

$domainPath = dirname(__DIR__);
$appPath = $domainPath . '/sianggar';
$publicPath = $domainPath . '/public_html';
$envFile = $appPath . '/.env';

echo "==> Domain path: {$domainPath}\n";
echo "==> App path: {$appPath}\n";
echo "==> Public path: {$publicPath}\n\n";

// Ensure app directory exists
if (!is_dir($appPath)) {
    mkdir($appPath, 0755, true);
    echo "==> Created app directory.\n";
}

if (!file_exists($envFile)) {
    http_response_code(500);
    exit('App not configured - .env not found at ' . $envFile);
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

$allSuccess = true;

/**
 * Extract a .tar.gz archive using PHP native PharData.
 * Falls back to exec('tar') if PharData fails.
 */
function extractArchive(string $archivePath, string $destPath): bool
{
    echo "    Size: " . round(filesize($archivePath) / 1024 / 1024, 2) . " MB\n";

    // Try PharData (PHP native, no exec needed)
    try {
        $phar = new PharData($archivePath);
        $phar->extractTo($destPath, null, true);
        echo "    Extracted via PharData.\n";
        return true;
    } catch (Exception $e) {
        echo "    PharData failed: " . $e->getMessage() . "\n";
    }

    // Fallback: try exec if available
    if (function_exists('exec')) {
        $cmd = "tar xzf " . escapeshellarg($archivePath) . " -C " . escapeshellarg($destPath) . " 2>&1";
        $output = [];
        $exitCode = 0;
        exec($cmd, $output, $exitCode);
        if (!empty($output)) {
            echo "    " . implode("\n    ", $output) . "\n";
        }
        if ($exitCode === 0) {
            echo "    Extracted via tar command.\n";
            return true;
        }
        echo "    tar command failed (exit: {$exitCode})\n";
    }

    return false;
}

// Step 1: Extract app archive
$appArchive = $publicPath . '/deploy-app.tar.gz';
if (file_exists($appArchive)) {
    echo "==> Extracting app archive...\n";
    if (extractArchive($appArchive, $appPath)) {
        echo "    App extracted successfully.\n\n";
        unlink($appArchive);
    } else {
        echo "    ERROR: App extraction failed.\n\n";
        $allSuccess = false;
    }
} else {
    echo "==> WARNING: deploy-app.tar.gz not found, skipping.\n\n";
}

// Step 2: Extract public archive
$publicArchive = $publicPath . '/deploy-public.tar.gz';
if (file_exists($publicArchive)) {
    echo "==> Extracting public archive...\n";
    if (extractArchive($publicArchive, $publicPath)) {
        echo "    Public files extracted successfully.\n\n";
        unlink($publicArchive);
    } else {
        echo "    ERROR: Public extraction failed.\n\n";
        $allSuccess = false;
    }
} else {
    echo "==> WARNING: deploy-public.tar.gz not found, skipping.\n\n";
}

// Step 3: Create storage link if not exists
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

// Step 4: Run artisan commands via Laravel bootstrap (no exec needed)
if ($allSuccess && file_exists($appPath . '/vendor/autoload.php')) {
    echo "\n==> Running artisan commands...\n";

    try {
        require $appPath . '/vendor/autoload.php';

        /** @var \Illuminate\Foundation\Application $app */
        $app = require $appPath . '/bootstrap/app.php';
        $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
        $kernel->bootstrap();

        $commands = [
            'migrate'     => ['--force' => true],
            'config:cache' => [],
            'route:cache'  => [],
            'view:cache'   => [],
            'event:cache'  => [],
        ];

        foreach ($commands as $cmd => $params) {
            echo "    php artisan {$cmd}... ";
            try {
                $exitCode = \Illuminate\Support\Facades\Artisan::call($cmd, $params);
                $output = \Illuminate\Support\Facades\Artisan::output();
                echo $exitCode === 0 ? "OK\n" : "FAILED (exit: {$exitCode})\n";
                if (!empty(trim($output))) {
                    echo "    " . str_replace("\n", "\n    ", trim($output)) . "\n";
                }
            } catch (Exception $e) {
                echo "ERROR: " . $e->getMessage() . "\n";
            }
        }

        echo "==> Artisan commands completed.\n";
    } catch (Exception $e) {
        echo "==> ERROR bootstrapping Laravel: " . $e->getMessage() . "\n";
        $allSuccess = false;
    }
} else if (!$allSuccess) {
    echo "\n==> Skipping artisan commands due to extraction errors.\n";
} else {
    echo "\n==> WARNING: vendor/autoload.php not found, skipping artisan commands.\n";
}

if (!$allSuccess) {
    http_response_code(500);
    echo "\nDeploy completed with errors.\n";
} else {
    echo "\nDeploy completed successfully.\n";
}
