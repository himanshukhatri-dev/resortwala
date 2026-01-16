<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VoiceProject;

class VoiceStudioController extends Controller
{
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
        // Validation outside try-catch to allow 422 responses
        $request->validate([
            'script_text' => 'required|string|min:10',
            'voice_id' => 'required|string',
            'language' => 'required|string'
        ]);

        try {
            // 1. Manually Load Model if needed
            if (!class_exists('App\Models\VoiceProject')) {
                 if (file_exists(app_path('Models/VoiceProject.php'))) {
                     require_once app_path('Models/VoiceProject.php');
                 }
            }

            // 2. Create Project
            $project = VoiceProject::create([
                'title' => $request->title ?? 'Untitled Project',
                'script_text' => $request->script_text,
                'voice_id' => $request->voice_id,
                'language' => $request->language,
                'status' => 'processing_audio'
            ]);

            // 3. Generate Audio
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
            \Illuminate\Support\Facades\Log::error("Voice Studio Error: " . $e->getMessage());
            return response()->json([
                'error' => 'Server Error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Render Final Video
     */
    public function renderVideo(Request $request, $id)
    {
        try {
             // Ensure Model Exists
            if (!class_exists('App\Models\VoiceProject')) {
                 if (file_exists(app_path('Models/VoiceProject.php'))) {
                     require_once app_path('Models/VoiceProject.php');
                 }
            }

            $project = VoiceProject::findOrFail($id);
            
            if ($request->visual_type === 'cinematic') {
                $project->update([
                    'visual_type' => 'cinematic',
                    'visual_options' => $request->visual_options,
                    'status' => 'processing_video'
                ]);

                // Create Job
                $job = new \App\Models\VideoRenderJob();
                $job->property_id = $request->visual_options['property_id'];
                $job->template_id = 'luxury';
                $job->status = 'pending';
                $job->options = [
                    'title' => $project->title,
                    'media_ids' => $request->visual_options['media_ids'],
                    'audio_source' => $project->output_url,
                    'mood' => 'custom_tts'
                ];
                $job->save();

                // Spawn Async Process
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

        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * EMERGENCY TOOL
     */
    public function setupDB()
    {
        return response()->json(['message' => 'System is Online']);
    }
}
