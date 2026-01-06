<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BackupController extends Controller
{
    /**
     * List all backups
     */
    public function index()
    {
        $files = Storage::disk('local')->files('resortwala-backups');
        $backups = [];

        foreach ($files as $file) {
            if (str_ends_with($file, '.sql')) {
                $backups[] = [
                    'name' => basename($file),
                    'size' => $this->formatSize(Storage::disk('local')->size($file)),
                    'date' => Carbon::createFromTimestamp(Storage::disk('local')->lastModified($file))->toDateTimeString(),
                    'path' => $file
                ];
            }
        }

        // Sort by date desc
        usort($backups, fn($a, $b) => strcmp($b['date'], $a['date']));

        return response()->json(['success' => true, 'backups' => $backups]);
    }

    /**
     * Create a new backup
     */
    public function create()
    {
        $filename = 'backup-' . Carbon::now()->format('Y-m-d-H-i-s') . '.sql';
        $path = storage_path('app/resortwala-backups/' . $filename);
        
        // Ensure directory exists
        if (!Storage::disk('local')->exists('resortwala-backups')) {
            Storage::disk('local')->makeDirectory('resortwala-backups');
        }

        // Determine DB Config
        $host = config('database.connections.mysql.host');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $database = config('database.connections.mysql.database');

        // Build command (using mysqldump)
        // Note: Password usage in command line is visible in process list, but acceptable for this internal tool context.
        // Better approach: use .my.cnf or env var. For now, direct command.
        
        $command = sprintf(
            'mysqldump --user=%s --password=%s --host=%s %s > %s',
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($database),
            escapeshellarg($path)
        );

        // Execute
        try {
            // Using shell_exec for simplicity with redirection
            // Symfony Process doesn't handle '>' redirection natively without 'sh -c'
            $output = null;
            $resultCode = null;
            exec($command, $output, $resultCode);

            if ($resultCode !== 0) {
                 return response()->json(['success' => false, 'error' => 'Backup failed with code ' . $resultCode], 500);
            }

            return response()->json([
                'success' => true, 
                'message' => 'Backup created successfully',
                'file' => $filename
            ]);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Download a backup
     */
    public function download($filename)
    {
        $path = 'resortwala-backups/' . $filename;
        if (!Storage::disk('local')->exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return Storage::disk('local')->download($path);
    }

    /**
     * Restore a backup
     */
    public function restore(Request $request, $filename)
    {
        $path = storage_path('app/resortwala-backups/' . $filename);
        if (!file_exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        // Credentials
        $host = config('database.connections.mysql.host');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $database = config('database.connections.mysql.database');

        // Command: mysql < file
        $command = sprintf(
            'mysql --user=%s --password=%s --host=%s %s < %s',
            escapeshellarg($username),
            escapeshellarg($password),
            escapeshellarg($host),
            escapeshellarg($database),
            escapeshellarg($path)
        );

        try {
            $output = null;
            $resultCode = null;
            exec($command, $output, $resultCode);

            if ($resultCode !== 0) {
                 return response()->json(['success' => false, 'error' => 'Restore failed with code ' . $resultCode], 500);
            }

            // Clear cache after restore to ensure app sees fresh data
            \Artisan::call('cache:clear');

            return response()->json(['success' => true, 'message' => 'Database restored successfully']);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a backup
     */
    public function delete($filename)
    {
        $path = 'resortwala-backups/' . $filename;
        if (Storage::disk('local')->exists($path)) {
            Storage::disk('local')->delete($path);
            return response()->json(['success' => true, 'message' => 'Backup deleted']);
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
