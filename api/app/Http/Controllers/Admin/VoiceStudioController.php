<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VoiceProject;
use App\Services\TextToSpeechService;
use App\Services\VideoRenderingService;
use App\Models\VideoRenderJob;

// EMERGENCY FIX: Manually load model if autoloader is stale
if (file_exists(app_path('Models/VoiceProject.php'))) {
    require_once app_path('Models/VoiceProject.php');
}

class VoiceStudioController extends Controller
{
    // Services are now loaded on-demand to bypass Autoloader issues
    // protected $ttsService; 
    // protected $videoService;

    public function __construct()
    {
        // Constructor left empty to ensure instantiation always succeeds
    }

    /**
     * Helper to load TTS Service manually
     */
    private function getTtsService()
    {
        if (file_exists(app_path('Services/TextToSpeechService.php'))) {
            require_once app_path('Services/TextToSpeechService.php');
        }
        return new \App\Services\TextToSpeechService();
    }

    /**
     * Helper to load Video Service manually
     */
    private function getVideoService()
    {
        // VideoRenderingService likely exists, but let's be safe
        return app(\App\Services\VideoRenderingService::class);
    }


    /**
     * Get available voices
     */
    public function config()
    {
        return response()->json([
            'voices' => $this->getTtsService()->getVoices()
        ]);
    }

    /**
     * Create a Voice Project (Generate Audio)
     */
    public function generateAudio(Request $request)
    {
        try {
            $request->validate([
                'script_text' => 'required|string|min:10',
                'voice_id' => 'required|string',
                'language' => 'required|string'
            ]);

            // 1. Create Project
            $project = VoiceProject::create([
                'title' => $request->title ?? 'Untitled Project',
                'script_text' => $request->script_text,
                'voice_id' => $request->voice_id,
                'language' => $request->language,
                'status' => 'processing_audio'
            ]);

            // 2. Generate Audio (Simulation)
            $ttsService = $this->getTtsService();
            $audioPath = $ttsService->generateAudio(
                $request->script_text, 
                $request->voice_id, 
                $request->language
            );
            
            $project->update([
                'status' => 'audio_ready',
                'output_url' => $audioPath
            ]);

            return response()->json([
                'message' => 'Audio Generated',
                'project' => $project,
                'audio_url' => asset('storage/' . $audioPath)
            ]);

        } catch (\Throwable $e) {
            // Log full error
            \Illuminate\Support\Facades\Log::error("Voice Studio Error: " . $e->getMessage());
            
            // Return specific error to UI
            return response()->json([
                'error' => 'Server Error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Render Final Video (Merge Audio + Visuals)
     */
    public function renderVideo(Request $request, $id)
    {
        $project = VoiceProject::findOrFail($id);
        
        // If Visual Type is 'cinematic', we create a VideoRenderJob
        if ($request->visual_type === 'cinematic') {
            $project->update([
                'visual_type' => 'cinematic',
                'visual_options' => $request->visual_options, // { property_id: 123, media_ids: [...] }
                'status' => 'processing_video'
            ]);

            // Create a wrapper VideoRenderJob to reuse the engine
            $job = new VideoRenderJob();
            $job->property_id = $request->visual_options['property_id'];
            $job->template_id = 'luxury'; // Default style
            $job->status = 'pending';
            $job->options = [
                'title' => $project->title,
                'media_ids' => $request->visual_options['media_ids'],
                'audio_source' => $project->output_url, // Pass the TTS Audio!
                'mood' => 'custom_tts' // Flag for the engine to use provided audio
            ];
            $job->save();

            // Spawn Async Process (reusing the one we fixed)
            $phpBinary = 'php'; 
            $artisanPath = base_path('artisan');
            $command = "nohup {$phpBinary} {$artisanPath} video:process {$job->id} > /dev/null 2>&1 &";
            exec($command);

            return response()->json([
                'message' => 'Video Rendering Started',
                'project_id' => $project->id,
                'video_job_id' => $job->id
            ]);
        }

        return response()->json(['message' => 'Visual type not supported yet'], 400);
    }

    /**
     * EMERGENCY TOOL: Run Migrations via HTTP
     */
    /**
     * EMERGENCY TOOL: Run Migrations & Fix Autoload
     */
    public function setupDB()
    {
        $log = [];
        try {
            // 1. Debug File System
            $modelPath = app_path('Models');
            $files = glob($modelPath . '/*');
            $log[] = "Scanning {$modelPath}: " . implode(', ', array_map('basename', $files));
            
            $targetFile = app_path('Models/VoiceProject.php');
            $log[] = "Target File: {$targetFile}";
            $log[] = "Exists? " . (file_exists($targetFile) ? 'YES' : 'NO');
            $log[] = "Readable? " . (is_readable($targetFile) ? 'YES' : 'NO');

            // 2. Attempt Manual Require with different paths (Case Sensitivity Fix?)
            if (file_exists($targetFile)) {
                require_once $targetFile;
                $log[] = "Manual require executed.";
            }

            // 3. Run Migrations
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            $log[] = "Migration Output: " . \Illuminate\Support\Facades\Artisan::output();

            // 4. Try Composer Dump-Autoload (Blind Attempt)
            // Try common paths
            $composerPaths = ['composer', '/usr/bin/composer', '/usr/local/bin/composer'];
            foreach ($composerPaths as $bin) {
                $output = [];
                $returnVar = 0;
                exec("cd " . base_path() . " && $bin dump-autoload 2>&1", $output, $returnVar);
                if ($returnVar === 0) {
                    $log[] = "Composer Dump-Autoload Success ($bin)";
                    break;
                }
            }

            return response()->json([
                'message' => 'System Diagnosis Complete',
                'log' => $log,
                'class_exists' => class_exists('App\Models\VoiceProject') ? 'YES' : 'NO'
            ]);

        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(), 
                'log' => $log,
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
