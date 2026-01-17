<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ImageBackupVersion;
use App\Models\PropertyImage;
use App\Services\BackupService;
use App\Jobs\ProcessWatermarkBatch;
use Illuminate\Support\Str;

class MediaController extends Controller
{
    protected $backupService;

    public function __construct(BackupService $backupService)
    {
        $this->backupService = $backupService;
    }

    /**
     * List recent backups with pagination.
     */
    public function index(Request $request)
    {
        $backups = ImageBackupVersion::with('image')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($backups);
    }

    /**
     * Restore a specific backup.
     */
    public function restore(Request $request, $id)
    {
        try {
            $this->backupService->restoreBackup($id);
            return response()->json(['message' => 'Image restored successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Trigger Mass Watermark Job.
     * Dangerous Action - Should definitely be guarded on frontend.
     */
    public function triggerWatermark(Request $request)
    {
        $limit = $request->input('limit', 10); // Default reduced to 10 for safety
        $sync = $request->boolean('sync', false);

        // Find images that are NOT protected yet
        $protectedIds = ImageBackupVersion::pluck('image_id')->toArray();
        $images = PropertyImage::whereNotIn('id', $protectedIds)->limit($limit)->pluck('id')->toArray();
        
        if (empty($images)) {
             return response()->json(['message' => 'All images are already protected!', 'count' => 0]);
        }

        $batchId = 'manual-' . now()->format('Ymd-His') . '-' . Str::random(6);
        
        // Dispatch Job
        if ($sync) {
            ProcessWatermarkBatch::dispatchSync($images, $batchId, $request->user()->id ?? 'admin');
            return response()->json([
                'message' => "Successfully Processed " . count($images) . " images.", 
                'batch_id' => $batchId,
                'count' => count($images)
            ]);
        } else {
            ProcessWatermarkBatch::dispatch($images, $batchId, $request->user()->id ?? 'admin');
            return response()->json([
                'message' => 'Watermark Batch Queued', 
                'batch_id' => $batchId,
                'count' => count($images)
            ]);
        }
    }
    /**
     * DEBUG ONLY: Run watermark for 1 image and return FULL logs.
     */
    public function debugWatermark(Request $request)
    {
        $log = [];
        try {
            // Check FFmpeg
            $ffmpeg = trim(shell_exec('which ffmpeg'));
            $log['ffmpeg_path'] = $ffmpeg ?: 'NOT FOUND via which';
            
            // 1. Get Image (Try last 10 to avoid broken records)
            $images = PropertyImage::latest()->take(10)->get();
            $image = null;
            $validPath = null;
            $log['paths_checked'] = [];

                foreach ($images as $img) {
                     $path = $img->image_path;
                     // Handle 'properties/' prefix logic (Common in this app)
                     $subdirPath = str_starts_with($path, 'properties/') ? $path : 'properties/' . $path;
                     
                     $candidates = [
                        $path,       // 6/foo.jpg
                        $subdirPath, // properties/6/foo.jpg
                     ];
                     
                     foreach ($candidates as $c) {
                        // Check storage/app/public (Primary)
                        $p = storage_path('app/public/' . $c); 
                        if (file_exists($p)) {
                             $image = $img;
                             $validPath = $p;
                             $log['paths_checked'][$img->id] = 'FOUND in Storage: ' . $p;
                             break 2;
                        }
                        
                        // Check public/ (Legacy/Symlink)
                        $pPub = public_path($c); 
                         if (file_exists($pPub)) {
                             $image = $img;
                             $validPath = $pPub;
                             $log['paths_checked'][$img->id] = 'FOUND in Public: ' . $pPub;
                             break 2;
                        }
                     }
                    $log['paths_checked'][$img->id] = 'NOT FOUND';
                }

            if (!$image || !$validPath) {
                 return response()->json(['error' => 'No valid property images found on disk (Checked 10)', 'log' => $log]);
            }
            
            $log['image_id'] = $image->id;
            $log['image_db_path'] = $image->image_path;
            $log['resolved_path'] = $validPath;

            // 2. Check Logo
            $logoPath = public_path('resortwala-logo.png');
            $log['logo_path'] = $logoPath;
            if (!file_exists($logoPath)) throw new \Exception("Logo missing at $logoPath");

            // 3. Run FFmpeg
            $tempOutput = sys_get_temp_dir() . '/' . uniqid('debug_wm_') . '.jpg';
            $safeInput = escapeshellarg($validPath);
            $safeLogo = escapeshellarg($logoPath);
            $safeOutput = escapeshellarg($tempOutput);
            
            // Simple command
            $cmd = "ffmpeg -y -i {$safeInput} -i {$safeLogo} -filter_complex \"[1:v]scale=iw*0.25:-1[wm];[0:v][wm]overlay=W-w-20:H-h-20\" -q:v 2 {$safeOutput} 2>&1";
            $log['cmd'] = $cmd;
            
            $output = shell_exec($cmd);
            $log['ffmpeg_output'] = substr($output, 0, 1000);
            
            if (!file_exists($tempOutput) || filesize($tempOutput) < 100) {
                 throw new \Exception("FFmpeg failed to generate file.");
            }
            
            $log['success'] = true;
            $log['temp_file_size'] = filesize($tempOutput);
            @unlink($tempOutput);

            return response()->json($log);

        } catch (\Exception $e) {
            $log['error'] = $e->getMessage();
            $log['trace'] = $e->getTraceAsString();
            return response()->json($log, 500);
        }
    }
    /**
     * Get SRE Stats (Queued Vs Done).
     */
    public function stats()
    {
        $total = PropertyImage::count();
        $uniqueBackedUp = ImageBackupVersion::distinct('image_id')->count('image_id');
        
        return response()->json([
            'total_images' => $total,
            'protected_images' => $uniqueBackedUp,
            'coverage_percent' => $total > 0 ? round(($uniqueBackedUp / $total) * 100, 1) : 0
        ]);
    }

    /**
     * DEBUG ONLY: Test TTS Generation.
     */
    public function debugTts(Request $request)
    {
        $voice = $request->input('voice', 'atlas');
        $text = $request->input('text', 'Hello world, this is a test audio generation.');
        
        $log = [];
        $log['voice_input'] = $voice;
        
        // Manual Command Construction (Replicating TextToSpeechService)
        // Hardcoded mapped key for test
        $key = 'en-US-GuyNeural'; 
        if ($voice === 'aura') $key = 'en-US-AriaNeural';
        
        try {
            // Check edge-tts
            $check = shell_exec('edge-tts --version 2>&1');
            $log['edge_tts_version'] = $check ?: 'Not found in PATH';

            // Check python edge-tts
            $checkPy = shell_exec('python3 -m edge_tts --version 2>&1');
            $log['python_module_version'] = $checkPy ?: 'Module not found';

            $filename = 'debug_tts_' . time() . '.mp3';
            $outputPath = storage_path('app/public/audio/' . $filename);
            
            if (!file_exists(dirname($outputPath))) mkdir(dirname($outputPath), 0755, true);

            $safeText = escapeshellarg($text);
            $safePath = escapeshellarg($outputPath);
            
            $cmd = "edge-tts --voice {$key} --text {$safeText} --write-media {$safePath}";
            $log['cmd'] = $cmd;
            
            $output = [];
            $returnCode = 0;
            exec($cmd . " 2>&1", $output, $returnCode);
            
            $log['output'] = $output;
            $log['return_code'] = $returnCode;
            
            if ($returnCode === 0 && file_exists($outputPath)) {
                $log['success'] = true;
                $log['url'] = url('storage/audio/' . $filename);
                $log['size'] = filesize($outputPath);
            } else {
                $log['success'] = false;
                // Try Python module
                $cmd2 = "python3 -m edge_tts --voice {$key} --text {$safeText} --write-media {$safePath}";
                $log['cmd_fallback'] = $cmd2;
                exec($cmd2 . " 2>&1", $output2, $returnCode2);
                $log['output_fallback'] = $output2;
                $log['return_code_fallback'] = $returnCode2;
                
                if ($returnCode2 === 0 && file_exists($outputPath)) {
                    $log['success'] = true;
                    $log['method'] = 'fallback_python3';
                }
            }

            return response()->json($log);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
        }
    }
    /**
     * Compare specific image (SRE)
     */
    public function compareImage($id)
    {
        $image = PropertyImage::findOrFail($id);
        $backup = ImageBackupVersion::where('image_id', $id)
                    ->where('status', 'verified')
                    ->latest()
                    ->first();

        // 1. Current (Live) URL
        $path = $image->image_path;
        if (!Str::startsWith($path, 'properties/')) {
            $path = 'properties/' . $path;
        }
        
        $liveUrl = url('storage/' . $path) . '?t=' . time(); 
        
        // 2. Backup (Old) URL
        $backupUrl = null;
        if ($backup) {
            $backupUrl = url('storage/' . $backup->backup_path);
        }

        // 3. Website Link
        $webUrl = "https://resortwala.com/property/{$image->property_id}";

        return response()->json([
            'id' => $image->id,
            'live_url' => $liveUrl,
            'backup_url' => $backupUrl,
            'website_url' => $webUrl,
            'has_backup' => !!$backup,
            'backup_date' => $backup ? $backup->created_at->format('Y-m-d H:i:s') : null
        ]);
    }

    /**
     * DANGER: Purge all backups (Commit current state)
     */
    public function purgeBackups()
    {
        $backups = ImageBackupVersion::all();
        $count = 0;
        foreach ($backups as $backup) {
             if (Storage::disk('public')->exists($backup->backup_path)) {
                 Storage::disk('public')->delete($backup->backup_path);
             }
             $backup->delete();
             $count++;
        }
        return response()->json(['message' => "Purged {$count} backup records."]);
    }
    /**
     * Generic Media Upload (for Video Studio etc)
     */
    public function uploadMedia(Request $request) 
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,avi|max:51200' // 50MB max
        ]);

        $file = $request->file('file');
        $path = $file->store('uploads/studio', 'public');
        
        return response()->json([
            'path' => $path,
            'url' => url('storage/' . $path),
            'type' => Str::startsWith($file->getMimeType(), 'video') ? 'video' : 'image',
            'name' => $file->getClientOriginalName()
        ]);
    }
}
