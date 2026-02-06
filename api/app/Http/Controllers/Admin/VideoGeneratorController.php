<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\VideoRenderJob;
use App\Models\PropertyMaster;
use App\Services\VideoRenderingService;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class VideoGeneratorController extends Controller
{
    /**
     * Store a Prompt-Based Video Job (No Property ID necessary).
     */
    public function storePromptVideo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'prompt' => 'required|string|max:5000',
            'mood' => 'nullable|string',
            'aspect_ratio' => 'nullable|string|in:9:16,1:1', // '9:16' (Reel), '1:1' (Post)
            'voice_id' => 'nullable|string',
            'media_paths' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // 1. Analyze Prompt via AI Context Service
        $prompt = $request->input('prompt');
        $mood = $request->input('mood', 'energetic');

        $aiContext = $this->promptService->analyzePrompt($prompt, $mood);
        $script = $aiContext['script'];
        $visualTheme = $aiContext['visual_theme'];

        // 2. Generate Audio (TTS)
        $voiceId = $request->input('voice_id', 'atlas');
        $audioPath = null;
        try {
            $audioPath = $this->ttsService->generateAudio($script, $voiceId);
        } catch (\Exception $e) {
            return response()->json(['error' => 'TTS Failed: ' . $e->getMessage()], 500);
        }

        // 3. Create Job
        $job = new VideoRenderJob();
        $job->property_id = null; // Generic
        $job->template_id = 'prompt_generated'; // Special template in Service
        $job->status = 'pending';

        $options = [
            'title' => 'AI Generated Video', // Fallback title
            'prompt' => $prompt,
            'script' => $script,
            'audio_source' => $audioPath,
            'visual_theme' => $visualTheme,
            'music_mood' => $aiContext['music_mood'],
            'aspect_ratio' => $request->input('aspect_ratio', '9:16'),
            'media_paths' => $request->input('media_paths', []),
            'branding' => true
        ];

        $job->options = $options;
        $job->save();

        // Dispatch
        try {
            $this->service->processJob($job);
            return response()->json([
                'message' => 'Video Queued',
                'job_id' => $job->id,
                'script' => $script
            ]);
        } catch (\Exception $e) {
            $job->status = 'failed';
            $job->error_message = $e->getMessage();
            $job->save();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    protected $service;
    protected $ttsService;
    protected $scriptService;
    protected $promptService;

    public function __construct(
        VideoRenderingService $service,
        \App\Services\TextToSpeechService $ttsService,
        \App\Services\AIScriptGeneratorService $scriptService,
        \App\Services\AIPromptContextService $promptService
    ) {
        $this->service = $service;
        $this->ttsService = $ttsService;
        $this->scriptService = $scriptService;
        $this->promptService = $promptService;
    }

    /**
     * Start a new video generation job
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'property_id' => 'required|exists:property_masters,PropertyId',
            'template_id' => 'required|string',
            'options' => 'sometimes|array',
            'options.title' => 'nullable|string',
            'options.subtitle' => 'nullable|string',
            'options.music_style' => 'nullable|string',
            'options.media_ids' => 'sometimes|array',
            'options.script' => 'nullable|string',
            'options.voice_id' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $job = new VideoRenderJob();
        $job->property_id = $request->property_id;
        $job->template_id = $request->template_id;
        $job->status = 'pending';

        $options = $request->options ?? [];

        // Default Options
        if (empty($options['title'])) {
            $prop = PropertyMaster::find($request->property_id);
            $options['title'] = $prop ? $prop->Name : 'My Resort Video';
        }

        // --- NEW: Generate TTS Audio if script provided ---
        if (!empty($options['script']) && !empty($options['voice_id'])) {
            try {
                $audioPath = $this->ttsService->generateAudio($options['script'], $options['voice_id']);
                $options['audio_source'] = $audioPath;
            } catch (\Exception $e) {
                return response()->json(['error' => 'TTS Generation Failed: ' . $e->getMessage()], 422);
            }
        }

        $job->options = $options;
        $job->save();

        // Dispatch Job (Sync for now for debugging)
        // \App\Jobs\ProcessVideoRender::dispatch($job);

        // For immediate feedback in dev:
        try {
            $this->service->processJob($job);
            return response()->json(['message' => 'Video Queued', 'job_id' => $job->id]);
        } catch (\Exception $e) {
            $job->status = 'failed';
            $job->error_message = $e->getMessage();
            $job->save();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function index()
    {
        $jobs = VideoRenderJob::with('property')->orderBy('created_at', 'desc')->limit(20)->get();
        return response()->json($jobs);
    }

    public function show($id)
    {
        $job = VideoRenderJob::findOrFail($id);
        return response()->json($job);
    }

    public function retry($id)
    {
        $oldJob = VideoRenderJob::findOrFail($id);

        $newJob = $oldJob->replicate();
        $newJob->status = 'pending';
        $newJob->error_message = null;
        $newJob->created_at = now();
        $newJob->updated_at = now();
        $newJob->save();

        try {
            $this->service->processJob($newJob);
            return response()->json(['status' => 'success', 'message' => 'Retrying Job', 'job_id' => $newJob->id]);
        } catch (\Exception $e) {
            $newJob->status = 'failed';
            $newJob->error_message = $e->getMessage();
            $newJob->save();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $job = VideoRenderJob::findOrFail($id);
        // Delete file if exists
        if ($job->output_path && Storage::disk('public')->exists($job->output_path)) {
            Storage::disk('public')->delete($job->output_path);
        }
        $job->delete();
        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Get available TTS voices with gender constraints.
     */
    public function getVoices()
    {
        return response()->json($this->ttsService->getVoices());
    }

    /**
     * Auto-generate a script based on property metadata.
     */
    public function generateScript(Request $request)
    {
        $request->validate([
            'property_id' => 'required',
            'vibe' => 'nullable|string',
            'topic' => 'nullable|string'
        ]);

        if ($request->property_id == 0) {
            // Prompt-based generation (No Property)
            $topic = $request->topic ?? 'Luxury Stay';
            $data = $this->scriptService->generateFromPromptData($topic, $request->vibe ?? 'luxury');
            $scenes = $data['scenes'];
        } else {
            // Property-based generation
            $property = PropertyMaster::findOrFail($request->property_id);
            $data = $this->scriptService->generateScriptData($property, $request->vibe ?? 'luxury');
            $scenes = $data['scenes'];
        }

        $script = implode(" ", array_column($scenes, 'text'));
        return response()->json(['script' => $script, 'scenes' => $scenes]);
    }
}
