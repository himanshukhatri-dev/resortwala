<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backup the database to storage and clean up old backups';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // 1. Check if backup is enabled
        if (env('ENABLE_AUTO_BACKUP', true) !== true) {
            $this->info('Auto backup is disabled in .env');
            return 0;
        }

        $this->info('Starting database backup...');

        $filename = 'db-backup-' . Carbon::now()->format('Y-m-d-His') . '.sql';
        $storagePath = storage_path('app/backups');
        
        // Ensure directory exists
        if (!file_exists($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $filePath = $storagePath . '/' . $filename;

        // 2. Database credentials
        $dbName = env('DB_DATABASE');
        $dbUser = env('DB_USERNAME');
        $dbPass = env('DB_PASSWORD');
        $dbHost = env('DB_HOST', '127.0.0.1');

        // 3. Run mysqldump
        // Note: Using --no-tablespaces to avoid permission issues on some setups
        $command = "mysqldump --user=\"{$dbUser}\" --password=\"{$dbPass}\" --host=\"{$dbHost}\" --single-transaction --no-tablespaces \"{$dbName}\" > \"{$filePath}\"";
        
        $returnVar = null;
        $output = null;

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            $this->error('Backup failed!');
            \Log::error("Database backup failed: " . implode("\n", $output));
            return 1;
        }

        $this->info("Backup created successfully: {$filename}");
        \Log::info("Database backup created: {$filename}");

        // 4. Cleanup old backups (Retention: 30 days)
        $this->cleanupOldBackups($storagePath);

        return 0;
    }

    private function cleanupOldBackups($directory)
    {
        $files = glob($directory . '/db-backup-*.sql');
        $now = Carbon::now();
        $retentionDays = 30;
        $deletedCount = 0;

        foreach ($files as $file) {
            if (is_file($file)) {
                $fileTime = Carbon::createFromTimestamp(filemtime($file));
                if ($now->diffInDays($fileTime) > $retentionDays) {
                    unlink($file);
                    $deletedCount++;
                }
            }
        }

        if ($deletedCount > 0) {
            $this->info("Cleaned up {$deletedCount} old backup files.");
            \Log::info("Cleaned up {$deletedCount} old backup files.");
        }
    }
}
