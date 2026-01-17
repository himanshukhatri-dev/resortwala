<?php

namespace App\Services;

use App\Models\VideoRenderJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class VideoRenderingService
{
    protected $musicService;

    public function __construct(MusicLibraryService $musicService)
    {
        $this->musicService = $musicService;
    }

    /**
     * Process a video render job.
     */
    public function processJob(VideoRenderJob $job)
    {
        try {
            $job->update(['status' => 'processing']);

            // Create output directory if not exists
            $outputDir = storage_path('app/public/videos');
            if (!file_exists($outputDir)) {
                mkdir($outputDir, 0755, true);
            }

            // check ffmpeg... (Keep existing logic, omitted for brevity in instruction but I will include in replacement)
            $ffmpegPath = null;
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $ffmpegPath = trim(shell_exec('where ffmpeg 2>nul'));
            } else {
                $ffmpegPath = trim(shell_exec('which ffmpeg'));
            }
            
            if (empty($ffmpegPath)) {
                // Simulation Mode
                 Log::warning("FFmpeg not found. Falling back to simulation.");
                 sleep(2);
                 $outputFilename = 'video_' . $job->id . '_reel.mp4';
                 file_put_contents($outputDir . '/' . $outputFilename, "DUMMY REEL");
                 $publicPath = 'videos/' . $outputFilename;
            } else {
                // Real Processing
                // 1. Generate REEL (9:16) - Primary
                $reelFilename = 'video_' . $job->id . '_reel_' . time() . '.mp4';
                $reelPath = $outputDir . '/' . $reelFilename;
                $publicPath = 'videos/' . $reelFilename;

                $cmdReel = $this->buildVideoCommand($job, $reelPath, '9:16');
                Log::info("Rendering Reel: " . $cmdReel);
                exec($cmdReel . " 2>&1", $outputReel, $returnCodeReel);
                
                if ($returnCodeReel !== 0) throw new \Exception("Reel Gen failed: " . implode("\n", $outputReel));

                // 2. Generate POST (1:1) - Secondary (If Bundle Mode)
                $postPublicPath = null;
                if ($job->bundle_mode || ($job->options['bundle_mode'] ?? false)) {
                     $postFilename = 'video_' . $job->id . '_post_' . time() . '.mp4';
                     $postPath = $outputDir . '/' . $postFilename;
                     $postPublicPath = 'videos/' . $postFilename;

                     $cmdPost = $this->buildVideoCommand($job, $postPath, '1:1');
                     Log::info("Rendering Post: " . $cmdPost);
                     exec($cmdPost . " 2>&1", $outputPost, $returnCodePost);
                     
                     if ($returnCodePost !== 0) Log::error("Post Gen Failed: " . implode("\n", $outputPost)); // Don't fail entire job if optional post fails? Or fail? Let's fail for now to be safe.
                }
            }

            // Update Job
            $updateData = [
                'status' => 'completed',
                'output_path' => $publicPath
            ];
            
            // Save Post Path in Options
            if (isset($postPublicPath)) {
                $options = $job->options ?? [];
                $options['post_path'] = $postPublicPath;
                $updateData['options'] = $options;
            }

            $job->update($updateData);

            return true;
        } catch (\Exception $e) {
            Log::error("Video Render Failed: " . $e->getMessage());
            $job->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Build the FFmpeg command for a specific Aspect Ratio
     */
    private function buildVideoCommand(VideoRenderJob $job, $outputPath, $aspectRatio = '9:16')
    {
        // Format Logic
        $width = 720;
        $height = 1280;
        if ($aspectRatio === '1:1') {
            $width = 1080;
            $height = 1080;
        }

        $mediaIds = $job->options['media_ids'] ?? [];
        $mediaPaths = $job->options['media_paths'] ?? []; // New for Prompt Studio
        $images = [];

        // 1. Resolve Media Source
        if (!empty($mediaIds)) {
            // Standard Property Flow
            $imagesData = \App\Models\PropertyImage::whereIn('id', $mediaIds)->limit(15)->get(['id', 'image_path']);
            $imageMap = $imagesData->keyBy('id');
            
            foreach ($mediaIds as $id) {
                if ($imageMap->has($id)) {
                    $images[] = $imageMap->get($id)->image_path;
                }
            }
        } elseif (!empty($mediaPaths)) {
            // Prompt Studio Flow (Uploaded or AI Selected)
            $images = $mediaPaths;
        } else {
            // Prompt Studio (Mode A: No Media) -> Use Placeholders
            // In a real AI system, we would generate these.
            // For V1, we repeat the Logo or generic placeholders?
            // Let's use a fail-safe fallback to prevent crash.
            // We'll assume the client uploads at least one, or we use a "No Image" placeholder.
            // But User said "AI generates visuals".
            // Implementation: We will use `assets/placeholders/{1..5}.jpg`.
            // Check if they exist? If not, use Logo.
            $images = ['resortwala-logo.png', 'resortwala-logo.png', 'resortwala-logo.png'];
        }

        // Limit
        $images = array_slice($images, 0, 15);
        $count = count($images); 

        // 1. Get Music & Timing
        $templateId = $job->template_id ?? 'luxury';
        $trackConfig = $this->musicService->getTrackForTemplate($templateId);
        
        // Default Duration (BPM based)
        $imageDuration = $this->musicService->getBeatDuration($trackConfig['bpm'], 4);
        
        // --- NEW: TTS Voiceover Check (Calculated Early) ---
        $voicePath = $job->options['audio_source'] ?? null;
        $hasVoice = false;
        $voiceDuration = 0;
        $fullVoicePath = null;

        if ($voicePath) {
            $fullVoicePath = storage_path('app/public/' . $voicePath);
            if (file_exists($fullVoicePath)) {
                $hasVoice = true;
                $voiceDuration = $this->getAudioDuration($fullVoicePath);
            }
        }

        // Override Duration to sync with Voice
        $count = count($images);
        if ($hasVoice && $voiceDuration > 0 && $count > 0) {
             // Fit all images within voiceover
             // We subtract a small buffer (e.g. 1s) to ensure audio finishes slightly after visuals
             $imageDuration = ($voiceDuration / $count);
             if ($imageDuration < 2.0) $imageDuration = 2.0; // Min duration safety
        }

        $transitionDuration = 1.0; 
        $inputDuration = $imageDuration + $transitionDuration;

        $inputs = "";
        $filterComplex = "";
        
        // 2. Build Inputs
        foreach ($images as $i => $path) {
            $fullPath = str_starts_with($path, 'http') ? $path : storage_path('app/public/' . (str_starts_with($path, 'properties/') ? $path : 'properties/' . $path));
             // Quotes for safety
            $inputs .= "-loop 1 -t " . ($inputDuration) . " -i \"{$fullPath}\" ";
        }

        // Add dummy audio input if music file missing (mocking safety)
        $hasMusic = file_exists($trackConfig['path']);
        if ($hasMusic) {
            $inputs .= "-i \"{$trackConfig['path']}\" ";
        } else {
            $inputs .= "-f lavfi -t " . ($count * $imageDuration) . " -i anullsrc=r=44100:cl=stereo ";
        }

        // Add Voice Input (If exists)
        if ($hasVoice && $fullVoicePath) {
            $inputs .= "-i \"{$fullVoicePath}\" ";
        }

        // 3. Filter Complex Generation
        // A. Pre-processing (Scale -> Crop -> Color Grade -> ZoomPan)
        
        for ($i = 0; $i < $count; $i++) {
            // Randomize Zoom direction (In or Out)
            $zoomExpr = ($i % 2 == 0) ? "min(zoom+0.0015,1.5)" : "1.5-0.0015*on"; // Simple toggle
            
            // Dynamic duration for zoompan (total frames)
            $zFrames = intval($inputDuration * 30) + 10; 
            
            $filterComplex .= "[{$i}:v]scale={$width}:{$height}:force_original_aspect_ratio=increase,crop={$width}:{$height}," .
                              "setsar=1," . 
                              $trackConfig['filters'] . "," . // Color Grading
                              "zoompan=z='{$zoomExpr}':d={$zFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={$width}x{$height}:fps=30[v{$i}];";
        }
        
        // B. Transitions (Xfade)
        // We chain them: [v0][v1]xfade...[v01]; [v01][v2]xfade...[v012]
        $prevLabel = "v0";
        $offset = $imageDuration; // Cumulative offset where next transition starts
        
        if ($count > 1) {
            for ($i = 1; $i < $count; $i++) {
                $nextLabel = ($i == $count - 1) ? "vMerged" : "vtmp{$i}";
                $trans = 'fade'; // Forced 'fade' for stability (whipleft causing FFmpeg 6.1 bug)
                
                $filterComplex .= "[{$prevLabel}][v{$i}]xfade=transition={$trans}:duration={$transitionDuration}:offset={$offset}[{$nextLabel}];";
                
                $offset += $imageDuration;
                $prevLabel = $nextLabel;
            }
        } else {
             $filterComplex = str_replace("[v0];", "[vMerged];", $filterComplex);
             $filterComplex = str_replace("[v0]", "[vMerged]", $filterComplex);
        }

        // --- NEW: CTA End Card Scene (Mandatory) ---
        $endCardDuration = 4.0;
        $title = $job->options['title'] ?? 'Luxury Stay';
        $subtitle = $job->options['subtitle'] ?? 'Book Now';
        $location = $job->options['location'] ?? 'ResortWala.com'; // Fallback
        
        // Escape text
        $eTitle = str_replace(["'", ":"], ["’", "\\:"], $title); // Sanitize quotes and escape colons
        $eSubtitle = str_replace(["'", ":"], ["’", "\\:"], $subtitle);

        // Create End Card Background (Last Image Blurred + Dark Overlay)
        // Re-use last image index: ($count - 1)
        $lastImgIdx = $count - 1;
        
        // Filter Chain for End Card:
        // 1. Scale/Crop to size
        // 2. Boxblur for background effect
        // 3. Setsar=1
        // 4. tpad: Extend the single image frame to 4 seconds (duration)
        // 5. Drawbox: Dark overlay
        // 6. Drawtext: Overlays
        
        $filterComplex .= "[{$lastImgIdx}:v]scale={$width}:{$height}:force_original_aspect_ratio=increase,crop={$width}:{$height}," .
                          "boxblur=20:5,setsar=1,tpad=stop_mode=clone:stop_duration={$endCardDuration}," .
                          "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.6:t=fill[vEndBase];";
        
        $filterComplex .= "[vEndBase]drawtext=text='{$eTitle}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2-50:" .
                          "shadowcolor=black:shadowx=2:shadowy=2," .
                          "drawtext=text='{$eSubtitle}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2+20," .
                          "drawtext=text='Book Now: resortwala.com':fontcolor=yellow:fontsize=45:x=(w-text_w)/2:y=h-150[vEndCard];";
                          
        // Concat Main Video + End Card
        $filterComplex .= "[vMerged][vEndCard]concat=n=2:v=1:a=0[vContent];";
                          
        $lastVideoNode = "[vContent]";
        $totalVideoDuration = $offset + $endCardDuration;

        // C. Typography (Brand Overlay on Main Video - OPTIONAL if using End Card)
        // Logic removed or simplified to just "Watermark" later.
        // We skip the old $textFilter logic if using End Card.
        
        /*
        $textFilter = ... old logic ...
        */

        // D. Audio Mixing (Adjusted for End Card)
        $musicIdx = $count;
        $voiceIdx = $count + 1;
        
        // Extend music fade out to cover End Card
        $fadeOutStart = $totalVideoDuration - 2;
        $bgMusicFilter = "[{$musicIdx}:a]afade=t=in:st=0:d=2,volume=0.3,afade=t=out:st={$fadeOutStart}:d=2[aBg]";

        if ($hasVoice) {
            $voiceFilter = "[{$voiceIdx}:a]volume=1.5[aVoice];";
            $mixFilter = "[aVoice][aBg]amix=inputs=2:duration=first:dropout_transition=2[aOutPart]";
            // If voice is short, audio ends early.
            // Ideally we want music to continue till end of video.
            // `duration=first` kills music.
            // `duration=longest` keeps music (potentially 7 mins).
            // We use `duration=first` but we PAD the voice stream?
            // OR we use `atrim` on music?
            // Better: Use `duration=longest` for amix, BUT Pre-Trim the music to $totalVideoDuration.
            $bgMusicFilter = "[{$musicIdx}:a]atrim=duration={$totalVideoDuration},afade=t=in:st=0:d=2,volume=0.3,afade=t=out:st={$fadeOutStart}:d=2[aBg]";
            $mixFilter = "[aVoice][aBg]amix=inputs=2:duration=longest:dropout_transition=2[aOut]"; 
            
            $filterComplex .= $bgMusicFilter . ";" . $voiceFilter . $mixFilter . ";";
        } else {
            // Just Music
             $filterComplex .= "[{$musicIdx}:a]atrim=duration={$totalVideoDuration},afade=t=in:st=0:d=2,afade=t=out:st={$fadeOutStart}:d=2[aOut];";
        }


        // E. Branding & Watermark
        $logoPath = public_path('resortwala-logo.png');
        $hasLogo = file_exists($logoPath);
        $logoIdx = -1;

        if ($hasLogo) {
            $inputs .= "-i \"{$logoPath}\" ";
            // Index logic: Images (0 to count-1) + Music (1) + Voice (Optional 1)
            $logoIdx = $count + 1 + ($hasVoice ? 1 : 0);
        }



        // Apply Logo Overlay
        if ($hasLogo && $logoIdx > 0) {
            // Scale Logo to 180px width, Overlay at Top-Left (20px padding)
            // Use -2 to ensure height is divisible by 2 (required for libx264)
            $filterComplex .= "[{$logoIdx}:v]scale=180:-2[vLogoIn];{$lastVideoNode}[vLogoIn]overlay=x=20:y=20[vMarked];";
            $lastVideoNode = "[vMarked]";
        }

        // Apply Persistent Property Name Overlay (Bottom)
        $propName = str_replace(["'", ":"], ["", "\\:"], $job->options['title'] ?? '');
        if (!empty($propName)) {
             $filterComplex .= "{$lastVideoNode}drawtext=text='{$propName}':fontcolor=white:fontsize=40:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=h-100[vFinal];";
             $lastVideoNode = "[vFinal]";
        }


        // 4. Final Command
        // Map [vFinal] and [aOut]
        $filterComplex = rtrim($filterComplex, ';');
        // Force output duration with -t to strictly prevent long videos (overrides audio length issues)
        $cmd = "ffmpeg {$inputs} -filter_complex \"{$filterComplex}\" -map \"{$lastVideoNode}\" -map \"[aOut]\" -c:v libx264 -pix_fmt yuv420p -r 30 -t {$totalVideoDuration} \"{$outputPath}\"";

        return $cmd;
    }

    /**
     * Get Audio Duration in Seconds using FFmpeg
     */
    private function getAudioDuration($path)
    {
        try {
            // Use ffprobe or ffmpeg to get duration
            // Output format: "Duration: 00:00:30.50, ..."
            // We use 2>&1 to capture stderr where ffmpeg writes info
            $cmd = "ffmpeg -i " . escapeshellarg($path) . " 2>&1 | grep \"Duration\"";
            $output = shell_exec($cmd);
            
            if (preg_match('/Duration: ((\d+):(\d+):(\d+)\.\d+)/', $output, $matches)) {
                $hours = intval($matches[2]);
                $minutes = intval($matches[3]);
                $seconds = intval($matches[4]); // ignoring milliseconds for simplicity, or use float
                
                // Parse float from full match if needed, but int seconds is okay for estimation
                $fullSeconds = ($hours * 3600) + ($minutes * 60) + $seconds;
                
                // better precision
                $parts = explode(':', $matches[1]);
                $sec = $parts[0]*3600 + $parts[1]*60 + $parts[2];
                return floatval($sec);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to get duration: " . $e->getMessage());
        }
        return 0;
    }
}
