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

    public function index()
    {
        try {
            // Lazy Load Model if needed (Fallback for some environments)
            if (!class_exists('App\Models\VoiceProject')) {
                 if (file_exists(app_path('Models/VoiceProject.php'))) {
                     require_once app_path('Models/VoiceProject.php');
                 }
            }

            $projects = \App\Models\VoiceProject::latest()->limit(20)->get();
            return response()->json($projects);
        } catch (\Throwable $e) {
            return response()->json([], 200); // Return empty on error to prevent UI crash
        }
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

        // 2. Fetch Voice Project to get Audio Path
        $voiceProject = \App\Models\VoiceProject::findOrFail($id);
        $audioSource = $voiceProject->output_url;

        // 3. Create Job
        $job = new \App\Models\VideoRenderJob();
        $job->property_id = $request->visual_options['property_id'];
        $job->template_id = $request->visual_type; // 'cinematic' or 'avatar'
        $job->status = 'pending';
        // IMPORTANT: Pass 'audio_source' so the renderer knows where the file is
        $job->options = array_merge($request->visual_options, [
            'voice_project_id' => $id,
            'audio_source' => $audioSource
        ]);
        $job->save();

        // 4. Spawn Background Worker (Async)
        $phpBinary = 'php'; 
        $artisanPath = base_path('artisan');
        
        // Construct Command
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Windows: Use start /B to run in background
            $command = "start /B {$phpBinary} {$artisanPath} video:process {$job->id} > NUL 2>&1";
        } else {
            // Linux/Mac: Use nohup
            $command = "nohup {$phpBinary} {$artisanPath} video:process {$job->id} > /dev/null 2>&1 &";
        }

        // Execute
        if (function_exists('popen') && strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
             pclose(popen($command, "r"));
        } else {
             exec($command);
        }

        return response()->json([
            'message' => 'Video Rendering Started',
            'job_id' => $job->id,
            'status' => 'pending'
        ]);
    }

    public function setupDB()
    {
        // 1. Run Migrations
        try {
            \Illuminate\Support\Facades\Artisan::call('migrate --force');
        } catch (\Exception $e) {}

        return response()->json(['message' => 'Online']);
    }

    public function fixStorage()
    {
        $log = [];
        $log['user'] = exec('whoami');
        
        // 1. Force Re-Link
        try {
            $linkPath = public_path('storage');
            if (file_exists($linkPath)) {
                unlink($linkPath);
                $log[] = "Deleted existing symlink: $linkPath";
            }
            
            \Illuminate\Support\Facades\Artisan::call('storage:link');
            $log[] = "Ran storage:link: " . \Illuminate\Support\Facades\Artisan::output();
        } catch (\Exception $e) {
            $log[] = "Link Error: " . $e->getMessage();
        }

        // 2. Permissions & Directories
        try {
            $target = storage_path('app/public');
            
            // Ensure directories exist
            if (!file_exists($target)) mkdir($target, 0755, true);
            if (!file_exists($target.'/audio')) mkdir($target.'/audio', 0755, true);
            if (!file_exists($target.'/videos')) mkdir($target.'/videos', 0755, true);

            // Attempt chmod (may fail if not owner)
            @chmod($target, 0755);
            @chmod($target.'/audio', 0755);
            @chmod($target.'/videos', 0755);

            $log[] = "Verified directories at: $target";
        } catch (\Exception $e) {
            $log[] = "Permission Error: " . $e->getMessage();
        }
        
        return response()->json([
            'message' => 'Aggressive Storage Fix Executed',
            'log' => $log
        ]);
    }
}
