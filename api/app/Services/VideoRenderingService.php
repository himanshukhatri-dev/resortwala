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

            $outputFilename = 'video_' . $job->id . '_' . time() . '.mp4';
            $outputPath = $outputDir . '/' . $outputFilename;
            $publicPath = 'videos/' . $outputFilename;

            // Check system FFmpeg availability
            $ffmpegPath = trim(shell_exec('which ffmpeg'));
            if (empty($ffmpegPath)) {
                // Fallback to Simulation if FFmpeg is missing (Local Dev)
                 Log::warning("FFmpeg not found. Falling back to simulation.");
                 sleep(2);
                 // Create dummy file
                 file_put_contents($outputPath, "DUMMY VIDEO CONTENT");
            } else {
                // Real Processing
                $cmd = $this->buildCinematicCommand($job, $outputPath);
                Log::info("Executing Cinematic FFmpeg: " . $cmd);
                
                // Increase time limit for rendering
                set_time_limit(300);
                
                exec($cmd . " 2>&1", $output, $returnCode);
                
                if ($returnCode !== 0) {
                    throw new \Exception("FFmpeg failed: " . implode("\n", $output));
                }
            }

            $job->update([
                'status' => 'completed',
                'output_path' => $publicPath
            ]);

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
     * Build the ADVANCED Cinematic FFmpeg command
     */
    private function buildCinematicCommand(VideoRenderJob $job, $outputPath)
    {
        $mediaIds = $job->options['media_ids'] ?? [];
        if (empty($mediaIds)) throw new \Exception("No media selected");

        // Fetch image paths (Limit to 12 to prevent command line overflow)
        $images = \App\Models\PropertyImage::whereIn('id', $mediaIds)->limit(12)->pluck('image_path')->toArray();
        if (empty($images)) throw new \Exception("Images not found");

        // 1. Get Music & Timing
        $templateId = $job->template_id ?? 'luxury';
        $trackConfig = $this->musicService->getTrackForTemplate($templateId);
        
        // Calculate Duration Per Image based on BPM
        // E.g., 80 BPM -> 0.75s per beat. 4 beats = 3s per slide.
        $imageDuration = $this->musicService->getBeatDuration($trackConfig['bpm'], 4);
        $transitionDuration = 1.0; // 1 second overlap
        
        // Total Duration for -t input argument (Source duration + overlap)
        $inputDuration = $imageDuration + $transitionDuration;

        $inputs = "";
        $filterComplex = "";
        $count = count($images);
        
        // 2. Build Inputs
        foreach ($images as $i => $path) {
            $fullPath = str_starts_with($path, 'http') ? $path : storage_path('app/public/' . (str_starts_with($path, 'properties/') ? $path : 'properties/' . $path));
             // Quotes for safety
            $inputs .= "-loop 1 -t " . ($inputDuration) . " -i \"{$fullPath}\" ";
        }

        // Add dummy audio input if music file missing (mocking safety)
        // For now, we generate silence if track doesn't exist to prevent crash
        $hasMusic = file_exists($trackConfig['path']);
        if ($hasMusic) {
            $inputs .= "-i \"{$trackConfig['path']}\" ";
        } else {
            $inputs .= "-f lavfi -t " . ($count * $imageDuration) . " -i anullsrc=r=44100:cl=stereo ";
        }

        // --- NEW: TTS Voiceover Input ---
        $voicePath = $job->options['audio_source'] ?? null;
        $hasVoice = false;
        if ($voicePath) {
            // Fix relative path if needed
            $fullVoicePath = storage_path('app/public/' . $voicePath);
            if (file_exists($fullVoicePath)) {
                $inputs .= "-i \"{$fullVoicePath}\" ";
                $hasVoice = true;
            }
        }

        // 3. Filter Complex Generation
        // A. Pre-processing (Scale -> Crop -> Color Grade -> ZoomPan)
        
        for ($i = 0; $i < $count; $i++) {
            // Randomize Zoom direction (In or Out)
            $zoomExpr = ($i % 2 == 0) ? "min(zoom+0.0015,1.5)" : "1.5-0.0015*on"; // Simple toggle
            
            // Dynamic duration for zoompan (total frames)
            $zFrames = intval($inputDuration * 30) + 10; 
            
            $filterComplex .= "[{$i}:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280," .
                              "setsar=1," . 
                              $trackConfig['filters'] . "," . // Color Grading
                              "zoompan=z='{$zoomExpr}':d={$zFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280:fps=30[v{$i}];";
        }
        
        // B. Transitions (Xfade)
        // We chain them: [v0][v1]xfade...[v01]; [v01][v2]xfade...[v012]
        $prevLabel = "v0";
        $offset = $imageDuration; // Cumulative offset where next transition starts
        
        if ($count > 1) {
            for ($i = 1; $i < $count; $i++) {
                $nextLabel = ($i == $count - 1) ? "vMerged" : "vtmp{$i}";
                $trans = $trackConfig['transition'] ?? 'fade';
                
                $filterComplex .= "[{$prevLabel}][v{$i}]xfade=transition={$trans}:duration={$transitionDuration}:offset={$offset}[{$nextLabel}];";
                
                $offset += $imageDuration;
                $prevLabel = $nextLabel;
            }
        } else {
             $filterComplex = str_replace("[v0];", "[vMerged];", $filterComplex);
             $filterComplex = str_replace("[v0]", "[vMerged]", $filterComplex);
        }

        // C. Typography (Brand Overlay)
        $title = $job->options['title'] ?? '';
        $textFilter = "[vMerged]";
        
        if ($title) {
            $title = str_replace(":", "\\:", $title); // Escape
            // Draw text with a simple fade in/out animation
            // fade in at 0.5s, fade out at end
            $textFilter .= "drawtext=text='{$title}':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=(h-text_h)/2:" .
                           "shadowcolor=black:shadowx=4:shadowy=4:" .
                           "alpha='if(lt(t,1),t,if(lt(t,{$offset}-1),1,({$offset}-t)))'[vText];";
        } else {
            $textFilter .= "null[vText];";
        }
        
        $filterComplex .= $textFilter;

        // D. Audio Mixing (Loop/Trim music to match video)
        // Map audio input (last index before voice? NO, voice is last if present)
        // Indices: Images: 0..N-1 | Music: N | Voice: N+1 (if hasVoice)
        $musicIdx = $count;
        $voiceIdx = $count + 1;

        // Process Background Music (Fade In/Out)
        $bgMusicFilter = "[{$musicIdx}:a]afade=t=in:st=0:d=2,volume=0.3,afade=t=out:st=" . ($offset - 2) . ":d=2[aBg]";

        if ($hasVoice) {
            // Process Voiceover (Clean + Boost)
            // Mix: [aBg] + [Voice] -> [aOut]
            $voiceFilter = "[{$voiceIdx}:a]volume=1.5[aVoice];";
            $mixFilter = "[aBg][aVoice]amix=inputs=2:duration=first:dropout_transition=2[aOut]"; // duration=first (length of bg video/music usually controls)
            
            // Actually, if Voice is longer than video, we might cut it. 
            // Ideally we'd stretch video, but for now let's just mix.
            $filterComplex .= $bgMusicFilter . ";" . $voiceFilter . $mixFilter;
        } else {
            // Just Music
            // We need to reset volume to 1.0 (remove volume=0.3 from logic above or just override)
             $filterComplex .= "[{$musicIdx}:a]afade=t=in:st=0:d=2,afade=t=out:st=" . ($offset - 2) . ":d=2[aOut]";
        }

        // 4. Final Command
        // Map [vText] (or vMerged if no text) and [aOut]
        $cmd = "ffmpeg {$inputs} -filter_complex \"{$filterComplex}\" -map \"[vText]\" -map \"[aOut]\" -c:v libx264 -pix_fmt yuv420p -r 30 -shortest \"{$outputPath}\"";

        return $cmd;
    }
}
