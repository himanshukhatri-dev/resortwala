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

        // Detect or Config mysqldump path
        // Detect OS for Dump Path
        if (PHP_OS_FAMILY === 'Windows') {
            $dumpBinaryPath = env('DB_DUMP_COMMAND_PATH', 'C:\Program Files\MySQL\MySQL Workbench 8.0 CE\mysqldump.exe');
            if (strpos($dumpBinaryPath, ' ') !== false && strpos($dumpBinaryPath, '"') === false) {
                 $dumpBinaryPath = '"' . $dumpBinaryPath . '"';
            }
        } else {
            // Linux/Production: Try to find mysqldump
            $possiblePaths = [
                '/usr/bin/mysqldump',
                '/usr/local/bin/mysqldump',
                '/usr/local/mysql/bin/mysqldump',
                'mysqldump' // Fallback to PATH
            ];
            
            $dumpBinaryPath = 'mysqldump'; // Default
            foreach ($possiblePaths as $path) {
                if (file_exists($path) && is_executable($path)) {
                    $dumpBinaryPath = $path;
                    break;
                }
            }
            // Override if env is set
            if (env('DB_DUMP_COMMAND_PATH')) {
                $dumpBinaryPath = env('DB_DUMP_COMMAND_PATH');
            }
        }

        // Build command (using mysqldump)
        // Added --column-statistics=0 for MySQL 8 compatibility to avoid "Unknown table 'COLUMN_STATISTICS' in information_schema"
        // Redirect 2>&1 to capture error messages from mysqldump
        $command = sprintf(
            '%s --user=%s --password=%s --host=%s --column-statistics=0 %s > %s 2>&1',
            $dumpBinaryPath,
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
                 return response()->json([
                     'success' => false, 
                     'error' => 'Backup failed with code ' . $resultCode,
                     'details' => $output
                 ], 500);
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
