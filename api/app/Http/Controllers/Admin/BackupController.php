<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Carbon\Carbon;

class BackupController extends Controller
{
    private $backupDisk = 'local'; // Uses storage/app
    private $backupFolder = 'backups';

    public function index()
    {
        // Ensure directory exists
        if (!Storage::disk($this->backupDisk)->exists($this->backupFolder)) {
            Storage::disk($this->backupDisk)->makeDirectory($this->backupFolder);
        }

        $files = Storage::disk($this->backupDisk)->files($this->backupFolder);
        $backups = [];

        foreach ($files as $file) {
            if (pathinfo($file, PATHINFO_EXTENSION) === 'gz') {
                $backups[] = [
                    'filename' => basename($file),
                    'size' => $this->formatSize(Storage::disk($this->backupDisk)->size($file)),
                    'created_at' => Carbon::createFromTimestamp(Storage::disk($this->backupDisk)->lastModified($file))->toDateTimeString(),
                    'timestamp' => Storage::disk($this->backupDisk)->lastModified($file) // For sorting
                ];
            }
        }

        // Sort by newest first
        usort($backups, function ($a, $b) {
            return $b['timestamp'] - $a['timestamp'];
        });

        return response()->json($backups);
    }

    public function store()
    {
        // Create backup
        $filename = 'db_backup_' . date('Y-m-d_H-i-s') . '.sql.gz';
        $path = storage_path('app/' . $this->backupFolder . '/' . $filename);

        // Ensure folder exists
        if (!file_exists(storage_path('app/' . $this->backupFolder))) {
            mkdir(storage_path('app/' . $this->backupFolder), 0755, true);
        }

        $dbUser = env('DB_USERNAME');
        $dbPass = env('DB_PASSWORD');
        $dbName = env('DB_DATABASE');
        $dbHost = env('DB_HOST', '127.0.0.1');

        // Construct command (mysqldump | gzip)
        // Note: Using a shell wrapper to handle the pipe
        $command = "mysqldump -u '{$dbUser}' -p'{$dbPass}' -h '{$dbHost}' '{$dbName}' | gzip > '{$path}'";

        // Using Process to execute
        // We use 'bash -c' to handle the pipe logic easily
        $process = Process::fromShellCommandline($command);
        $process->setTimeout(300); // 5 minutes
        $process->run();

        if (!$process->isSuccessful()) {
            return response()->json([
                'error' => 'Backup failed',
                'details' => $process->getErrorOutput()
            ], 500);
        }

        return response()->json([
            'message' => 'Backup created successfully',
            'filename' => $filename
        ]);
    }

    public function restore(Request $request)
    {
        $filename = $request->input('filename');
        if (!$filename) {
            return response()->json(['error' => 'Filename required'], 400);
        }

        $path = storage_path('app/' . $this->backupFolder . '/' . $filename);

        if (!file_exists($path)) {
            return response()->json(['error' => 'Backup file not found'], 404);
        }

        $dbUser = env('DB_USERNAME');
        $dbPass = env('DB_PASSWORD');
        $dbName = env('DB_DATABASE');
        $dbHost = env('DB_HOST', '127.0.0.1');

        // Command: gunzip < file | mysql ...
        $command = "gunzip < '{$path}' | mysql -u '{$dbUser}' -p'{$dbPass}' -h '{$dbHost}' '{$dbName}'";

        $process = Process::fromShellCommandline($command);
        $process->setTimeout(300); // 5 minutes
        $process->run();

        if (!$process->isSuccessful()) {
            return response()->json([
                'error' => 'Restore failed',
                'details' => $process->getErrorOutput()
            ], 500);
        }

        return response()->json([
            'message' => 'Database restored successfully'
        ]);
    }

    public function destroy($filename)
    {
        $file = $this->backupFolder . '/' . $filename;
        if (Storage::disk($this->backupDisk)->exists($file)) {
            Storage::disk($this->backupDisk)->delete($file);
            return response()->json(['message' => 'Backup deleted']);
        }
        return response()->json(['error' => 'File not found'], 404);
    }

    private function formatSize($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}
