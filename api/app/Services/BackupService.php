<?php

namespace App\Services;

use App\Models\ImageBackupVersion;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BackupService
{
    private $disk = 'public'; // or 'local' depending on setup, user said /storage/backups so likely public/local

    /**
     * Create a verified backup of an image.
     * 
     * @param int $imageId
     * @param string $originalPath Relative path in storage (e.g. properties/1/img.jpg)
     * @param string $batchId Group ID for this operation
     * @param string $userId Operator ID
     * @return ImageBackupVersion
     * @throws \Exception
     */
    public function createBackup($imageId, $originalPath, $batchId, $userId = 'system')
    {
        // 1. Verify Source Exists
        if (!Storage::disk($this->disk)->exists($originalPath)) {
            throw new \Exception("Source file not found: {$originalPath}");
        }

        // 2. Prepare Backup Path
        // /backups/property-images/{YYYY-MM-DD}/{uuid}.ext
        $date = now()->format('Y-m-d');
        $ext = pathinfo($originalPath, PATHINFO_EXTENSION);
        $backupFilename = Str::uuid() . '.' . $ext;
        $backupDir = "backups/property-images/{$date}";
        $backupPath = "{$backupDir}/{$backupFilename}";

        // 3. Perform Copy
        try {
            Storage::disk($this->disk)->copy($originalPath, $backupPath);
        } catch (\Throwable $e) {
            throw new \Exception("Failed to copy file: " . $e->getMessage());
        }

        // 4. Verification (Checksum)
        $sourceHash = md5(Storage::disk($this->disk)->get($originalPath));
        $backupHash = md5(Storage::disk($this->disk)->get($backupPath));

        if ($sourceHash !== $backupHash) {
            // CRITICAL FAILURE - Rollback copy
            Storage::disk($this->disk)->delete($backupPath);
            Log::emergency("Backup Integrity Check Failed for Image {$imageId}. Source: {$sourceHash}, Backup: {$backupHash}");
            throw new \Exception("Integrity Check Failed: Checksum Mismatch");
        }

        // 5. Gather Metadata (Size, maybe Exif if needed)
        $size = Storage::disk($this->disk)->size($backupPath);
        $metadata = [
            'size_bytes' => $size,
            'original_filename' => basename($originalPath),
            'timestamp' => now()->toIso8601String()
        ];

        // 6. Record in Database
        return ImageBackupVersion::create([
            'image_id' => $imageId,
            'original_path' => $originalPath,
            'backup_path' => $backupPath,
            'checksum' => $backupHash, // storing MD5, or SHA256 if preferred. User asked for MD5/SHA256. MD5 is faster for images.
            'backup_batch_id' => $batchId,
            'backed_up_by' => $userId,
            'status' => 'verified',
            'metadata' => $metadata
        ]);
    }

    /**
     * Restore an image from valid backup.
     */
    public function restoreBackup($backupId)
    {
        $record = ImageBackupVersion::findOrFail($backupId);

        if (!Storage::disk($this->disk)->exists($record->backup_path)) {
            throw new \Exception("Backup file missing on disk: {$record->backup_path}");
        }

        // Safety: Verify Checksum Again before Restore
        $currentBackupHash = md5(Storage::disk($this->disk)->get($record->backup_path));
        if ($currentBackupHash !== $record->checksum) {
             throw new \Exception("Backup file corrupted! Checksum mismatch.");
        }

        // Restore
        // We overwrite the original path
        Storage::disk($this->disk)->put($record->original_path, Storage::disk($this->disk)->get($record->backup_path));
        
        // Log restoration?
        // Maybe update status to 'restored'?
        // Or create a new record?
        // For now, just log and return.
        Log::info("Restored Image {$record->image_id} from Backup {$record->id}");
        
        return true;
    }
}
