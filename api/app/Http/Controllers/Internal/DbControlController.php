<?php

namespace App\Http\Controllers\Internal;

use App\Http\Controllers\Controller;
use App\Models\DatabaseBackup;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

class DbControlController extends Controller
{
    public function index()
    {
        $backups = DatabaseBackup::orderBy('created_at', 'desc')->get();
        return response()->json($backups);
    }

    public function auditLogs(Request $request)
    {
        $logs = AuditLog::with('user')
            ->when($request->table, fn($q) => $q->where('auditable_type', 'LIKE', "%{$request->table}%"))
            ->when($request->event, fn($q) => $q->where('event', $request->event))
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }

    public function triggerBackup(Request $request)
    {
        $env = $request->input('env', 'manual');
        $encrypt = $request->boolean('encrypt', true);

        // Run the command
        Artisan::call('db:backup', [
            '--env' => $env,
            '--encrypt' => $encrypt
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Backup initiated'
        ]);
    }

    public function restore(Request $request, $id)
    {
        $backup = DatabaseBackup::findOrFail($id);
        
        if ($backup->status !== 'success') {
            return response()->json(['error' => 'Cannot restore a failed backup'], 400);
        }

        // 1. Emergency Safety Snapshot
        Artisan::call('db:backup', ['--env' => 'safety_pre_restore']);

        // 2. Restore Path
        $storagePath = storage_path('app/backups');
        $file = "{$storagePath}/{$backup->filename}";
        
        if (!file_exists($file)) {
            return response()->json(['error' => 'Backup file missing on disk'], 404);
        }

        $dbHost = config('database.connections.mysql.host');
        $dbName = config('database.connections.mysql.database');
        $dbUser = config('database.connections.mysql.username');
        $dbPass = config('database.connections.mysql.password');

        $workingFile = $file;
        $tempFiles = [];

        try {
            // A. Decrypt if needed
            if ($backup->is_encrypted) {
                $decryptedFile = $file . '.tmp.gz';
                $encKey = config('app.key');
                // Hardened decryption matching BackupDatabase command
                $decCommand = "openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in \"{$file}\" -out \"{$decryptedFile}\" -k \"{$encKey}\"";
                
                $decProcess = Process::fromShellCommandline($decCommand);
                $decProcess->run();
                
                if (!$decProcess->isSuccessful()) throw new \Exception("Decryption failed: " . $decProcess->getErrorOutput());
                
                $workingFile = $decryptedFile;
                $tempFiles[] = $decryptedFile;
            }

            // B. Restore (Gunzip -> MySQL)
            // Use --force to continue on SQL errors? No, better to fail and rollback manually if needed.
            $restoreCommand = "gunzip -c \"{$workingFile}\" | mysql --user=\"{$dbUser}\" --password=\"{$dbPass}\" --host=\"{$dbHost}\" \"{$dbName}\"";
            
            $resProcess = Process::fromShellCommandline($restoreCommand);
            $resProcess->setTimeout(1200); // 20 mins for large DB
            $resProcess->run();

            if (!$resProcess->isSuccessful()) throw new \Exception("SQL Restore failed: " . $resProcess->getErrorOutput());

            // 3. Mark in DB
            $backup->update([
                'restored_at' => now(),
                'restored_by' => auth()->id()
            ]);

            return response()->json([
                'status' => 'success', 
                'message' => 'Database successfully restored to snapshot ' . $backup->filename
            ]);

        } catch (\Exception $e) {
            \Log::critical("CRITICAL: Database Restore Failed: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        } finally {
            foreach ($tempFiles as $tmp) {
                if (file_exists($tmp)) unlink($tmp);
            }
        }
    }

    public function download($id)
    {
        $backup = DatabaseBackup::findOrFail($id);
        $path = storage_path("app/backups/{$backup->filename}");

        if (!file_exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }

        return response()->download($path);
    }
}
