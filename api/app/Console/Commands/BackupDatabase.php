<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

use App\Models\DatabaseBackup;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup {--env=production} {--encrypt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Enterprise-grade DB backup with compression, encryption, and registry tracking';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $targetEnv = $this->option('env');
        $this->info("Starting enterprise backup for [{$targetEnv}]...");

        $timestamp = Carbon::now()->format('Ymd_His');
        $baseName = "{$targetEnv}_db_backup_{$timestamp}.sql";
        $compressedFile = "{$baseName}.gz";
        $storagePath = storage_path('app/backups');
        
        if (!file_exists($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');
        $dbHost = config('database.connections.mysql.host');

        // Detect or Config mysqldump path
        if (PHP_OS_FAMILY === 'Windows') {
             $dumpBinaryPath = env('DB_DUMP_COMMAND_PATH', 'C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysqldump.exe');
             if (strpos($dumpBinaryPath, ' ') !== false && strpos($dumpBinaryPath, '"') === false) {
                  $dumpBinaryPath = '"' . $dumpBinaryPath . '"';
             }
        } else {
             $dumpBinaryPath = env('DB_DUMP_COMMAND_PATH', 'mysqldump');
        }

        // 1. Dump & Gzip (Compressed)
        // Note: Using output redirection to gzip to avoid huge intermediate files
        $command = "{$dumpBinaryPath} --user=\"{$dbUser}\" --password=\"{$dbPass}\" --host=\"{$dbHost}\" --single-transaction --no-tablespaces --column-statistics=0 \"{$dbName}\" | gzip > \"{$storagePath}/{$compressedFile}\"";
        
        $process = Process::fromShellCommandline($command);
        $process->setTimeout(600);
        $process->run();

        if (!$process->isSuccessful()) {
            $this->error('Backup failed at dump stage!');
            \Log::error("DB Backup Failed: " . $process->getErrorOutput());
            
            DatabaseBackup::create([
                'filename' => $compressedFile,
                'environment' => $targetEnv,
                'size_bytes' => 0,
                'status' => 'failed'
            ]);
            return 1;
        }

        $finalFile = $compressedFile;
        $isEncrypted = false;

        // 2. Encryption (AES-256)
        if ($this->option('encrypt')) {
            $this->info("Encrypting backup...");
            $encKey = config('app.key');
            $encryptedFile = "{$compressedFile}.enc";
            
            // Hardened AES-256-CBC with PBKDF2 and 100k iterations
            $encCommand = "openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in \"{$storagePath}/{$compressedFile}\" -out \"{$storagePath}/{$encryptedFile}\" -k \"{$encKey}\"";
            $encProcess = Process::fromShellCommandline($encCommand);
            $encProcess->run();

            if ($encProcess->isSuccessful()) {
                unlink("{$storagePath}/{$compressedFile}");
                $finalFile = $encryptedFile;
                $isEncrypted = true;
            } else {
                $this->warn("Encryption failed, keeping compressed file.");
            }
        }

        $size = filesize("{$storagePath}/{$finalFile}");
        $checksum = md5_file("{$storagePath}/{$finalFile}");

        // 3. Register in Registry
        DatabaseBackup::create([
            'filename' => $finalFile,
            'environment' => $targetEnv,
            'size_bytes' => $size,
            'status' => 'success',
            'disk' => 'local',
            'is_encrypted' => $isEncrypted,
            'checksum' => $checksum
        ]);

        $this->info("Backup complete: {$finalFile} ({$size} bytes)");
        
        // 4. Cleanup old backups (Retention logic)
        $this->cleanupOldBackups();

        return 0;
    }

    private function cleanupOldBackups()
    {
        $retentionDays = 30;
        $threshold = Carbon::now()->subDays($retentionDays);
        
        $oldBackups = DatabaseBackup::where('created_at', '<', $threshold)->get();

        foreach ($oldBackups as $backup) {
            $path = storage_path("app/backups/{$backup->filename}");
            if (file_exists($path)) {
                unlink($path);
            }
            $backup->delete();
        }
    }
}
