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

            // check ffmpeg
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
                // Prepare Options with Scenes if missing
                // This ensures buildVideoCommand has data
                $options = $job->options ?? [];

                if (empty($options['scenes'])) {
                    // Generate AI Script Data
                    $scriptService = app(\App\Services\AIScriptGeneratorService::class);
                    // Use Prompt or Property?
                    // Basic heuristic: if media_ids exist, likely property contextual.
                    if (!empty($options['media_ids'])) {
                        // TODO: Load Property? For now, just generate generic luxury
                        // Or rely on fallback inside buildVideoCommand.
                        // Ideally we should do it here to save it.
                    } else {
                        // Prompt Mode
                        $prompt = $options['prompt'] ?? 'Luxury Stay';
                        $dat = $scriptService->generateFromPromptData($prompt);
                        $options['scenes'] = $dat['scenes'];
                        // Save back to job so we can debug scenes later
                        $job->update(['options' => $options]);
                    }
                }

                // 1. Generate REEL (9:16) - Primary
                $reelFilename = 'video_' . $job->id . '_reel_' . time() . '.mp4';
                $reelPath = $outputDir . '/' . $reelFilename;
                $publicPath = 'videos/' . $reelFilename;

                if (($job->template_id ?? '') === 'tutorial') {
                    // Tutorial Mode
                    $tutorialId = $job->options['tutorial_id'] ?? null;
                    $tutorial = \App\Models\Tutorial::find($tutorialId);
                    if (!$tutorial)
                        throw new \Exception("Tutorial ID not found");

                    $cmdReel = $this->buildTutorialCommand($tutorial, $reelPath);
                } else {
                    // Standard Mode
                    $cmdReel = $this->buildVideoCommand($job, $reelPath, '9:16');
                }

                Log::info("Rendering Reel: " . $cmdReel);
                exec($cmdReel . " 2>&1", $outputReel, $returnCodeReel);

                if ($returnCodeReel !== 0)
                    throw new \Exception("Reel Gen failed: " . implode("\n", $outputReel));

                // Generate Thumbnail (Poster)
                $thumbPath = str_replace('.mp4', '.jpg', $reelPath);
                $cmdThumb = "ffmpeg -y -i " . escapeshellarg($reelPath) . " -ss 00:00:01.000 -vframes 1 -q:v 2 " . escapeshellarg($thumbPath) . " 2>&1";
                exec($cmdThumb);

                // 2. Generate POST (1:1) - Secondary (If Bundle Mode)
                $postPublicPath = null;
                if ($job->bundle_mode || ($job->options['bundle_mode'] ?? false)) {
                    $postFilename = 'video_' . $job->id . '_post_' . time() . '.mp4';
                    $postPath = $outputDir . '/' . $postFilename;
                    $postPublicPath = 'videos/' . $postFilename;

                    $cmdPost = $this->buildVideoCommand($job, $postPath, '1:1');
                    Log::info("Rendering Post: " . $cmdPost);
                    exec($cmdPost . " 2>&1", $outputPost, $returnCodePost);

                    if ($returnCodePost !== 0)
                        Log::error("Post Gen Failed: " . implode("\n", $outputPost));
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
    /**
     * Build the FFmpeg command for Tutorial Videos (Cursor Overlay + Highlights)
     */
    /**
     * Build the FFmpeg command for Tutorial Videos (Cursor Overlay + Highlights)
     */
    public function buildTutorialCommand(\App\Models\Tutorial $tutorial, $outputPath)
    {
        $steps = $tutorial->steps()->orderBy('order_index')->get();
        $inputs = "";
        $filterComplex = "";
        $idx = 0;
        $prevStream = "";
        // Default cursor path if not found
        $cursorPath = public_path('cursor.png');
        if (!file_exists($cursorPath)) {
            // Use a fallback or generate a simple red arrow
            $cursorPath = storage_path('app/public/cursor_default.png');
        }

        foreach ($steps as $i => $step) {
            $streamName = "v{$i}";

            // 1. Inputs: Screenshot (Background)
            $imagePath = $this->resolvePath($step->media_path ?? 'white_bg');
            $inputs .= "-loop 1 -t {$step->duration} -i \"{$imagePath}\" ";
            $bgIdx = $idx++;

            // 2. Inputs: Cursor (Overlay)
            $inputs .= "-loop 1 -t {$step->duration} -i \"{$cursorPath}\" ";
            $cursorIdx = $idx++;

            // 3. Visual Metadata
            $meta = $step->visual_metadata ?? [];
            $cursorData = $meta['cursor'] ?? null;
            $highlight = $meta['highlight'] ?? null;

            // Start filter chain for this step -- Normalize Scale to 1280x720
            $filterComplex .= "[{$bgIdx}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[{$streamName}Bg];";
            $currentStream = "[{$streamName}Bg]";

            // A. Highlight Overlay (Dim Surroundings)
            if ($highlight) {
                // Dimmer Logic: Draw 4 semi-transparent black boxes around the target area
                $x = max(0, $highlight['x']);
                $y = max(0, $highlight['y']);
                $w = $highlight['w'];
                $h = $highlight['h'];
                $dimColor = "black@0.5";

                // Box 1: Top (Full Width, 0 to y)
                // Box 2: Left (0 to x, y to y+h)
                // Box 3: Right (x+w to Width, y to y+h)
                // Box 4: Bottom (Full Width, y+h to Height)

                $filterComplex .= "{$currentStream}" .
                    "drawbox=x=0:y=0:w=iw:h={$y}:color={$dimColor}:t=fill," .
                    "drawbox=x=0:y={$y}:w={$x}:h={$h}:color={$dimColor}:t=fill," .
                    "drawbox=x=" . ($x + $w) . ":y={$y}:w=iw-" . ($x + $w) . ":h={$h}:color={$dimColor}:t=fill," .
                    "drawbox=x=0:y=" . ($y + $h) . ":w=iw:h=ih-" . ($y + $h) . ":color={$dimColor}:t=fill" .
                    "[{$streamName}Dim];";
                $currentStream = "[{$streamName}Dim]";
            }

            // B. Cursor Animation & Click Effect
            if ($cursorData) {
                // Scale cursor
                $filterComplex .= "[{$cursorIdx}:v]scale=32:-1[{$streamName}Cur];";

                $startPos = $cursorData['start'] ?? [0, 0];
                $endPos = $cursorData['end'] ?? [100, 100];
                $action = $cursorData['action'] ?? null; // 'click'

                // Timing
                $moveStartT = 0.5;
                $moveDur = 1.0;
                $T_end = $moveStartT + $moveDur;

                // Interpolation Expression
                // x(t) = startX + (endX - startX) * (t - startT) / dur
                $exX = "if(lt(t,{$moveStartT}),{$startPos[0]},if(lt(t,{$T_end}),{$startPos[0]}+({$endPos[0]}-{$startPos[0]})*(t-{$moveStartT})/{$moveDur},{$endPos[0]}))";
                $exY = "if(lt(t,{$moveStartT}),{$startPos[1]},if(lt(t,{$T_end}),{$startPos[1]}+({$endPos[1]}-{$startPos[1]})*(t-{$moveStartT})/{$moveDur},{$endPos[1]}))";

                // Overlay Cursor
                $filterComplex .= "{$currentStream}[{$streamName}Cur]overlay=x='{$exX}':y='{$exY}'[{$streamName}Ovr];";
                $currentStream = "[{$streamName}Ovr]";

                // C. Click Ripple Effect (Draw a circle that expands and fades)
                if ($action === 'click') {
                    // Click happens at T_end (1.5s)
                    // Circle expands from radius 0 to 50 over 0.5s
                    $clickT = $T_end;
                    $rad = "if(gt(t,{$clickT}),(t-{$clickT})*100,0)";
                    $alpha = "if(gt(t,{$clickT}),1-(t-{$clickT})*2,0)"; // Fade out

                    // Only draw if within time window
                    // drawbox/drawcircle only supports constant expressions in some versions, but 't' usually works for animations
                    // Using 'geq' filter or specialized draw might be complex. 
                    // Simpler: Just flash a yellow circle?
                    // Let's stick to a simple flash for V1 or skip if too complex for vanilla FFmpeg without filters
                    // Alternative: use a 'click.png' overlay that fades in/out.
                }
            }

            // D. Concat Segments
            if ($i === 0) {
                $prevStream = "{$currentStream}";
            } else {
                $filterComplex .= "{$prevStream}{$currentStream}concat=n=2:v=1:a=0[vMix{$i}];";
                $prevStream = "[vMix{$i}]";
            }
        }

        // Final Output Setup
        $filterComplex = rtrim($filterComplex, ';');
        // Add silent audio track
        $inputs .= "-f lavfi -t 1 -i anullsrc ";
        $aIdx = $idx;

        $cmd = "ffmpeg {$inputs} -filter_complex \"{$filterComplex}\" -map \"{$prevStream}\" -map {$aIdx}:a -c:v libx264 -pix_fmt yuv420p \"{$outputPath}\"";
        return $cmd;
    }

    /**
     * Build the FFmpeg command using Scene Architecture (Video 2.0)
     */
    private function buildVideoCommand(VideoRenderJob $job, $outputPath, $aspectRatio = '9:16')
    {
        $width = ($aspectRatio === '1:1') ? 1080 : 720;
        $height = ($aspectRatio === '1:1') ? 1080 : 1280;

        // 1. Get Scene Data
        // If 'scenes' exist in options (from Prompt Studio), use them.
        // Else, generate them via AIScriptGenerator (Legacy fallback or Auto-mode)
        $scenes = $job->options['scenes'] ?? [];

        if (empty($scenes)) {
            // Fallback: Generate generic scenes if missing
            $scriptService = app(\App\Services\AIScriptGeneratorService::class);
            $prompt = $job->options['prompt'] ?? 'Luxury Stay';
            $dat = $scriptService->generateFromPromptData($prompt);
            $scenes = $dat['scenes'];
        }

        // 2. Resolve Visuals per Scene
        // Each scene has a 'visual_cue' or manual image_path.
        // We need to map available images to scenes.
        $mediaIds = $job->options['media_ids'] ?? [];
        $mediaPaths = $job->options['media_paths'] ?? [];
        $prompt = $job->options['prompt'] ?? '';
        $availableImages = $this->resolveImages($mediaIds, $mediaPaths, $job->options['visual_theme'] ?? 'luxury', $prompt);

        // Distribute images to scenes
        $imgIndex = 0;
        foreach ($scenes as &$scene) {
            // Assign image from pool, rotating if needed
            $scene['image_path'] = $availableImages[$imgIndex % count($availableImages)];
            $imgIndex++;
        }
        unset($scene); // break ref

        // 3. Audio Setup (Music + TTS)
        $templateId = $job->template_id ?? 'luxury';
        $trackConfig = $this->musicService->getTrackForTemplate($templateId);
        $voicePath = $job->options['audio_source'] ?? null;
        $fullVoicePath = $voicePath ? storage_path('app/public/' . $voicePath) : null;
        $hasVoice = ($fullVoicePath && file_exists($fullVoicePath));

        // 4. Build Input Chain
        $inputs = "";
        $filterComplex = "";
        $inputMap = []; // Maps 'v0', 'v1' etc to FFmpeg input indices
        $idx = 0;

        // A. Add Scene Images as Inputs
        foreach ($scenes as $i => $scene) {
            $path = $this->resolvePath($scene['image_path']);
            // Loop 1 frame for duration + small transition buffer
            $dur = $scene['duration'] + 1.0;

            $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $isImage = in_array($ext, ['jpg', 'jpeg', 'png', 'webp']);

            if ($isImage) {
                $inputs .= "-loop 1 -t {$dur} -i \"{$path}\" ";
            } else {
                // Video: Stream loop to ensure it covers duration
                $inputs .= "-stream_loop -1 -t {$dur} -i \"{$path}\" ";
            }
            $inputMap[$i] = $idx;
            $idx++;
        }

        // B. Add Music Input
        $musicIdx = $idx;
        $inputs .= "-i \"{$trackConfig['path']}\" ";
        $idx++;

        // C. Add Voice Input (Optional)
        $voiceIdx = $hasVoice ? $idx : -1;
        if ($hasVoice) {
            $inputs .= "-i \"{$fullVoicePath}\" ";
            $idx++;
        }

        // 5. Visual Processing (Effects Service)
        $fx = app(\App\Services\Video\VisualEffectsService::class);
        $prevStream = "";
        $cumDuration = 0;

        foreach ($scenes as $i => $scene) {
            $streamName = "v{$i}";

            // Step A: Process Image (Scale -> Zoom/KenBurns)
            // Note: VisualEffectsService needed here. I'll incline basic logic or assume method existence.
            // Using inline implementation for reliability:

            // Randomize direction
            $zoomExpr = ($i % 2 == 0) ? "min(zoom+0.0015,1.5)" : "1.5-0.0015*on";
            $zFrames = intval(($scene['duration'] + 1) * 30);

            $filterComplex .= "[{$i}:v]split[vBgRaw{$i}][vFgRaw{$i}];" .
                // Background: Scale to Fill + Blur
                "[vBgRaw{$i}]scale={$width}:{$height}:force_original_aspect_ratio=increase,crop={$width}:{$height},boxblur=20:5[vBg{$i}];" .
                // Foreground: Scale to Fit
                "[vFgRaw{$i}]scale={$width}:{$height}:force_original_aspect_ratio=decrease[vFg{$i}];" .
                // Overlay Foreground on Background
                "[vBg{$i}][vFg{$i}]overlay=(W-w)/2:(H-h)/2:shortest=1,setsar=1," .
                $trackConfig['filters'] . "," . // Color Grade
                "zoompan=z='{$zoomExpr}':d={$zFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s={$width}x{$height}:fps=30[{$streamName}Raw];";

            // Step B: Typography (DrawText)
            // Add Scene Text (Hook / Feature)
            $text = str_replace(["'", ":"], ["’", "\\:"], $scene['text']);
            $fontFile = public_path('fonts/Montserrat-Bold.ttf'); // Ensure this exists or use default
            $fontCmd = file_exists($fontFile) ? "fontfile='{$fontFile}':" : "";

            // Animation: Fade in text at 0.5s
            // Complex text styling
            $alpha = "min(1, (t-0.5)/0.5)"; // Fade in over 0.5s 
            // DrawText with box
            $filterComplex .= "[{$streamName}Raw]drawtext={$fontCmd}text='{$text}':fontcolor=white:fontsize=45:" .
                "box=1:boxcolor=black@0.5:boxborderw=20:" .
                "x=(w-text_w)/2:y=(h-text_h)-150:" . // Bottom center
                "alpha='{$alpha}'[{$streamName}Txt];";

            // Step C: Transitions
            if ($i === 0) {
                $prevStream = "[{$streamName}Txt]";
                $cumDuration = $scene['duration'];
            } else {
                // Transition from Prev to Current
                $outStream = "vMix{$i}";
                $trans = 'fade';
                $offset = $cumDuration - 0.5; // Overlap by 0.5s

                $filterComplex .= "{$prevStream}[{$streamName}Txt]xfade=transition={$trans}:duration=1:offset={$offset}[{$outStream}];";

                $prevStream = "[{$outStream}]";
                $cumDuration += ($scene['duration'] - 0.5); // Adjust for overlap
            }
        }

        // --- NEW: CTA End Card Scene (Mandatory) ---
        $endCardDuration = 4.0;
        $title = $job->options['title'] ?? 'Luxury Stay';
        $location = $job->options['location'] ?? 'ResortWala.com'; // Fallback

        // Escape text
        $eTitle = str_replace(["'", ":"], ["’", "\\:"], $title);
        $eLocation = str_replace(["'", ":"], ["’", "\\:"], $location);

        // Create End Card Background (Re-use last image index)
        // Last image index is $count - 1? No, logic above uses $scenes which is 0-indexed.
        // BUT current build loop iterates $scenes from 0.
        // Use first image as background if last not avail? Last scene index is count($scenes)-1.
        $lastImgIdx = count($scenes) - 1;
        if ($lastImgIdx < 0)
            $lastImgIdx = 0;

        // Filter Chain for End Card:
        // 1. Scale/Crop/Boxblur
        // 2. Pad to duration
        // 3. Draw Text

        $filterComplex .= "[{$lastImgIdx}:v]scale={$width}:{$height}:force_original_aspect_ratio=increase,crop={$width}:{$height}," .
            "boxblur=20:5,setsar=1,tpad=stop_mode=clone:stop_duration={$endCardDuration}," .
            "drawbox=x=0:y=0:w=iw:h=ih:color=black@0.6:t=fill[vEndBase];";

        $filterComplex .= "[vEndBase]drawtext=text='{$eTitle}':fontcolor=white:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2-50:" .
            "shadowcolor=black:shadowx=2:shadowy=2," .
            "drawtext=text='Book at {$eLocation}':fontcolor=yellow:fontsize=45:x=(w-text_w)/2:y=h-150[vEndCard];";

        // Concat Main Video + End Card
        $finalVideo = "[vContent]";
        $filterComplex .= "{$prevStream}[vEndCard]concat=n=2:v=1:a=0{$finalVideo};";

        $totalVideoDuration = $cumDuration + $endCardDuration;

        // 6. Audio Mixing
        // Music Logic (Trim & Fade)
        $fadeOutStart = $totalVideoDuration - 2;
        $filterComplex .= "[{$musicIdx}:a]atrim=duration={$totalVideoDuration},afade=t=in:st=0:d=1,afade=t=out:st={$fadeOutStart}:d=2[aMusic];";

        $finalAudio = "[aFinal]";

        if ($hasVoice) {
            $filterComplex .= "[{$voiceIdx}:a]volume=1.5[aVoice];";
            $filterComplex .= "[aVoice][aMusic]amix=inputs=2:duration=longest[aMix];";
            $finalAudio = "[aMix]";
        } else {
            $finalAudio = "[aMusic]";
        }

        // 7. Watermark & Branding (Top Right)
        $logoPath = public_path('resortwala-logo.png');
        if (file_exists($logoPath)) {
            $inputs .= "-i \"{$logoPath}\" ";
            $logoIdx = $idx;
            // FIX: Use clean output pad [vMarked]
            // We overlay logo on $finalVideo
            $filterComplex .= "[{$logoIdx}:v]scale=150:-2[vLogo];{$finalVideo}[vLogo]overlay=x=W-w-20:y=20[vMarked];";
            $finalVideo = "[vMarked]";
        } else {
            // Just strip brackets for map? No, $finalVideo is already [vContent].
        }

        // Clean up filter string
        $filterComplex = rtrim($filterComplex, ';');

        // Compile
        // map $finalVideo
        $cmd = "ffmpeg {$inputs} -filter_complex \"{$filterComplex}\" -map \"{$finalVideo}\" -map \"{$finalAudio}\" -c:v libx264 -pix_fmt yuv420p -r 30 -t {$totalVideoDuration} \"{$outputPath}\"";

        return $cmd;
    }

    private function resolveImages($ids, $paths, $theme, $prompt = '')
    {
        $images = [];
        if (!empty($ids)) {
            $data = \App\Models\PropertyImage::whereIn('id', $ids)->get(['image_path']);
            foreach ($data as $img)
                $images[] = $img->image_path;
        } elseif (!empty($paths)) {
            $images = $paths;
        }

        if (empty($images)) {
            // Try Stock Asset Service
            $keyword = $theme; // Default to theme
            if (!empty($prompt)) {
                // Simple keyword extraction: remove Stop words, take longest word > 4 chars, or just use first 2 words
                $words = explode(' ', preg_replace('/[^a-zA-Z0-9 ]/', '', $prompt));
                $useful = array_filter($words, fn($w) => strlen($w) > 4 && !in_array(strtolower($w), ['video', 'create', 'about', 'would']));
                if (!empty($useful))
                    $keyword = implode(' ', array_slice($useful, 0, 2));
            }

            try {
                $stockService = app(\App\Services\StockAssetService::class);
                $stockImages = $stockService->getVisuals($keyword, 6, 'portrait');
                if (!empty($stockImages))
                    return $stockImages;
            } catch (\Throwable $e) {
                \Log::error("Stock Service Failed: " . $e->getMessage());
            }

            // Fallback
            return $this->generateDynamicBackgrounds($theme, 6);
        }
        return $images;
    }

    private function resolvePath($path)
    {
        if (str_starts_with($path, 'http'))
            return $path;
        if (file_exists($path))
            return $path;
        if (str_starts_with($path, '/') || preg_match('/^[a-zA-Z]:\\\\/', $path))
            return $path;
        // Check direct public path first (for uploads/studio/...)
        $directPath = storage_path('app/public/' . $path);
        if (file_exists($directPath))
            return $directPath;

        // Fallback to legacy properties/ folder
        return storage_path('app/public/' . (str_starts_with($path, 'properties/') ? $path : 'properties/' . $path));
    }

    // ... keep getAudioDuration and generateDynamicBackgrounds inputs ...

    private function getAudioDuration($path)
    {
        try {
            $cmd = "ffmpeg -i " . escapeshellarg($path) . " 2>&1 | grep \"Duration\"";
            $output = shell_exec($cmd);
            if (preg_match('/Duration: ((\d+):(\d+):(\d+)\.\d+)/', $output, $matches)) {
                $parts = explode(':', $matches[1]);
                return floatval($parts[0] * 3600 + $parts[1] * 60 + $parts[2]);
            }
        } catch (\Throwable $e) {
        }
        return 0;
    }

    private function generateDynamicBackgrounds($theme, $count)
    {
        $dir = storage_path('app/public/temp_bg');
        if (!file_exists($dir))
            mkdir($dir, 0755, true);
        $palettes = [
            'luxury' => ['black', 'darkblue', '#2c5364'],
            'party' => ['purple', 'magenta', '#fc466b'],
            'nature' => ['forestgreen', 'lime', '#a8ff78'],
            'minimal' => ['white', 'lightgray', '#f7f8f8'],
        ];
        $colors = $palettes[$theme] ?? $palettes['luxury'];
        $paths = [];
        for ($i = 0; $i < $count; $i++) {
            $path = $dir . "/bg_{$theme}_{$i}_" . uniqid() . ".jpg";
            $c1 = $colors[$i % count($colors)];
            exec("ffmpeg -y -f lavfi -i \"color=c={$c1}:s=720x1280\" -frames:v 1 " . escapeshellarg($path) . " 2>&1");
            if (file_exists($path))
                $paths[] = $path;
        }
        return empty($paths) ? ['resortwala-logo.png'] : $paths;
    }
}
