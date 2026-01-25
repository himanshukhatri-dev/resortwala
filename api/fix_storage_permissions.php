<?php
/**
 * Standalone Storage Permission Fix Script
 * 
 * This script fixes file permissions for all files and directories
 * in the storage/app/public directory to resolve image visibility issues.
 * 
 * Usage:
 *   php fix_storage_permissions.php
 * 
 * Safe to run multiple times (idempotent)
 */

echo "=== Storage Permission Fix Script ===\n";
echo "Started at: " . date('Y-m-d H:i:s') . "\n";
echo "Current user: " . exec('whoami') . "\n\n";

// Bootstrap Laravel
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

$target = storage_path('app/public');
echo "Target directory: $target\n\n";

// 1. Ensure all required directories exist
echo "Step 1: Creating required directories...\n";
$directories = [
    '',  // Base public directory
    'properties',
    'audio',
    'videos',
    'stock',
    'stock/generated',
    'music',
    'temp_bg',
    'attachments',
    'bulk_uploads'
];

$createdCount = 0;
foreach ($directories as $dir) {
    $fullPath = $dir ? "$target/$dir" : $target;
    if (!file_exists($fullPath)) {
        if (mkdir($fullPath, 0755, true)) {
            echo "  ✓ Created: $dir\n";
            $createdCount++;
        } else {
            echo "  ✗ Failed to create: $dir\n";
        }
    }
}
echo "Created $createdCount new directories\n\n";

// 2. Fix permissions recursively
echo "Step 2: Fixing permissions recursively...\n";
$fixedDirs = 0;
$fixedFiles = 0;
$errors = 0;

try {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($target, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        $path = $item->getPathname();
        $relativePath = str_replace($target . DIRECTORY_SEPARATOR, '', $path);

        try {
            if ($item->isDir()) {
                if (@chmod($path, 0755)) {
                    $fixedDirs++;
                    if ($fixedDirs <= 10) { // Show first 10 for brevity
                        echo "  ✓ DIR  755: $relativePath\n";
                    }
                } else {
                    $errors++;
                    echo "  ✗ DIR  FAIL: $relativePath\n";
                }
            } else {
                if (@chmod($path, 0644)) {
                    $fixedFiles++;
                    if ($fixedFiles <= 10) { // Show first 10 for brevity
                        echo "  ✓ FILE 644: $relativePath\n";
                    }
                } else {
                    $errors++;
                    echo "  ✗ FILE FAIL: $relativePath\n";
                }
            }
        } catch (Exception $e) {
            $errors++;
            echo "  ✗ ERROR: $relativePath - " . $e->getMessage() . "\n";
        }
    }

    // Fix the base directory itself
    @chmod($target, 0755);

    if ($fixedDirs > 10) {
        echo "  ... and " . ($fixedDirs - 10) . " more directories\n";
    }
    if ($fixedFiles > 10) {
        echo "  ... and " . ($fixedFiles - 10) . " more files\n";
    }

} catch (Exception $e) {
    echo "✗ Error during recursive fix: " . $e->getMessage() . "\n";
}

echo "\nFixed $fixedDirs directories and $fixedFiles files\n";
if ($errors > 0) {
    echo "⚠ $errors items could not be modified (may be owned by different user)\n";
}

// 3. Re-create storage symlink
echo "\nStep 3: Re-creating storage symlink...\n";
$linkPath = public_path('storage');

if (file_exists($linkPath)) {
    if (is_link($linkPath)) {
        unlink($linkPath);
        echo "  ✓ Removed existing symlink\n";
    } else {
        echo "  ⚠ Storage path exists but is not a symlink\n";
    }
}

try {
    Illuminate\Support\Facades\Artisan::call('storage:link');
    echo "  ✓ Created symlink: $linkPath -> $target\n";
} catch (Exception $e) {
    echo "  ✗ Failed to create symlink: " . $e->getMessage() . "\n";
}

// 4. Verify symlink
echo "\nStep 4: Verifying symlink...\n";
if (file_exists($linkPath)) {
    if (is_link($linkPath)) {
        $symlinkTarget = readlink($linkPath);
        echo "  ✓ Symlink is active\n";
        echo "    Source: $linkPath\n";
        echo "    Target: $symlinkTarget\n";
    } else {
        echo "  ✗ Path exists but is not a symlink\n";
    }
} else {
    echo "  ✗ Symlink does not exist\n";
}

echo "\n=== Fix Complete ===\n";
echo "Completed at: " . date('Y-m-d H:i:s') . "\n";
echo "\nSummary:\n";
echo "  Directories fixed: $fixedDirs\n";
echo "  Files fixed: $fixedFiles\n";
echo "  Errors: $errors\n";
echo "\nNext steps:\n";
echo "  1. Check if images are now visible in the application\n";
echo "  2. If issues persist, check web server user permissions\n";
echo "  3. Verify nginx/apache configuration for serving static files\n";
