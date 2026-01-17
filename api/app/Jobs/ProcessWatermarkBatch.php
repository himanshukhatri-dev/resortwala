<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\PropertyImage;
use App\Services\BackupService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ProcessWatermarkBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $imageIds;
    protected $batchId;
    protected $userId;

    /**
     * Create a new job instance.
     *
     * @param array $imageIds Array of image IDs to process
     * @param string $batchId UUID for the backup batch
     * @param string $userId User ID initiating the job
     */
    public function __construct(array $imageIds, string $batchId, string $userId = 'system')
    {
        $this->imageIds = $imageIds;
        $this->batchId = $batchId;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(BackupService $backupService): void
    {
        Log::info("Starting Watermark Batch: {$this->batchId} - Count: " . count($this->imageIds));
        
        $images = PropertyImage::whereIn('id', $this->imageIds)->get();
        $logoPath = public_path('resortwala-logo.png');

        if (!file_exists($logoPath)) {
            Log::error("Watermark Job Failed: Logo file missing at {$logoPath}");
            $this->fail(new \Exception("Logo missing"));
            return;
        }

        foreach ($images as $image) {
            $tempOutput = null;
            try {
                // 1. RESOLVE PATH (Check for 'properties/' prefix)
                $path = $image->image_path;
                $candidates = [
                    $path,
                    'properties/' . $path
                ];
                
                $realPath = null;
                $storagePath = null;

                foreach($candidates as $c) {
                    if (Storage::disk('public')->exists($c)) {
                        $storagePath = $c;
                        $realPath = Storage::disk('public')->path($c);
                        break;
                    }
                }
                
                // Fallback manual check
                if (!$realPath) {
                     $manualPath = storage_path('app/public/properties/' . $path);
                     if (file_exists($manualPath)) {
                         $realPath = $manualPath;
                         $storagePath = 'properties/' . $path; // Best guess for Storage facade relative path
                     }
                }

                if (!$realPath || !$storagePath) {
                    throw new \Exception("Source file not found (Checked variants): " . $path);
                }

                // 2. BACKUP
                $backupRecord = $backupService->createBackup(
                    $image->id, 
                    $storagePath, // Use the resolved relative path
                    $this->batchId, 
                    $this->userId
                );

                // 3. PROCESS (Watermark using FFmpeg)
                $tempOutput = sys_get_temp_dir() . '/' . uniqid('wm_') . '.jpg';
                
                // FFmpeg Command:
                // Scale logo to 20% of image width? Or fixed size?
                // Let's use a standard overlay: Bottom Right, 20px padding.
                // scale=iw*0.2:-1 [logo]; [0][logo] overlay=W-w-20:H-h-20
                
                // Escape paths for shell
                $safeInput = escapeshellarg($realPath);
                $safeLogo = escapeshellarg($logoPath);
                $safeOutput = escapeshellarg($tempOutput);
                
                // Command: Fixed Width 350px (Robust fallback since scale2ref failed)
                // We scales the logo [1:v] to 350px width, maintaining aspect ratio.
                // Then overlay at bottom-right with padding.
                // Command: Dynamic Relative Scaling using scale2ref
                // Scale logo [1:v] relative to base [0:v]. 
                // Set logo height to 20% of base height (ih*0.2), maintain aspect ratio.
                $filter = "[1:v][0:v]scale2ref=h=ih*0.15:w=oh*mdar[wm][base];[base][wm]overlay=W-w-30:H-h-30";
                $safeFilter = escapeshellarg($filter);
                
                $cmd = "ffmpeg -y -i {$safeInput} -i {$safeLogo} -filter_complex {$safeFilter} -q:v 2 {$safeOutput} 2>&1";
                
                \Illuminate\Support\Facades\Log::info("Watermark Command [0.40]: " . $cmd);

                $output = shell_exec($cmd);
                
                // 3. VERIFY OUTPUT
                if (!file_exists($tempOutput) || filesize($tempOutput) < 100) {
                     throw new \Exception("FFmpeg failed to generate watermarked file.");
                }

                // 4. REPLACE ORIGINAL
                // We overwrite the $realPath so the website displays the new version immediately.
                if (!rename($tempOutput, $realPath)) {
                     // Try copy + unlink if rename fails (e.g. cross-partition)
                     if (!copy($tempOutput, $realPath)) {
                        throw new \Exception("Failed to overwrite original file at {$realPath}");
                     }
                     @unlink($tempOutput);
                }
                
                // Ensure permissions are correct for web server
                @chmod($realPath, 0644);

                Log::info("Successfully Watermarked & Replaced Image ID: {$image->id}");
            } catch (\Throwable $e) {
                Log::error("Failed to watermark image {$image->id}: " . $e->getMessage());
                // We do NOT stop the whole batch, but we log the error. 
                // The backup ensures we didn't break anything (failed before replace) 
                // OR if replace failed, we have backup.
            } finally {
                // Cleanup temp
                if ($tempOutput && file_exists($tempOutput)) {
                    @unlink($tempOutput);
                }
            }
        }
    }
}
