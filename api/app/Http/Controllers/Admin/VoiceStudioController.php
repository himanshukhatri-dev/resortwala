<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VoiceProject;

class VoiceStudioController extends Controller
{
    public function __construct() {}

    private function getTtsService()
    {
        if (file_exists(app_path('Services/TextToSpeechService.php'))) {
            require_once app_path('Services/TextToSpeechService.php');
        }
        return new \App\Services\TextToSpeechService();
    }

    public function config()
    {
        try {
            return response()->json([
                'voices' => $this->getTtsService()->getVoices()
            ]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function generateAudio(Request $request)
    {
        $request->validate([
            'script_text' => 'required|string|min:10',
            'voice_id' => 'required',
            'language' => 'required'
        ]);

        try {
            // Manually Load Model
            if (!class_exists('App\Models\VoiceProject')) {
                 if (file_exists(app_path('Models/VoiceProject.php'))) {
                     require_once app_path('Models/VoiceProject.php');
                 }
            }

            $project = VoiceProject::create([
                'title' => $request->title ?? 'Untitled',
                'script_text' => $request->script_text,
                'voice_id' => $request->voice_id,
                'language' => $request->language,
                'status' => 'audio_ready'
            ]);

            $audioPath = $this->getTtsService()->generateAudio(
                $request->script_text, 
                $request->voice_id, 
                $request->language
            );
            
            $project->update(['output_url' => $audioPath]);

            return response()->json([
                'message' => 'Audio Generated',
                'project' => $project,
                'audio_url' => asset('storage/' . $audioPath)
            ]);

        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function renderVideo(Request $request, $id)
    {
        // 1. Validate
        $request->validate([
            'visual_type' => 'required',
            'visual_options' => 'required|array',
            'visual_options.property_id' => 'required'
        ]);

        // 2. Create Job
        $job = new \App\Models\VideoRenderJob();
        $job->property_id = $request->visual_options['property_id'];
        $job->template_id = $request->visual_type; // 'cinematic' or 'avatar'
        $job->status = 'pending';
        $job->options = array_merge($request->visual_options, ['voice_project_id' => $id]);
        $job->save();

        // 3. Spawn Background Worker (Async)
        $phpBinary = 'php'; 
        $artisanPath = base_path('artisan');
        // "php artisan video:process {id} > /dev/null 2>&1 &"
        $command = "nohup {$phpBinary} {$artisanPath} video:process {$job->id} > /dev/null 2>&1 &";
        
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            $command = "start /B php {$artisanPath} video:process {$job->id}";
        }

        exec($command);

        return response()->json([
            'message' => 'Video Rendering Started',
            'job_id' => $job->id,
            'status' => 'pending'
        ]);
    }

    public function setupDB()
    {
        return response()->json(['message' => 'Online']);
    }
}
